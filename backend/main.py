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