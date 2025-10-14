from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

# Import route modules
from routes.analysis import router as analysis_router
from routes.upload import router as upload_router
from routes.gemini import router as gemini_router
from config.settings import settings

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SkinAI API - Advanced Face Detection with Topic-Specific Gemini",
    description="AI-powered skin analysis with advanced face detection and topic-specific Gemini AI recommendations",
    version="2.2.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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

# Create directories
settings.UPLOAD_DIR.mkdir(exist_ok=True)
settings.AI_MODELS_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(analysis_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(gemini_router, prefix="/api/gemini")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "SkinAI Backend API with Topic-Specific Gemini AI",
        "version": "2.2.0",
        "features": "Advanced Face Detection, Enhanced Skin Analysis, Topic-Specific Gemini AI",
        "docs": "/docs",
        "endpoints": {
            "root": "GET /",
            "gemini_recommendations": "POST /api/gemini/recommendations",
            "gemini_status": "GET /api/gemini/status",
            "upload_analysis": "POST /api/upload",
            "history": "GET /api/history",
            "analysis_detail": "GET /api/analysis/{analysis_id}"
        },
        "architecture": {
            "modules": ["analysis", "upload", "gemini"],
            "utilities": ["file_utils", "subprocess_utils"],
            "models": ["schemas"]
        },
        "timestamp": datetime.now().isoformat()
    }

# Health check endpoint (inline since no health module)
@app.get("/api/health")
async def health_check():
    """Basic health check endpoint"""
    services = {}
    advanced_features = {}
    
    # Check OpenCV Advanced
    opencv_script = settings.AI_MODELS_DIR / "opencv_skin_analyzer.py"
    services["opencv_advanced"] = "available" if opencv_script.exists() else "missing"
    advanced_features["advanced_face_detection"] = opencv_script.exists()
    
    # Check OpenCV Legacy
    opencv_legacy = settings.AI_MODELS_DIR / "opencv_processor.py"
    services["opencv_legacy"] = "available" if opencv_legacy.exists() else "missing"
    
    # Check YOLO
    yolo_script = settings.AI_MODELS_DIR / "yolo_analyzer.py"
    services["yolo"] = "available" if yolo_script.exists() else "missing"
    
    # Check Gemini
    gemini_script = settings.AI_MODELS_DIR / "gemini_recommender.py"
    services["gemini"] = "available" if gemini_script.exists() else "missing"
    advanced_features["gemini_ai"] = gemini_script.exists()
    advanced_features["topic_specific_ai"] = gemini_script.exists()
    
    # Check Google API configuration
    advanced_features["google_api_configured"] = bool(
        os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    )
    advanced_features["debug_mode"] = settings.DEBUG_SKIN_ANALYSIS
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": services,
        "version": settings.API_VERSION,
        "advanced_features": advanced_features
    }

# Global error handler
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

# Startup event
@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("🚀 SkinAI Advanced API v2.2.0 starting up...")
    
    # Set Gemini API Key if not set
    if not os.getenv('GEMINI_API_KEY') and not os.getenv('GOOGLE_API_KEY'):
        os.environ['GEMINI_API_KEY'] = "AIzaSyDQMvla98RH0xfwAguSbOgHLyQJVhvjBrQ"
        logger.info("🔑 Gemini API Key set from fallback")
    
    logger.info(f"📁 Upload directory: {settings.UPLOAD_DIR.absolute()}")
    logger.info(f"🤖 AI models directory: {settings.AI_MODELS_DIR.absolute()}")
    
    # Check required AI model scripts
    required_scripts = {
        "opencv_skin_analyzer.py": "Advanced OpenCV Skin Analyzer",
        "opencv_processor.py": "Legacy OpenCV Processor",
        "gemini_recommender.py": "Gemini AI Recommender",
        "yolo_analyzer.py": "YOLO Analyzer"
    }
    
    for script, description in required_scripts.items():
        script_path = settings.AI_MODELS_DIR / script
        if script_path.exists():
            logger.info(f"✅ {description}: Available")
        else:
            logger.warning(f"⚠️  {description}: Not found ({script})")
    
    logger.info("🎯 Modular endpoints loaded:")
    logger.info("   • Root: GET /")
    logger.info("   • Health: GET /api/health")
    logger.info("   • Analysis: GET /api/analysis/{id}")
    logger.info("   • Upload: POST /api/upload")
    logger.info("   • Gemini: POST /api/gemini/recommendations")
    logger.info("   • History: GET /api/history")
    logger.info("   • Documentation: /docs")

# if __name__ == "__main__":
#     import uvicorn
    
#     host = os.getenv("HOST", "0.0.0.0")
#     # port = int(os.getenv("PORT", 5001))
#     ORT = int(os.getenv("PORT", 8000))
#     debug = os.getenv("DEBUG", "True").lower() == "true"
    
#     logger.info(f"🌐 Starting SkinAI Advanced Server on {host}:{port}")
#     logger.info(f"🔧 Debug mode: {debug}")
#     logger.info(f"🚀 Version: 2.2.0 with Topic-Specific Gemini AI")
    
#     uvicorn.run(
#         "main:app",
#         host=host,
#         port=port,
#         reload=debug,
#         log_level="info",
#         access_log=True,
#         reload_dirs=["./"] if debug else None
#     )
if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))  # <-- แก้ตรงนี้
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    logger.info(f"🌐 Starting SkinAI Advanced Server on {host}:{port}")
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

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import JSONResponse
# from datetime import datetime
# import logging
# import os
# from pathlib import Path
# from dotenv import load_dotenv

# # ✅ แก้ไข import paths ให้ถูกต้อง
# from routers.analysis import router as analysis_router  # เปลี่ยนจาก routes เป็น routers
# from routers.upload import router as upload_router      # เปลี่ยนจาก routes เป็น routers  
# from routers.gemini import router as gemini_router      # เปลี่ยนจาก routes เป็น routers
# from config.settings import settings

# # Load environment variables
# load_dotenv()

# # Configure logging
# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
# )
# logger = logging.getLogger(__name__)

# # Create FastAPI app
# app = FastAPI(
#     title="SkinAI API - Advanced OWLViT Face Detection with Gemini AI",
#     description="AI-powered skin analysis with OWLViT face detection and Gemini AI recommendations",
#     version="2.3.0",  # ✅ อัพเดทเวอร์ชัน
#     docs_url="/docs",
#     redoc_url="/redoc"
# )

# # CORS Middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.CORS_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
#     allow_headers=[
#         "Accept",
#         "Accept-Language", 
#         "Content-Language",
#         "Content-Type",
#         "Authorization",
#         "X-Requested-With",
#         "Origin",
#         "Access-Control-Request-Method",
#         "Access-Control-Request-Headers"
#     ],
#     expose_headers=["*"]
# )

# # ✅ สร้าง directories ก่อน mount static files
# try:
#     settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
#     settings.AI_MODELS_DIR.mkdir(parents=True, exist_ok=True)
#     logger.info(f"📁 Created directories: {settings.UPLOAD_DIR}, {settings.AI_MODELS_DIR}")
# except Exception as e:
#     logger.error(f"❌ Failed to create directories: {e}")

# # Mount static files - ✅ ใช้ absolute path
# try:
#     app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
#     logger.info(f"📂 Static files mounted: /uploads -> {settings.UPLOAD_DIR}")
# except Exception as e:
#     logger.error(f"❌ Failed to mount static files: {e}")

# # Include routers
# app.include_router(analysis_router, prefix="/api/analysis", tags=["Analysis"])
# app.include_router(upload_router, prefix="/api", tags=["Upload"])  
# app.include_router(gemini_router, prefix="/api/gemini", tags=["Gemini AI"])

# # Root endpoint
# @app.get("/", tags=["Root"])
# async def root():
#     """Root endpoint with API information"""
#     return {
#         "message": "SkinAI Backend API with OWLViT Face Detection + Gemini AI",
#         "version": "2.3.0",
#         "features": [
#             "OWLViT Face Detection",
#             "Advanced Skin Analysis", 
#             "Gemini AI Recommendations",
#             "Real-time Processing"
#         ],
#         "docs": "/docs",
#         "endpoints": {
#             "root": "GET /",
#             "health": "GET /api/health",
#             "upload_analysis": "POST /api/upload",
#             "analysis_detail": "GET /api/analysis/{analysis_id}",
#             "gemini_recommendations": "POST /api/gemini/recommendations",
#             "gemini_status": "GET /api/gemini/status",
#             "history": "GET /api/history"
#         },
#         "architecture": {
#             "face_detection": "OWLViT (Hugging Face)",
#             "skin_analysis": "OpenCV + Computer Vision",
#             "ai_recommendations": "Google Gemini 2.5 Flash",
#             "backend": "FastAPI + Python 3.11"
#         },
#         "timestamp": datetime.now().isoformat()
#     }

# # Health check endpoint
# @app.get("/api/health", tags=["Health"])
# async def health_check():
#     """Comprehensive health check endpoint"""
#     services = {}
#     advanced_features = {}
    
#     # ✅ ตรวจสอบ OWLViT Face Detector
#     owlvit_script = settings.AI_MODELS_DIR / "owlvit_face_detector.py"
#     services["owlvit_detector"] = "available" if owlvit_script.exists() else "missing"
#     advanced_features["owlvit_face_detection"] = owlvit_script.exists()
    
#     # ✅ ตรวจสอบ Simple Face Detector (fallback)
#     simple_detector = settings.AI_MODELS_DIR / "simple_face_detector.py"
#     services["simple_detector"] = "available" if simple_detector.exists() else "missing"
    
#     # ✅ ตรวจสอบ Legacy OpenCV
#     opencv_legacy = settings.AI_MODELS_DIR / "legacy_opencv_detector.py"
#     services["opencv_legacy"] = "available" if opencv_legacy.exists() else "missing"
    
#     # ✅ ตรวจสอบ Gemini AI
#     gemini_script = settings.AI_MODELS_DIR / "gemini_recommender.py"
#     services["gemini_ai"] = "available" if gemini_script.exists() else "missing"
#     advanced_features["gemini_ai"] = gemini_script.exists()
    
#     # ✅ ตรวจสอบ Google API configuration
#     api_key_configured = bool(
#         os.getenv("GOOGLE_API_KEY") or 
#         os.getenv("GEMINI_API_KEY") or
#         settings.GEMINI_API_KEY
#     )
#     advanced_features["google_api_configured"] = api_key_configured
#     advanced_features["debug_mode"] = getattr(settings, 'DEBUG_SKIN_ANALYSIS', False)
    
#     # ✅ ตรวจสอบ directories
#     directories_status = {
#         "upload_dir": settings.UPLOAD_DIR.exists(),
#         "ai_models_dir": settings.AI_MODELS_DIR.exists()
#     }
    
#     # ✅ คำนวณ overall health
#     available_services = sum(1 for status in services.values() if status == "available")
#     total_services = len(services)
#     health_percentage = (available_services / total_services) * 100 if total_services > 0 else 0
    
#     overall_status = "healthy" if health_percentage >= 75 else "degraded" if health_percentage >= 50 else "unhealthy"
    
#     return {
#         "status": overall_status,
#         "health_percentage": round(health_percentage, 1),
#         "timestamp": datetime.now().isoformat(),
#         "services": services,
#         "directories": directories_status,
#         "version": "2.3.0",
#         "advanced_features": advanced_features,
#         "system_info": {
#             "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
#             "platform": os.name,
#             "available_services": f"{available_services}/{total_services}"
#         }
#     }

# # Global error handler
# @app.exception_handler(Exception)
# async def general_exception_handler(request, exc):
#     logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
#     return JSONResponse(
#         status_code=500,
#         content={
#             "success": False,
#             "error": "Internal server error",
#             "details": str(exc),
#             "version": "2.3.0",
#             "timestamp": datetime.now().isoformat(),
#             "request_url": str(request.url) if hasattr(request, 'url') else None
#         },
#         headers={
#             "Access-Control-Allow-Origin": "*",
#             "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", 
#             "Access-Control-Allow-Headers": "*",
#         }
#     )

# # Startup event
# @app.on_event("startup")
# async def startup_event():
#     """Application startup event"""
#     logger.info("🚀 SkinAI Advanced API v2.3.0 starting up...")
    
#     # ✅ Set Gemini API Key with better fallback logic
#     api_key = (
#         os.getenv('GEMINI_API_KEY') or 
#         os.getenv('GOOGLE_API_KEY') or
#         getattr(settings, 'GEMINI_API_KEY', None)
#     )
    
#     if not api_key:
#         # ✅ ใช้ API key จาก settings หรือ fallback
#         fallback_key = "AIzaSyDQMvla98RH0xfwAguSbOgHLyQJVhvjBrQ"
#         os.environ['GEMINI_API_KEY'] = fallback_key
#         logger.info("🔑 Gemini API Key set from fallback")
#     else:
#         logger.info("🔑 Gemini API Key found in environment")
    
#     logger.info(f"📁 Upload directory: {settings.UPLOAD_DIR.absolute()}")
#     logger.info(f"🤖 AI models directory: {settings.AI_MODELS_DIR.absolute()}")
    
#     # ✅ ตรวจสอบ required AI model scripts
#     required_scripts = {
#         "owlvit_face_detector.py": "🎯 OWLViT Face Detector",
#         "simple_face_detector.py": "🔍 Simple Face Detector (Fallback)",
#         "legacy_opencv_detector.py": "📷 Legacy OpenCV Processor",
#         "gemini_recommender.py": "🤖 Gemini AI Recommender"
#     }
    
#     available_count = 0
#     for script, description in required_scripts.items():
#         script_path = settings.AI_MODELS_DIR / script
#         if script_path.exists():
#             logger.info(f"✅ {description}: Available")
#             available_count += 1
#         else:
#             logger.warning(f"⚠️  {description}: Not found ({script})")
    
#     logger.info(f"📊 AI Models Status: {available_count}/{len(required_scripts)} available")
    
#     logger.info("🎯 API Endpoints loaded:")
#     logger.info("   • Root: GET /")
#     logger.info("   • Health: GET /api/health")
#     logger.info("   • Upload & Analyze: POST /api/upload")
#     logger.info("   • Analysis Detail: GET /api/analysis/{id}")
#     logger.info("   • Gemini Recommendations: POST /api/gemini/recommendations")
#     logger.info("   • Gemini Status: GET /api/gemini/status")
#     logger.info("   • History: GET /api/history")
#     logger.info("   • Documentation: /docs")
#     logger.info("   • ReDoc: /redoc")

# # ✅ แก้ไข main execution
# if __name__ == "__main__":
#     import uvicorn
    
#     host = os.getenv("HOST", "0.0.0.0")
#     port = int(os.getenv("PORT", 8000))  # ✅ แก้แล้ว
#     debug = os.getenv("DEBUG", "True").lower() == "true"
    
#     logger.info(f"🌐 Starting SkinAI Advanced Server on {host}:{port}")
#     logger.info(f"🔧 Debug mode: {debug}")
#     logger.info(f"🚀 Version: 2.3.0 with OWLViT Face Detection + Gemini AI")
    
#     try:
#         uvicorn.run(
#             "main:app",
#             host=host,
#             port=port,
#             reload=debug,
#             log_level="info",
#             access_log=True,
#             reload_dirs=["./"] if debug else None
#         )
#     except Exception as e:
#         logger.error(f"❌ Failed to start server: {e}")
#         raise
