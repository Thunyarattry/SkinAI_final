from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import os
import json
import subprocess
import uuid
import asyncio
from datetime import datetime
from pathlib import Path
import shutil
from typing import Optional, Dict, Any, List
import logging
import aiofiles
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SkinAI API",
    description="AI-powered skin analysis and recommendation system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ✅ CORS MIDDLEWARE CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://localhost:3000",
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    expose_headers=["*"]
)

# Create necessary directories
UPLOAD_DIR = Path("uploads")
AI_MODELS_DIR = Path("ai_models")
UPLOAD_DIR.mkdir(exist_ok=True)
AI_MODELS_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ✅ PYDANTIC MODELS
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, str]
    version: str

class AnalysisRequest(BaseModel):
    analysisData: Dict[str, Any]

class AnalysisResponse(BaseModel):
    success: bool
    analysisId: Optional[str] = None
    timestamp: str
    originalImage: Optional[str] = None
    croppedImage: Optional[str] = None
    faceDetection: Optional[Dict[str, Any]] = None
    skinAnalysis: Optional[Dict[str, Any]] = None
    recommendations: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    geminiSuccess: bool = False

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[str] = None

# ✅ UTILITY FUNCTIONS
def generate_analysis_id() -> str:
    """Generate unique analysis ID"""
    timestamp = int(datetime.now().timestamp() * 1000)
    random_id = str(uuid.uuid4()).replace('-', '')[:12]
    return f"skinai-{timestamp}-{random_id}"

def get_file_extension(filename: str) -> str:
    """Get file extension"""
    return Path(filename).suffix.lower()

def is_valid_image(filename: str) -> bool:
    """Check if file is a valid image"""
    valid_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
    return get_file_extension(filename) in valid_extensions

async def save_upload_file(upload_file: UploadFile, destination: Path) -> None:
    """Save uploaded file to destination"""
    async with aiofiles.open(destination, 'wb') as f:
        while chunk := await upload_file.read(1024):
            await f.write(chunk)

def run_subprocess(command: List[str], input_data: str = None) -> Dict[str, Any]:
    """Run subprocess and return JSON result"""
    try:
        logger.info(f"Running command: {' '.join(command)}")
        
        if input_data:
            result = subprocess.run(
                command,
                input=input_data,
                capture_output=True,
                text=True,
                timeout=60
            )
        else:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=60
            )
        
        if result.returncode != 0:
            logger.error(f"Command failed with return code {result.returncode}")
            logger.error(f"STDERR: {result.stderr}")
            return {
                "success": False,
                "error": f"Process failed: {result.stderr}",
                "returncode": result.returncode
            }
        
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON output: {e}")
            logger.error(f"Raw output: {result.stdout}")
            return {
                "success": False,
                "error": "Invalid JSON response from subprocess",
                "raw_output": result.stdout
            }
            
    except subprocess.TimeoutExpired:
        logger.error("Subprocess timed out")
        return {"success": False, "error": "Process timed out"}
    except Exception as e:
        logger.error(f"Subprocess error: {e}")
        return {"success": False, "error": str(e)}

# ✅ OPTIONS HANDLER FOR PREFLIGHT REQUESTS
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# ✅ API ROUTES
@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "SkinAI Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    services = {}
    
    # Check OpenCV
    opencv_script = AI_MODELS_DIR / "opencv_processor.py"
    services["opencv"] = "available" if opencv_script.exists() else "missing"
    
    # Check YOLO
    yolo_script = AI_MODELS_DIR / "yolo_analyzer.py"
    services["yolo"] = "available" if yolo_script.exists() else "missing"
    
    # Check Gemini
    gemini_script = AI_MODELS_DIR / "gemini_recommender.py"
    services["gemini"] = "available" if gemini_script.exists() else "missing"
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        services=services,
        version="1.0.0"
    )

@app.post("/api/upload", response_model=AnalysisResponse)
async def upload_and_analyze(file: UploadFile = File(...)):
    """Main endpoint for uploading and analyzing skin images"""
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not is_valid_image(file.filename):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload an image file (JPG, PNG, GIF, WEBP, BMP)"
        )
    
    # Check file size (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size too large. Maximum 10MB allowed")
    
    analysis_id = generate_analysis_id()
    file_extension = get_file_extension(file.filename)
    original_filename = f"{analysis_id}{file_extension}"
    original_path = UPLOAD_DIR / original_filename
    
    try:
        # Save uploaded file
        await save_upload_file(file, original_path)
        logger.info(f"File saved: {original_path}")
        
        # Initialize response
        response_data = {
            "success": True,
            "analysisId": analysis_id,
            "timestamp": datetime.now().isoformat(),
            "originalImage": f"/uploads/{original_filename}",
            "geminiSuccess": False
        }
        
        # Step 1: OpenCV Face Detection and Skin Analysis
        opencv_script = AI_MODELS_DIR / "opencv_processor.py"
        if opencv_script.exists():
            logger.info("Running OpenCV analysis...")
            opencv_result = run_subprocess([
                "python", str(opencv_script), str(original_path)
            ])
            
            if opencv_result.get("faceDetected"):
                response_data["faceDetection"] = {
                    "detected": True,
                    "coordinates": opencv_result.get("faceCoordinates", {}),
                    "originalSize": opencv_result.get("originalSize", {}),
                    "croppedSize": opencv_result.get("croppedSize", {})
                }
                
                # Add cropped image path if available
                if opencv_result.get("croppedImagePath"):
                    cropped_filename = Path(opencv_result["croppedImagePath"]).name
                    response_data["croppedImage"] = f"/uploads/{cropped_filename}"
                
                # Add skin analysis
                if opencv_result.get("skinAnalysis"):
                    response_data["skinAnalysis"] = opencv_result["skinAnalysis"]
            else:
                response_data["faceDetection"] = {
                    "detected": False,
                    "message": opencv_result.get("message", "No face detected")
                }
                logger.warning("No face detected in image")
        else:
            logger.warning("OpenCV script not found")
            response_data["faceDetection"] = {
                "detected": False,
                "message": "OpenCV processor not available"
            }
        
        # Step 2: YOLO Skin Condition Analysis
        yolo_script = AI_MODELS_DIR / "yolo_analyzer.py"
        if yolo_script.exists():
            logger.info("Running YOLO analysis...")
            
            # Use cropped image if available, otherwise original
            analysis_image = original_path
            if response_data.get("croppedImage"):
                cropped_path = UPLOAD_DIR / Path(response_data["croppedImage"]).name
                if cropped_path.exists():
                    analysis_image = cropped_path
            
            yolo_result = run_subprocess([
                "python", str(yolo_script), str(analysis_image)
            ])
            
            if yolo_result.get("skinType"):
                # Merge YOLO results with existing skin analysis
                if "skinAnalysis" not in response_data:
                    response_data["skinAnalysis"] = {}
                
                response_data["skinAnalysis"].update({
                    "skinType": yolo_result.get("skinType"),
                    "acneSeverity": yolo_result.get("acneSeverity"),
                    "confidence": yolo_result.get("confidence"),
                    "detectedIssues": yolo_result.get("detectedIssues", []),
                    "detectionCounts": yolo_result.get("detectionCounts", {}),
                    "analysisDetails": yolo_result.get("analysisDetails", {})
                })
                logger.info(f"YOLO detected skin type: {yolo_result.get('skinType')}")
        else:
            logger.warning("YOLO script not found")
        
        # Step 3: Gemini AI Recommendations
        gemini_script = AI_MODELS_DIR / "gemini_recommender.py"
        if gemini_script.exists() and response_data.get("skinAnalysis"):
            logger.info("Generating Gemini recommendations...")
            
            # Prepare analysis data for Gemini
            analysis_data = response_data["skinAnalysis"]
            analysis_json = json.dumps(analysis_data)
            
            gemini_result = run_subprocess([
                "python", str(gemini_script), analysis_json
            ])
            
            if gemini_result.get("success") and gemini_result.get("recommendations"):
                response_data["recommendations"] = gemini_result["recommendations"]
                response_data["geminiSuccess"] = True
                logger.info("Gemini recommendations generated successfully")
            else:
                logger.warning(f"Gemini failed: {gemini_result.get('error', 'Unknown error')}")
                # Provide fallback recommendations
                response_data["recommendations"] = {
                    "skinType": analysis_data.get("skinType", "Normal"),
                    "conditionAssessment": "Basic skin analysis completed",
                    "skincareRecommendations": [
                        "Use gentle, pH-balanced cleanser",
                        "Apply broad-spectrum sunscreen daily",
                        "Moisturize regularly with suitable products",
                        "Maintain consistent skincare routine"
                    ],
                    "lifestyleRecommendations": [
                        "Stay hydrated with adequate water intake",
                        "Maintain healthy diet with fruits and vegetables",
                        "Get sufficient sleep for skin repair"
                    ],
                    "dermatologistAdvice": "Consult a dermatologist if concerns persist",
                    "improvementTimeline": "4-8 weeks with consistent care"
                }
        else:
            logger.warning("Gemini script not found or no skin analysis available")
        
        # Save analysis result to file for history
        analysis_file = UPLOAD_DIR / f"{analysis_id}_analysis.json"
        async with aiofiles.open(analysis_file, 'w') as f:
            await f.write(json.dumps(response_data, indent=2))
        
        logger.info(f"Analysis completed successfully: {analysis_id}")
        return AnalysisResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        
        # Clean up files on error
        try:
            if original_path.exists():
                original_path.unlink()
        except:
            pass
        
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@app.get("/api/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    """Get analysis result by ID"""
    analysis_file = UPLOAD_DIR / f"{analysis_id}_analysis.json"
    
    if not analysis_file.exists():
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    try:
        async with aiofiles.open(analysis_file, 'r') as f:
            content = await f.read()
            return json.loads(content)
    except Exception as e:
        logger.error(f"Failed to load analysis {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to load analysis")

@app.get("/api/history")
async def get_history():
    """Get analysis history"""
    try:
        history = []
        
        for analysis_file in UPLOAD_DIR.glob("*_analysis.json"):
            try:
                async with aiofiles.open(analysis_file, 'r') as f:
                    content = await f.read()
                    analysis = json.loads(content)
                    
                    # Add summary info
                    history.append({
                        "analysisId": analysis.get("analysisId"),
                        "timestamp": analysis.get("timestamp"),
                        "skinType": analysis.get("skinAnalysis", {}).get("skinType"),
                        "acneSeverity": analysis.get("skinAnalysis", {}).get("acneSeverity"),
                        "faceDetected": analysis.get("faceDetection", {}).get("detected", False),
                        "originalImage": analysis.get("originalImage"),
                        "croppedImage": analysis.get("croppedImage")
                    })
            except Exception as e:
                logger.warning(f"Failed to load analysis file {analysis_file}: {e}")
                continue
        
        # Sort by timestamp (newest first)
        history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return {
            "success": True,
            "count": len(history),
            "history": history
        }
        
    except Exception as e:
        logger.error(f"Failed to get history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get history")

@app.delete("/api/analysis/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """Delete analysis and associated files"""
    try:
        deleted_files = []
        
        # Delete analysis JSON file
        analysis_file = UPLOAD_DIR / f"{analysis_id}_analysis.json"
        if analysis_file.exists():
            analysis_file.unlink()
            deleted_files.append(str(analysis_file))
        
        # Delete image files
        for pattern in [f"{analysis_id}.*", f"{analysis_id}_cropped.*"]:
            for file_path in UPLOAD_DIR.glob(pattern):
                if file_path.is_file():
                    file_path.unlink()
                    deleted_files.append(str(file_path))
        
        if not deleted_files:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        return {
            "success": True,
            "message": f"Analysis {analysis_id} deleted successfully",
            "deletedFiles": deleted_files
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete analysis {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete analysis")

@app.post("/api/analysis/{analysis_id}/regenerate")
async def regenerate_recommendations(analysis_id: str):
    """Regenerate recommendations for existing analysis"""
    analysis_file = UPLOAD_DIR / f"{analysis_id}_analysis.json"
    
    if not analysis_file.exists():
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    try:
        # Load existing analysis
        async with aiofiles.open(analysis_file, 'r') as f:
            content = await f.read()
            analysis_data = json.loads(content)
        
        # Regenerate recommendations using Gemini
        gemini_script = AI_MODELS_DIR / "gemini_recommender.py"
        if not gemini_script.exists():
            raise HTTPException(status_code=503, detail="Gemini recommender not available")
        
        skin_analysis = analysis_data.get("skinAnalysis", {})
        if not skin_analysis:
            raise HTTPException(status_code=400, detail="No skin analysis data found")
        
        analysis_json = json.dumps(skin_analysis)
        gemini_result = run_subprocess([
            "python", str(gemini_script), analysis_json
        ])
        
        if gemini_result.get("success") and gemini_result.get("recommendations"):
            # Update analysis with new recommendations
            analysis_data["recommendations"] = gemini_result["recommendations"]
            analysis_data["geminiSuccess"] = True
            analysis_data["lastRegenerated"] = datetime.now().isoformat()
            
            # Save updated analysis
            async with aiofiles.open(analysis_file, 'w') as f:
                await f.write(json.dumps(analysis_data, indent=2))
            
            return {
                "success": True,
                "message": "Recommendations regenerated successfully",
                "recommendations": gemini_result["recommendations"]
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to regenerate recommendations: {gemini_result.get('error', 'Unknown error')}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to regenerate recommendations for {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to regenerate recommendations")

# ✅ TEST ENDPOINTS
@app.post("/api/test/opencv")
async def test_opencv(file: UploadFile = File(...)):
    """Test OpenCV processor"""
    if not is_valid_image(file.filename):
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Save temporary file
    temp_filename = f"test_opencv_{int(datetime.now().timestamp())}{get_file_extension(file.filename)}"
    temp_path = UPLOAD_DIR / temp_filename
    
    try:
        await save_upload_file(file, temp_path)
        
        opencv_script = AI_MODELS_DIR / "opencv_processor.py"
        if not opencv_script.exists():
            raise HTTPException(status_code=503, detail="OpenCV processor not available")
        
        result = run_subprocess(["python", str(opencv_script), str(temp_path)])
        
        return {
            "success": True,
            "message": "OpenCV test completed",
            "result": result
        }
        
    finally:
        # Clean up temp file
        if temp_path.exists():
            temp_path.unlink()

@app.post("/api/test/yolo")
async def test_yolo(file: UploadFile = File(...)):
    """Test YOLO analyzer"""
    if not is_valid_image(file.filename):
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Save temporary file
    temp_filename = f"test_yolo_{int(datetime.now().timestamp())}{get_file_extension(file.filename)}"
    temp_path = UPLOAD_DIR / temp_filename
    
    try:
        await save_upload_file(file, temp_path)
        
        yolo_script = AI_MODELS_DIR / "yolo_analyzer.py"
        if not yolo_script.exists():
            raise HTTPException(status_code=503, detail="YOLO analyzer not available")
        
        result = run_subprocess(["python", str(yolo_script), str(temp_path)])
        
        return {
            "success": True,
            "message": "YOLO test completed",
            "result": result
        }
        
    finally:
        # Clean up temp file
        if temp_path.exists():
            temp_path.unlink()

@app.post("/api/test/gemini")
async def test_gemini(request: AnalysisRequest):
    """Test Gemini recommender"""
    gemini_script = AI_MODELS_DIR / "gemini_recommender.py"
    if not gemini_script.exists():
        raise HTTPException(status_code=503, detail="Gemini recommender not available")
    
    analysis_json = json.dumps(request.analysisData)
    result = run_subprocess(["python", str(gemini_script), analysis_json])
    
    return {
        "success": True,
        "message": "Gemini test completed",
        "result": result
    }

# ✅ ERROR HANDLERS
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "details": str(exc)
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", 
            "Access-Control-Allow-Headers": "*",
        }
    )

# ✅ STARTUP EVENT
@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("SkinAI Backend API starting up...")
    logger.info(f"Upload directory: {UPLOAD_DIR.absolute()}")
    logger.info(f"AI models directory: {AI_MODELS_DIR.absolute()}")
    
    # Check AI model scripts
    scripts = ["opencv_processor.py", "yolo_analyzer.py", "gemini_recommender.py"]
    for script in scripts:
        script_path = AI_MODELS_DIR / script
        if script_path.exists():
            logger.info(f"✅ {script} found")
        else:
            logger.warning(f"⚠️  {script} not found")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("SkinAI Backend API shutting down...")

# ✅ MAIN ENTRY POINT
if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info",
        access_log=True
    )
