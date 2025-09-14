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
    title="SkinAI API - Advanced Face Detection with Topic-Specific Gemini",
    description="AI-powered skin analysis with advanced face detection and topic-specific Gemini AI recommendations",
    version="2.2.0",
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

# ✅ ENHANCED PYDANTIC MODELS
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, str]
    version: str
    advanced_features: Dict[str, bool]

class FaceDetectionInfo(BaseModel):
    detected: bool
    coordinates: Optional[Dict[str, int]] = None
    confidence: Optional[float] = None
    detection_method: Optional[str] = None
    face_analysis: Optional[Dict[str, Any]] = None
    total_faces: Optional[int] = None
    message: Optional[str] = None

class SkinAnalysisResult(BaseModel):
    success: bool
    total_detections: int
    detected_classes: int
    detectedIssues: List[str]
    detectionCounts: Dict[str, int]
    detection_details: Dict[str, Any]
    opencv_analysis: Dict[str, Any]
    face_detection: FaceDetectionInfo
    analysis_method: str
    overall_health: Optional[Dict[str, Any]] = None

class AnalysisResponse(BaseModel):
    success: bool
    analysisId: Optional[str] = None
    timestamp: str
    originalImage: Optional[str] = None
    croppedImage: Optional[str] = None
    faceDetection: Optional[FaceDetectionInfo] = None
    skinAnalysis: Optional[SkinAnalysisResult] = None
    recommendations: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    geminiSuccess: bool = False
    processing_time: Optional[float] = None

# 🆕 TOPIC-SPECIFIC MODELS
class TopicRequest(BaseModel):
    skinAnalysis: Dict[str, Any]
    topic: str
    prompt: str
    language: str = "th"

class BulkTopicsRequest(BaseModel):
    skinAnalysis: Dict[str, Any]
    topics: List[Dict[str, str]]
    language: str = "th"

class GeminiRequest(BaseModel):
    skinAnalysis: Dict[str, Any]
    prompt: str = ""
    language: str = "th"

# 🆕 ADVANCED ANALYSIS MODELS
class AdvancedAnalysisRequest(BaseModel):
    enable_advanced_detection: bool = True
    enable_face_analysis: bool = True
    enable_skin_regions: bool = True
    debug_mode: bool = False
    language: str = "th"

class FaceAnalysisRequest(BaseModel):
    analysis_id: str
    focus_areas: List[str] = ["acne", "pores", "redness", "texture"]
    language: str = "th"

# ✅ UTILITY FUNCTIONS
def generate_analysis_id() -> str:
    """Generate unique analysis ID"""
    timestamp = int(datetime.now().timestamp() * 1000)
    random_id = str(uuid.uuid4()).replace('-', '')[:12]
    return f"skinai-topic-{timestamp}-{random_id}"

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

def run_subprocess_advanced(command: List[str], input_data: str = None, timeout: int = 180) -> Dict[str, Any]:
    """Enhanced subprocess runner with better error handling"""
    try:
        logger.info(f"🔄 Running advanced command: {' '.join(command)}")
        start_time = datetime.now()
        
        # Set environment variables for advanced features
        env = os.environ.copy()
        env['OPENCV_ADVANCED_MODE'] = 'true'
        env['FACE_DETECTION_ENHANCED'] = 'true'
        
        if input_data:
            result = subprocess.run(
                command,
                input=input_data,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=env
            )
        else:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=env
            )
        
        processing_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"⏱️ Command completed in {processing_time:.2f} seconds")
        
        if result.returncode != 0:
            logger.error(f"❌ Command failed with return code {result.returncode}")
            logger.error(f"STDERR: {result.stderr}")
            return {
                "success": False,
                "error": f"Process failed: {result.stderr}",
                "returncode": result.returncode,
                "processing_time": processing_time
            }
        
        try:
            parsed_result = json.loads(result.stdout)
            parsed_result["processing_time"] = processing_time
            return parsed_result
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse JSON output: {e}")
            logger.error(f"Raw output: {result.stdout}")
            return {
                "success": False,
                "error": "Invalid JSON response from subprocess",
                "raw_output": result.stdout,
                "processing_time": processing_time
            }
            
    except subprocess.TimeoutExpired:
        logger.error(f"⏰ Subprocess timed out after {timeout} seconds")
        return {"success": False, "error": f"Process timed out after {timeout} seconds"}
    except Exception as e:
        logger.error(f"❌ Subprocess error: {e}")
        return {"success": False, "error": str(e)}

# ✅ SIMPLE GEMINI TEST FUNCTION
async def simple_gemini_test():
    """Simple Gemini test without external script"""
    try:
        import google.generativeai as genai
        
        # ตั้งค่า API Key
        api_key = (
            os.getenv('GEMINI_API_KEY') or 
            os.getenv('GOOGLE_API_KEY') or
            "AIzaSyDQMvla98RH0xfwAguSbOgHLyQJVhvjBrQ"
        )
        
        if not api_key:
            return {
                "available": False,
                "error": "No Gemini API key found",
                "message": "Please set GEMINI_API_KEY environment variable"
            }
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # ทดสอบ API
        response = model.generate_content("Say 'Gemini API is working'")
        
        if response and response.text:
            return {
                "available": True,
                "message": "Gemini AI is ready (direct test)",
                "version": "2.2.0",
                "model": "gemini-1.5-flash",
                "features": {
                    "topicSpecific": True,
                    "bulkGeneration": True,
                    "multiLanguage": True,
                    "advancedPrompts": True
                },
                "response": {
                    "status": "working",
                    "test_response": response.text[:100]
                },
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "available": False,
                "error": "Gemini API not responding",
                "message": "API key may be invalid"
            }
            
    except ImportError:
        return {
            "available": False,
            "error": "google-generativeai package not installed",
            "message": "Please install: pip install google-generativeai"
        }
    except Exception as e:
        return {
            "available": False,
            "error": f"Gemini test failed: {str(e)}",
            "message": "Gemini AI is not available"
        }

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
        "message": "SkinAI Backend API with Topic-Specific Gemini AI",
        "version": "2.2.0",
        "features": "Advanced Face Detection, Enhanced Skin Analysis, Topic-Specific Gemini AI",
        "docs": "/docs",
        "health": "/api/health",
        "gemini": "/api/gemini/status",
        "topics": "/api/gemini/topic"
    }

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Enhanced health check endpoint"""
    services = {}
    advanced_features = {}
    
    # Check OpenCV Advanced Skin Analyzer
    opencv_script = AI_MODELS_DIR / "opencv_skin_analyzer.py"
    services["opencv_advanced"] = "available" if opencv_script.exists() else "missing"
    advanced_features["advanced_face_detection"] = opencv_script.exists()
    
    # Check legacy OpenCV processor
    opencv_legacy = AI_MODELS_DIR / "opencv_processor.py"
    services["opencv_legacy"] = "available" if opencv_legacy.exists() else "missing"
    
    # Check YOLO
    yolo_script = AI_MODELS_DIR / "yolo_analyzer.py"
    services["yolo"] = "available" if yolo_script.exists() else "missing"
    
    # Check Gemini
    gemini_script = AI_MODELS_DIR / "gemini_recommender.py"
    services["gemini"] = "available" if gemini_script.exists() else "missing"
    advanced_features["gemini_ai"] = gemini_script.exists()
    advanced_features["topic_specific_ai"] = gemini_script.exists()
    
    # Check environment variables
    advanced_features["google_api_configured"] = bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"))
    advanced_features["debug_mode"] = os.getenv("DEBUG_SKIN_ANALYSIS", "false").lower() == "true"
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        services=services,
        version="2.2.0",
        advanced_features=advanced_features
    )

# 🆕 GEMINI STATUS CHECK - FIXED
@app.get("/api/gemini/status")
async def get_gemini_status():
    """Check Gemini AI availability - ใช้ simple status check"""
    
    # ✅ ใช้ gemini_status_check.py แทน gemini_recommender.py
    status_script = AI_MODELS_DIR / "gemini_status_check.py"
    
    if not status_script.exists():
        # ถ้าไม่มี status script ให้ทดสอบแบบง่าย
        logger.info("🔍 Using direct Gemini test (no status script)")
        return await simple_gemini_test()
    
    try:
        logger.info(f"🔍 Running simple Gemini status check")
        
        # ข้อมูลสำหรับ status check เท่านั้น
        test_data = {
            "requestType": "status_check",
            "language": "th"
        }
        
        # เรียก status check script
        result = run_subprocess_advanced([
            "python3", str(status_script), 
            json.dumps(test_data, ensure_ascii=False)
        ], timeout=20)
        
        logger.info(f"Status check result: {result.get('success', False)}")
        
        if result.get("success") and result.get("available"):
            return {
                "available": True,
                "message": "Gemini AI is ready with topic-specific features",
                "version": "2.2.0",
                "model": result.get("model", "gemini-1.5-flash"),
                "features": {
                    "topicSpecific": True,
                    "bulkGeneration": True,
                    "multiLanguage": True,
                    "advancedPrompts": True
                },
                "response": result.get("response", {}),
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "available": False,
                "error": result.get("error", "Status check failed"),
                "message": "Gemini AI is not responding properly",
                "debug": result
            }
            
    except Exception as e:
        logger.error(f"Gemini status check failed: {e}")
        # Fallback to direct test
        logger.info("🔄 Falling back to direct Gemini test")
        return await simple_gemini_test()

# 🆕 TOPIC-SPECIFIC GEMINI ENDPOINTS
@app.post("/api/gemini/topic")
async def get_gemini_topic_content(request: TopicRequest):
    """Get Gemini content for specific topic"""
    gemini_script = AI_MODELS_DIR / "gemini_recommender.py"
    
    if not gemini_script.exists():
        raise HTTPException(status_code=503, detail="Gemini recommender not available")
    
    try:
        logger.info(f"🎯 Generating content for topic: {request.topic}")
        
        # Prepare topic-specific data for Gemini
        gemini_data = {
            "skinAnalysis": request.skinAnalysis,
            "requestType": "topic_specific",
            "topic": request.topic,
            "customPrompt": request.prompt,
            "language": request.language,
            "analysis_type": "topic_focused"
        }
        
        analysis_json = json.dumps(gemini_data, ensure_ascii=False)
        result = run_subprocess_advanced([
            "python3", str(gemini_script), analysis_json
        ])
        
        if result.get("success"):
            # Parse the response based on topic
            content = result.get("recommendations", result.get("response", []))
            
            # If content is a string, split into bullet points
            if isinstance(content, str):
                content = [line.strip() for line in content.split('\n') if line.strip() and not line.strip().startswith('#')]
            
            logger.info(f"✅ Topic content generated: {len(content)} items")
            
            return {
                "success": True,
                "topic": request.topic,
                "content": content,
                "timestamp": datetime.now().isoformat(),
                "language": request.language,
                "model": result.get("model", "gemini-pro"),
                "processingTime": result.get("processing_time")
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Gemini failed: {result.get('error', 'Unknown error')}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gemini topic content failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get topic content: {str(e)}")

@app.post("/api/gemini/bulk-topics")
async def get_gemini_bulk_topics(request: BulkTopicsRequest):
    """Generate content for multiple topics at once"""
    gemini_script = AI_MODELS_DIR / "gemini_recommender.py"
    
    if not gemini_script.exists():
        raise HTTPException(status_code=503, detail="Gemini recommender not available")
    
    try:
        logger.info(f"🔥 Generating bulk content for {len(request.topics)} topics")
        
        results = {}
        successful_topics = 0
        
        for topic_data in request.topics:
            topic_id = topic_data.get("id")
            topic_prompt = topic_data.get("prompt")
            
            logger.info(f"📝 Processing topic: {topic_id}")
            
            # Prepare topic-specific data
            gemini_data = {
                "skinAnalysis": request.skinAnalysis,
                "requestType": "topic_specific",
                "topic": topic_id,
                "customPrompt": topic_prompt,
                "language": request.language,
                "analysis_type": "bulk_topics"
            }
            
            analysis_json = json.dumps(gemini_data, ensure_ascii=False)
            result = run_subprocess_advanced([
                "python3", str(gemini_script), analysis_json
            ])
            
            if result.get("success"):
                content = result.get("recommendations", result.get("response", []))
                
                # Parse content
                if isinstance(content, str):
                    content = [line.strip() for line in content.split('\n') if line.strip() and not line.strip().startswith('#')]
                
                results[topic_id] = content
                successful_topics += 1
                logger.info(f"✅ Topic {topic_id}: {len(content)} items generated")
            else:
                logger.warning(f"❌ Topic {topic_id} failed: {result.get('error')}")
                results[topic_id] = [f"ไม่สามารถสร้างเนื้อหาได้: {result.get('error', 'Unknown error')}"]
        
        logger.info(f"🎉 Bulk generation completed: {successful_topics}/{len(request.topics)} successful")
        
        return {
            "success": True,
            "results": results,
            "timestamp": datetime.now().isoformat(),
            "language": request.language,
            "totalTopics": len(request.topics),
            "successfulTopics": successful_topics
        }
        
    except Exception as e:
        logger.error(f"Bulk topics generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate bulk topics: {str(e)}")

@app.post("/api/gemini/recommendations")
async def get_gemini_recommendations(request: GeminiRequest):
    """Get enhanced recommendations directly from Gemini AI"""
    gemini_script = AI_MODELS_DIR / "gemini_recommender.py"
    
    if not gemini_script.exists():
        raise HTTPException(status_code=503, detail="Gemini recommender not available")
    
    try:
        # Prepare enhanced data for Gemini
        gemini_data = request.skinAnalysis.copy()
        
        # Add custom prompt if provided
        if request.prompt:
            gemini_data["customPrompt"] = request.prompt
        
        # Add language preference and enhanced features
        gemini_data.update({
            "language": request.language,
            "requestType": "recommendations",
            "analysis_type": "direct_api",
            "enhanced_features": True
        })
        
        # Call Gemini script
        analysis_json = json.dumps(gemini_data, ensure_ascii=False)
        result = run_subprocess_advanced([
            "python3", str(gemini_script), analysis_json
        ])
        
        if result.get("success") and result.get("recommendations"):
            return {
                "success": True,
                "recommendations": result["recommendations"],
                "timestamp": datetime.now().isoformat(),
                "language": request.language,
                "model": result.get("model", "gemini-pro"),
                "processingTime": result.get("processing_time"),
                "enhancedFeatures": True
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Gemini failed: {result.get('error', 'Unknown error')}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gemini recommendations failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get Gemini recommendations: {str(e)}")

# ✅ UPLOAD AND ANALYSIS ENDPOINTS
@app.post("/api/upload", response_model=AnalysisResponse)
async def upload_and_analyze_advanced(
    file: UploadFile = File(...),
    enable_advanced: bool = True,
    debug_mode: bool = False
):
    """🚀 Enhanced upload and analysis with advanced face detection"""
    
    start_time = datetime.now()
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not is_valid_image(file.filename):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload an image file (JPG, PNG, GIF, WEBP, BMP)"
        )
    
    # Check file size (15MB limit for advanced processing)
    contents = await file.read()
    if len(contents) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size too large. Maximum 15MB allowed")
    await file.seek(0)
    
    analysis_id = generate_analysis_id()
    file_extension = get_file_extension(file.filename)
    original_filename = f"{analysis_id}{file_extension}"
    original_path = UPLOAD_DIR / original_filename
    
    try:
        # Save uploaded file
        await save_upload_file(file, original_path)
        logger.info(f"📁 File saved: {original_path}")
        
        # Initialize response
        response_data = {
            "success": True,
            "analysisId": analysis_id,
            "timestamp": datetime.now().isoformat(),
            "originalImage": f"/uploads/{original_filename}",
            "geminiSuccess": False
        }
        
        # 🔥 STEP 1: Advanced OpenCV Face Detection and Skin Analysis
        if enable_advanced:
            opencv_script = AI_MODELS_DIR / "opencv_skin_analyzer.py"
            if opencv_script.exists():
                logger.info("🔍 Running Advanced OpenCV Analysis...")
                
                # Set debug environment if requested
                env_vars = os.environ.copy()
                if debug_mode:
                    env_vars['DEBUG_SKIN_ANALYSIS'] = 'true'
                
                opencv_result = run_subprocess_advanced([
                    "python3", str(opencv_script), str(original_path)
                ])
                
                logger.info(f"📊 OpenCV Result: {opencv_result.get('success', False)}")
                
                if opencv_result.get("success"):
                    # Parse advanced face detection results
                    face_detection_data = opencv_result.get("face_detection", {})
                    
                    response_data["faceDetection"] = FaceDetectionInfo(
                        detected=face_detection_data.get("detected", False),
                        coordinates=face_detection_data.get("coordinates"),
                        confidence=face_detection_data.get("confidence"),
                        detection_method=face_detection_data.get("detection_method"),
                        face_analysis=face_detection_data.get("face_analysis"),
                        total_faces=face_detection_data.get("total_faces"),
                        message=face_detection_data.get("reason") if not face_detection_data.get("detected") else None
                    )
                    
                    # Parse skin analysis results
                    response_data["skinAnalysis"] = SkinAnalysisResult(
                        success=True,
                        total_detections=opencv_result.get("total_detections", 0),
                        detected_classes=opencv_result.get("detected_classes", 0),
                        detectedIssues=opencv_result.get("detectedIssues", []),
                        detectionCounts=opencv_result.get("detectionCounts", {}),
                        detection_details=opencv_result.get("detection_details", {}),
                        opencv_analysis=opencv_result.get("opencv_analysis", {}),
                        face_detection=response_data["faceDetection"],
                        analysis_method=opencv_result.get("analysis_method", "Advanced OpenCV"),
                        overall_health=opencv_result.get("overall_health")
                    )
                    
                    logger.info(f"✅ Advanced analysis completed: {opencv_result.get('total_detections', 0)} issues detected")
                    
                else:
                    logger.warning(f"⚠️ OpenCV analysis failed: {opencv_result.get('error')}")
                    response_data["faceDetection"] = FaceDetectionInfo(
                        detected=False,
                        message=opencv_result.get("error", "Analysis failed")
                    )
            else:
                logger.warning("⚠️ Advanced OpenCV script not found, falling back to legacy")
                # Fallback to legacy OpenCV if available
                await fallback_to_legacy_analysis(response_data, original_path)
        else:
            # Use legacy analysis if advanced is disabled
            await fallback_to_legacy_analysis(response_data, original_path)
        
        # 🎯 STEP 2: Gemini AI Recommendations (if skin analysis available)
        if response_data.get("skinAnalysis"):
            await generate_gemini_recommendations(response_data)
        
        # Calculate total processing time
        total_time = (datetime.now() - start_time).total_seconds()
        response_data["processing_time"] = round(total_time, 2)
        
        # Save analysis result to file for history
        analysis_file = UPLOAD_DIR / f"{analysis_id}_analysis.json"
        async with aiofiles.open(analysis_file, 'w') as f:
            # Convert Pydantic models to dict for JSON serialization
            serializable_data = response_data.copy()
            if isinstance(serializable_data.get("faceDetection"), FaceDetectionInfo):
                serializable_data["faceDetection"] = serializable_data["faceDetection"].dict()
            if isinstance(serializable_data.get("skinAnalysis"), SkinAnalysisResult):
                serializable_data["skinAnalysis"] = serializable_data["skinAnalysis"].dict()
            
            await f.write(json.dumps(serializable_data, indent=2, ensure_ascii=False))
        
        logger.info(f"🎉 Analysis completed successfully: {analysis_id} in {total_time:.2f}s")
        return AnalysisResponse(**response_data)
        
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        
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

async def fallback_to_legacy_analysis(response_data: Dict, original_path: Path):
    """Fallback to legacy OpenCV analysis"""
    opencv_legacy = AI_MODELS_DIR / "opencv_processor.py"
    if opencv_legacy.exists():
        logger.info("🔄 Running legacy OpenCV analysis...")
        legacy_result = run_subprocess_advanced([
            "python3", str(opencv_legacy), str(original_path)
        ])
        
        if legacy_result.get("faceDetected"):
            response_data["faceDetection"] = FaceDetectionInfo(
                detected=True,
                coordinates=legacy_result.get("faceCoordinates", {}),
                message="Legacy face detection"
            )
            
            # Add cropped image if available
            if legacy_result.get("croppedImagePath"):
                cropped_filename = Path(legacy_result["croppedImagePath"]).name
                response_data["croppedImage"] = f"/uploads/{cropped_filename}"
        else:
            response_data["faceDetection"] = FaceDetectionInfo(
                detected=False,
                message=legacy_result.get("message", "No face detected (legacy)")
            )
    else:
        logger.warning("⚠️ No OpenCV processor available")
        response_data["faceDetection"] = FaceDetectionInfo(
            detected=False,
            message="No face detection service available"
        )

async def generate_gemini_recommendations(response_data: Dict):
    """Generate Gemini AI recommendations"""
    gemini_script = AI_MODELS_DIR / "gemini_recommender.py"
    if gemini_script.exists():
        logger.info("🤖 Generating Gemini recommendations...")
        
        try:
            # Extract skin analysis data for Gemini
            skin_analysis = response_data["skinAnalysis"]
            if isinstance(skin_analysis, SkinAnalysisResult):
                analysis_data = skin_analysis.dict()
            else:
                analysis_data = skin_analysis
            
            # Prepare data for Gemini
            gemini_input = {
                "opencv_analysis": analysis_data.get("opencv_analysis", {}),
                "detected_issues": analysis_data.get("detectedIssues", []),
                "detection_counts": analysis_data.get("detectionCounts", {}),
                "overall_health": analysis_data.get("overall_health", {}),
                "face_analysis": response_data.get("faceDetection", {}).get("face_analysis", {}),
                "language": "th",
                "analysis_type": "comprehensive"
            }
            
            analysis_json = json.dumps(gemini_input, ensure_ascii=False)
            gemini_result = run_subprocess_advanced([
                "python3", str(gemini_script), analysis_json
            ])
            
            if gemini_result.get("success") and gemini_result.get("recommendations"):
                response_data["recommendations"] = gemini_result["recommendations"]
                response_data["geminiSuccess"] = True
                logger.info("✅ Gemini recommendations generated successfully")
            else:
                logger.warning(f"⚠️ Gemini failed: {gemini_result.get('error', 'Unknown error')}")
                response_data["recommendations"] = generate_fallback_recommendations(analysis_data)
                
        except Exception as e:
            logger.error(f"❌ Gemini generation failed: {e}")
            response_data["recommendations"] = generate_fallback_recommendations({})
    else:
        logger.warning("⚠️ Gemini script not found")
        response_data["recommendations"] = generate_fallback_recommendations({})

def generate_fallback_recommendations(analysis_data: Dict) -> Dict:
    """Generate fallback recommendations when Gemini is not available"""
    return {
        "skinType": "Normal",
        "conditionAssessment": "Advanced skin analysis completed with OpenCV",
        "skincareRecommendations": [
            "ใช้ผลิตภัณฑ์ทำความสะอาดที่อ่อนโยน pH สมดุล",
            "ทาครีมกันแดดสเปกตรัมกว้างทุกวัน",
            "ใช้ครีมบำรุงผิวที่เหมาะสมกับสภาพผิว",
            "รักษาขั้นตอนการดูแลผิวให้สม่ำเสมอ"
        ],
        "lifestyleRecommendations": [
            "ดื่มน้ำให้เพียงพอต่อวัน",
            "รับประทานอาหารที่มีผักและผลไม้",
            "นอนหลับให้เพียงพอเพื่อการฟื้นฟูผิว",
            "หลีกเลี่ยงการสัมผัสใบหน้าด้วยมือที่ไม่สะอาด"
        ],
        "dermatologistAdvice": "ปรึกษาแพทย์ผิวหนังหากมีปัญหาที่กังวล",
        "improvementTimeline": "4-8 สัปดาห์ด้วยการดูแลที่สม่ำเสมอ",
        "note": "คำแนะนำเบื้องต้นจากระบบ Advanced OpenCV Analysis"
    }

# ✅ HISTORY AND ANALYSIS ENDPOINTS
@app.get("/api/history")
async def get_history():
    """Get analysis history with enhanced metadata"""
    try:
        history = []
        
        for analysis_file in UPLOAD_DIR.glob("*_analysis.json"):
            try:
                async with aiofiles.open(analysis_file, 'r') as f:
                    content = await f.read()
                    analysis = json.loads(content)
                    
                # Enhanced history entry
                face_detection = analysis.get("faceDetection", {})
                skin_analysis = analysis.get("skinAnalysis", {})
                
                history_entry = {
                    "analysisId": analysis.get("analysisId"),
                    "timestamp": analysis.get("timestamp"),
                    "originalImage": analysis.get("originalImage"),
                    "croppedImage": analysis.get("croppedImage"),
                    "faceDetected": face_detection.get("detected", False),
                    "detectionMethod": face_detection.get("detection_method"),
                    "detectionConfidence": face_detection.get("confidence"),
                    "totalDetections": skin_analysis.get("total_detections", 0),
                    "detectedIssues": skin_analysis.get("detectedIssues", []),
                    "analysisMethod": skin_analysis.get("analysis_method", "Standard"),
                    "overallHealth": skin_analysis.get("overall_health", {}).get("health_category"),
                    "geminiSuccess": analysis.get("geminiSuccess", False),
                    "processingTime": analysis.get("processing_time"),
                    "hasAdvancedFeatures": bool(face_detection.get("face_analysis")),
                    "version": "2.2.0" if bool(face_detection.get("face_analysis")) else "2.0.0"
                }
                
                history.append(history_entry)
                
            except Exception as e:
                logger.warning(f"Failed to load analysis file {analysis_file}: {e}")
                continue
        
        # Sort by timestamp (newest first)
        history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return {
            "success": True,
            "count": len(history),
            "history": history,
            "metadata": {
                "version": "2.2.0",
                "advancedAnalyses": len([h for h in history if h.get("hasAdvancedFeatures")]),
                "legacyAnalyses": len([h for h in history if not h.get("hasAdvancedFeatures")])
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get history")

@app.get("/api/analysis/{analysis_id}")
async def get_analysis_enhanced(analysis_id: str):
    """Get enhanced analysis result by ID"""
    analysis_file = UPLOAD_DIR / f"{analysis_id}_analysis.json"
    
    if not analysis_file.exists():
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    try:
        async with aiofiles.open(analysis_file, 'r') as f:
            content = await f.read()
            analysis_data = json.loads(content)
            
        # Ensure all required fields exist
        if "success" not in analysis_data:
            analysis_data["success"] = True
        
        # Add analysis metadata
        analysis_data["metadata"] = {
            "version": "2.2.0",
            "hasAdvancedFeatures": bool(analysis_data.get("faceDetection", {}).get("face_analysis")),
            "processingTime": analysis_data.get("processing_time"),
            "analysisMethod": analysis_data.get("skinAnalysis", {}).get("analysis_method", "Standard"),
            "topicSpecificSupport": True
        }
            
        return analysis_data
        
    except Exception as e:
        logger.error(f"Failed to load analysis {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to load analysis")

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
        
        # Delete associated image files
        for image_file in UPLOAD_DIR.glob(f"{analysis_id}.*"):
            if image_file.suffix.lower() in {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}:
                image_file.unlink()
                deleted_files.append(str(image_file))
        
        # Delete cropped images
        for cropped_file in UPLOAD_DIR.glob(f"{analysis_id}_cropped.*"):
            cropped_file.unlink()
            deleted_files.append(str(cropped_file))
        
        if deleted_files:
            logger.info(f"🗑️ Deleted analysis {analysis_id}: {len(deleted_files)} files")
            return {
                "success": True,
                "message": f"Analysis {analysis_id} deleted successfully",
                "deletedFiles": deleted_files
            }
        else:
            raise HTTPException(status_code=404, detail="Analysis not found")
            
    except Exception as e:
        logger.error(f"Failed to delete analysis {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete analysis")

@app.post("/api/cleanup")
async def cleanup_old_files():
    """Clean up old analysis files (older than 7 days)"""
    try:
        from datetime import timedelta
        
        cutoff_time = datetime.now() - timedelta(days=7)
        deleted_count = 0
        
        for file_path in UPLOAD_DIR.iterdir():
            if file_path.is_file():
                file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
                if file_time < cutoff_time:
                    file_path.unlink()
                    deleted_count += 1
        
        logger.info(f"🧹 Cleanup completed: {deleted_count} files deleted")
        
        return {
            "success": True,
            "message": f"Cleanup completed: {deleted_count} files deleted",
            "cutoffDate": cutoff_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        raise HTTPException(status_code=500, detail="Cleanup failed")

@app.get("/api/export/{analysis_id}")
async def export_analysis(analysis_id: str):
    """Export analysis as downloadable JSON"""
    analysis_file = UPLOAD_DIR / f"{analysis_id}_analysis.json"
    
    if not analysis_file.exists():
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return FileResponse(
        path=str(analysis_file),
        filename=f"skinai_analysis_{analysis_id}.json",
        media_type="application/json"
    )

# ✅ TESTING AND DEBUG ENDPOINTS
@app.post("/api/test/complete-analysis")
async def test_complete_analysis():
    """Test complete analysis pipeline without file upload"""
    try:
        logger.info("🧪 Testing complete analysis pipeline")
        
        # Use the complete analysis script directly
        complete_script = AI_MODELS_DIR / "complete_analysis.py"
        
        if not complete_script.exists():
            raise HTTPException(status_code=503, detail="Complete analysis script not available")
        
        # Run complete analysis test
        result = run_subprocess_advanced([
            "python3", str(complete_script)
        ], timeout=120)
        
        if result.get("success"):
            logger.info("✅ Complete analysis test successful")
            return {
                "success": True,
                "message": "Complete analysis pipeline test successful",
                "result": result,
                "timestamp": datetime.now().isoformat()
            }
        else:
            logger.error(f"❌ Complete analysis test failed: {result.get('error')}")
            raise HTTPException(
                status_code=500,
                detail=f"Complete analysis test failed: {result.get('error', 'Unknown error')}"
            )
            
    except Exception as e:
        logger.error(f"Complete analysis test error: {e}")
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

@app.get("/api/debug/info")
async def debug_info():
    """Get debug information about the system"""
    try:
        import sys
        import platform
        
        # Check AI model files
        ai_models = {}
        for script_file in AI_MODELS_DIR.glob("*.py"):
            ai_models[script_file.name] = {
                "exists": True,
                "size": script_file.stat().st_size,
                "modified": datetime.fromtimestamp(script_file.stat().st_mtime).isoformat()
            }
        
        # Check uploads directory
        upload_stats = {
            "total_files": len(list(UPLOAD_DIR.iterdir())),
            "analysis_files": len(list(UPLOAD_DIR.glob("*_analysis.json"))),
            "image_files": len([f for f in UPLOAD_DIR.iterdir() if f.suffix.lower() in {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}])
        }
        
        # Environment variables
        env_vars = {
            "GEMINI_API_KEY": "SET" if os.getenv("GEMINI_API_KEY") else "NOT_SET",
            "GOOGLE_API_KEY": "SET" if os.getenv("GOOGLE_API_KEY") else "NOT_SET",
            "DEBUG_SKIN_ANALYSIS": os.getenv("DEBUG_SKIN_ANALYSIS", "false"),
            "OPENCV_ADVANCED_MODE": os.getenv("OPENCV_ADVANCED_MODE", "false"),
            "FACE_DETECTION_ENHANCED": os.getenv("FACE_DETECTION_ENHANCED", "false")
        }
        
        return {
            "success": True,
            "system_info": {
                "python_version": sys.version,
                "platform": platform.platform(),
                "working_directory": str(Path.cwd()),
                "upload_directory": str(UPLOAD_DIR.absolute()),
                "ai_models_directory": str(AI_MODELS_DIR.absolute())
            },
            "ai_models": ai_models,
            "upload_stats": upload_stats,
            "environment_variables": env_vars,
            "api_version": "2.2.0",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Debug info failed: {e}")
        raise HTTPException(status_code=500, detail=f"Debug info failed: {str(e)}")

# ✅ STARTUP/SHUTDOWN EVENTS
@app.on_event("startup")
async def startup_event():
    """Enhanced application startup event"""
    logger.info("🚀 SkinAI Backend API v2.2.0 with Topic-Specific Gemini AI starting up...")
    
    # ✅ ตั้งค่า Gemini API Key
    if not os.getenv('GEMINI_API_KEY') and not os.getenv('GOOGLE_API_KEY'):
        os.environ['GEMINI_API_KEY'] = "AIzaSyDQMvla98RH0xfwAguSbOgHLyQJVhvjBrQ"
        logger.info("🔑 Gemini API Key set from fallback")
    else:
        logger.info("🔑 Gemini API Key found in environment")
    
    logger.info(f"📁 Upload directory: {UPLOAD_DIR.absolute()}")
    logger.info(f"🤖 AI models directory: {AI_MODELS_DIR.absolute()}")
    
    # Check AI model scripts
    scripts = {
        "opencv_skin_analyzer.py": "Advanced OpenCV Face Detection & Skin Analysis",
        "opencv_processor.py": "Legacy OpenCV Processor",
        "yolo_analyzer.py": "YOLO Skin Condition Analyzer", 
        "gemini_recommender.py": "Gemini AI Topic-Specific Recommender",
        "gemini_status_check.py": "Gemini Simple Status Check",
        "complete_analysis.py": "Complete Analysis Pipeline"
    }
    
    for script, description in scripts.items():
        script_path = AI_MODELS_DIR / script
        if script_path.exists():
            logger.info(f"✅ {description}: {script}")
        else:
            logger.warning(f"⚠️  {description}: {script} not found")
    
    logger.info("🎯 Topic-Specific Features:")
    logger.info("   • 8 Predefined Topic Categories")
    logger.info("   • Individual Topic Generation")
    logger.info("   • Bulk Topic Generation")
    logger.info("   • Custom Prompt Support")
    logger.info("   • Multi-language Support")
    
    logger.info("🔬 Available endpoints:")
    logger.info("   • Health Check: /api/health")
    logger.info("   • Gemini Status: /api/gemini/status")
    logger.info("   • Topic Content: /api/gemini/topic")
    logger.info("   • Bulk Topics: /api/gemini/bulk-topics")
    logger.info("   • Advanced Upload: /api/upload")
    logger.info("   • Analysis History: /api/history")
    logger.info("   • Complete Test: /api/test/complete-analysis")
    logger.info("   • Debug Info: /api/debug/info")
    logger.info("   • Documentation: /docs")

@app.on_event("shutdown")
async def shutdown_event():
    """Enhanced application shutdown event"""
    logger.info("🛑 SkinAI Backend API v2.2.0 shutting down...")
    logger.info("✅ Shutdown completed successfully")

# ✅ ERROR HANDLERS (Enhanced)
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False, 
            "error": exc.detail,
            "version": "2.2.0",
            "timestamp": datetime.now().isoformat()
        },
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
            "details": str(exc),
            "version": "2.2.0",
            "timestamp": datetime.now().isoformat()
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", 
            "Access-Control-Allow-Headers": "*",
        }
    )

# ✅ MAIN ENTRY POINT
if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    logger.info(f"🌐 Starting SkinAI Topic-Specific Server on {host}:{port}")
    logger.info(f"🔧 Debug mode: {debug}")
    logger.info(f"🚀 Version: 2.2.0 with Topic-Specific Gemini AI")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info",
        access_log=True,
        reload_dirs=["./"] if debug else None
    )