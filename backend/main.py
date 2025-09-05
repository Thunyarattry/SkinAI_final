from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import json
import subprocess
import uuid
from datetime import datetime
from pathlib import Path
import shutil
from typing import Optional, Dict, Any, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SkinAI API",
    description="AI-powered skin analysis and recommendation system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
UPLOAD_DIR = Path("uploads")
AI_MODELS_DIR = Path("ai_models")
UPLOAD_DIR.mkdir(exist_ok=True)
AI_MODELS_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Pydantic models
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, str]
    version: str

class AnalysisRequest(BaseModel):
    analysisData: Dict[str, Any]

class AnalysisResponse(BaseModel):
    success: bool
    analysisId: str
    timestamp: str
    originalImage: str
    croppedImage: Optional[str]
    faceDetection: Dict[str, Any]
    skinAnalysis: Dict[str, Any]
    recommendations: Optional[Dict[str, Any]]
    geminiSuccess: bool
    rawGeminiResponse: Optional[str] = None

class ErrorResponse(BaseModel):
    success: bool
    error: str
    details: Optional[str] = None
    analysisId: Optional[str] = None

class HistoryItem(BaseModel):
    analysisId: str
    timestamp: str
    skinType: Optional[str]
    acneSeverity: Optional[str]
    confidence: Optional[float]

class HistoryResponse(BaseModel):
    success: bool
    history: List[HistoryItem]

# Utility functions
def run_python_script(script_path: str, args: List[str] = None) -> Dict[str, Any]:
    """Run Python script and return JSON result"""
    if args is None:
        args = []
    
    try:
        cmd = ["python3", str(script_path)] + args
        logger.info(f"Running command: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60  # 60 second timeout
        )
        
        if result.returncode == 0:
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON output: {e}")
                logger.error(f"Raw output: {result.stdout}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to parse script output: {e}"
                )
        else:
            logger.error(f"Script failed with code {result.returncode}")
            logger.error(f"Error output: {result.stderr}")
            raise HTTPException(
                status_code=500,
                detail=f"Script failed: {result.stderr}"
            )
            
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=500,
            detail="Script execution timed out"
        )
    except Exception as e:
        logger.error(f"Error running script: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to run script: {str(e)}"
        )

def generate_analysis_id() -> str:
    """Generate unique analysis ID"""
    timestamp = int(datetime.now().timestamp() * 1000)
    random_suffix = str(uuid.uuid4().int)[:9]
    return f"skinai-{timestamp}-{random_suffix}"

def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file"""
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    max_size = 10 * 1024 * 1024  # 10MB
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed"
        )
    
    # Note: file.size might not be available in all cases
    # You might need to read the file to check size

async def save_upload_file(file: UploadFile, destination: Path) -> None:
    """Save uploaded file to destination"""
    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )

# API Routes

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        services={
            "opencv": "available",
            "yolo": "available",
            "gemini": "available"
        },
        version="1.0.0"
    )

@app.post("/api/upload", response_model=AnalysisResponse)
async def upload_and_analyze(file: UploadFile = File(...)):
    """Upload and analyze image endpoint"""
    analysis_id = None
    file_path = None
    
    try:
        # Validate file
        validate_image_file(file)
        
        # Generate analysis ID and file path
        analysis_id = generate_analysis_id()
        file_extension = Path(file.filename).suffix
        filename = f"{analysis_id}{file_extension}"
        file_path = UPLOAD_DIR / filename
        
        # Save uploaded file
        await save_upload_file(file, file_path)
        
        logger.info(f"Starting analysis for {analysis_id}...")
        
        # Step 1: OpenCV Face Detection and Cropping
        logger.info("Step 1: Face detection with OpenCV...")
        opencv_script = AI_MODELS_DIR / "opencv_processor.py"
        face_data = run_python_script(opencv_script, [str(file_path)])
        
        if not face_data.get("faceDetected", False):
            # Clean up uploaded file
            if file_path.exists():
                file_path.unlink()
            
            raise HTTPException(
                status_code=400,
                detail="No face detected in the image. Please upload a clear face photo."
            )
        
        # Step 2: YOLOv8 Skin Analysis
        logger.info("Step 2: Skin analysis with YOLOv8...")
        yolo_script = AI_MODELS_DIR / "yolo_analyzer.py"
        cropped_image_path = face_data.get("croppedImagePath", str(file_path))
        analysis_data = run_python_script(yolo_script, [cropped_image_path])
        
        if analysis_data.get("error"):
            raise HTTPException(
                status_code=500,
                detail=f"YOLO analysis failed: {analysis_data['error']}"
            )
        
        # Step 3: Generate Gemini Recommendations
        logger.info("Step 3: Generating recommendations with Gemini...")
        gemini_script = AI_MODELS_DIR / "gemini_recommender.py"
        recommendations_result = run_python_script(
            gemini_script, 
            [json.dumps(analysis_data)]
        )
        
        # Prepare response
        cropped_image_name = None
        if face_data.get("croppedImagePath"):
            cropped_image_name = Path(face_data["croppedImagePath"]).name
        
        result = AnalysisResponse(
            success=True,
            analysisId=analysis_id,
            timestamp=datetime.now().isoformat(),
            originalImage=f"/uploads/{filename}",
            croppedImage=f"/uploads/{cropped_image_name}" if cropped_image_name else None,
            faceDetection={
                "detected": face_data.get("faceDetected", False),
                "coordinates": face_data.get("faceCoordinates"),
                "originalSize": face_data.get("originalSize"),
                "croppedSize": face_data.get("croppedSize")
            },
            skinAnalysis={
                "skinType": analysis_data.get("skinType"),
                "acneSeverity": analysis_data.get("acneSeverity"),
                "detectedIssues": analysis_data.get("detectedIssues"),
                "confidence": analysis_data.get("confidence"),
                "detectionCounts": analysis_data.get("detectionCounts"),
                "analysisDetails": analysis_data.get("analysisDetails")
            },
            recommendations=recommendations_result.get("recommendations"),
            geminiSuccess=recommendations_result.get("success", False),
            rawGeminiResponse=recommendations_result.get("rawResponse")
        )
        
        # Store result for later retrieval
        result_path = UPLOAD_DIR / f"{analysis_id}_result.json"
        with open(result_path, 'w') as f:
            json.dump(result.dict(), f, indent=2)
        
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        
        # Clean up files on error
        if file_path and file_path.exists():
            file_path.unlink()
        
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                success=False,
                error="Failed to process image",
                details=str(e),
                analysisId=analysis_id
            ).dict()
        )

@app.get("/api/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str):
    """Get analysis results by ID"""
    try:
        result_path = UPLOAD_DIR / f"{analysis_id}_result.json"
        
        if not result_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Analysis not found"
            )
        
        with open(result_path, 'r') as f:
            result = json.load(f)
        
        return AnalysisResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve analysis: {str(e)}"
        )

@app.get("/api/history", response_model=HistoryResponse)
async def get_history():
    """Get user's analysis history"""
    try:
        result_files = list(UPLOAD_DIR.glob("*_result.json"))
        history_items = []
        
        for result_file in result_files:
            try:
                with open(result_file, 'r') as f:
                    result = json.load(f)
                
                history_items.append(HistoryItem(
                    analysisId=result["analysisId"],
                    timestamp=result["timestamp"],
                    skinType=result.get("skinAnalysis", {}).get("skinType"),
                    acneSeverity=result.get("skinAnalysis", {}).get("acneSeverity"),
                    confidence=result.get("skinAnalysis", {}).get("confidence")
                ))
            except Exception as e:
                logger.warning(f"Error reading result file {result_file}: {e}")
                continue
        
        # Sort by timestamp (newest first)
        history_items.sort(key=lambda x: x.timestamp, reverse=True)
        
        return HistoryResponse(success=True, history=history_items)
        
    except Exception as e:
        logger.error(f"Error retrieving history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve history: {str(e)}"
        )

@app.delete("/api/analysis/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """Delete analysis"""
    try:
        files_to_delete = [
            f"{analysis_id}.jpg",
            f"{analysis_id}.png", 
            f"{analysis_id}.jpeg",
            f"{analysis_id}_cropped.jpg",
            f"{analysis_id}_result.json"
        ]
        
        deleted_count = 0
        for filename in files_to_delete:
            file_path = UPLOAD_DIR / filename
            if file_path.exists():
                file_path.unlink()
                deleted_count += 1
        
        return {
            "success": True,
            "message": f"Deleted {deleted_count} files for analysis {analysis_id}"
        }
        
    except Exception as e:
        logger.error(f"Error deleting analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete analysis: {str(e)}"
        )

@app.post("/api/analysis/{analysis_id}/regenerate")
async def regenerate_recommendations(analysis_id: str):
    """Generate new recommendations for existing analysis"""
    try:
        result_path = UPLOAD_DIR / f"{analysis_id}_result.json"
        
        if not result_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Analysis not found"
            )
        
        with open(result_path, 'r') as f:
            existing_result = json.load(f)
        
        analysis_data = existing_result["skinAnalysis"]
        
        # Generate new recommendations
        gemini_script = AI_MODELS_DIR / "gemini_recommender.py"
        recommendations_result = run_python_script(
            gemini_script,
            [json.dumps(analysis_data)]
        )
        
        # Update result
        existing_result["recommendations"] = recommendations_result.get("recommendations")
        existing_result["geminiSuccess"] = recommendations_result.get("success", False)
        existing_result["rawGeminiResponse"] = recommendations_result.get("rawResponse")
        existing_result["lastUpdated"] = datetime.now().isoformat()
        
        # Save updated result
        with open(result_path, 'w') as f:
            json.dump(existing_result, f, indent=2)
        
        return {
            "success": True,
            "recommendations": recommendations_result.get("recommendations"),
            "analysisId": analysis_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error regenerating recommendations: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to regenerate recommendations: {str(e)}"
        )

# Test endpoints
@app.post("/api/test/opencv")
async def test_opencv(file: UploadFile = File(...)):
    """Test OpenCV component"""
    try:
        validate_image_file(file)
        
        # Save temporary file
        temp_path = UPLOAD_DIR / f"temp_{uuid.uuid4().hex}{Path(file.filename).suffix}"
        await save_upload_file(file, temp_path)
        
        try:
            opencv_script = AI_MODELS_DIR / "opencv_processor.py"
            result = run_python_script(opencv_script, [str(temp_path)])
            return result
        finally:
            # Clean up temp file
            if temp_path.exists():
                temp_path.unlink()
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/test/yolo")
async def test_yolo(file: UploadFile = File(...)):
    """Test YOLO component"""
    try:
        validate_image_file(file)
        
        # Save temporary file
        temp_path = UPLOAD_DIR / f"temp_{uuid.uuid4().hex}{Path(file.filename).suffix}"
        await save_upload_file(file, temp_path)
        
        try:
            yolo_script = AI_MODELS_DIR / "yolo_analyzer.py"
            result = run_python_script(yolo_script, [str(temp_path)])
            return result
        finally:
            # Clean up temp file
            if temp_path.exists():
                temp_path.unlink()
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/test/gemini")
async def test_gemini(request: AnalysisRequest):
    """Test Gemini component"""
    try:
        gemini_script = AI_MODELS_DIR / "gemini_recommender.py"
        result = run_python_script(
            gemini_script,
            [json.dumps(request.analysisData)]
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail}
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
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
        log_level="info"
    )
