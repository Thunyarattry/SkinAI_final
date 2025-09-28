from pathlib import Path
import os
from typing import List

class Settings:
    # API Information
    API_VERSION = "2.2.0"
    API_TITLE = "SkinAI API - Advanced Face Detection"
    
    # Directories
    UPLOAD_DIR = Path("uploads")
    AI_MODELS_DIR = Path("ai_models")
    
    # File settings
    MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB
    VALID_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
    
    # Subprocess settings
    DEFAULT_TIMEOUT = 180
    
    # Gemini settings
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
    DEFAULT_LANGUAGE = "th"
    GEMINI_MODEL = "gemini-1.5-flash"
    
    # CORS settings
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://localhost:3000",
        "*"
    ]
    
    # Environment settings
    OPENCV_ADVANCED_MODE = True
    FACE_DETECTION_ENHANCED = True
    DEBUG_SKIN_ANALYSIS = os.getenv("DEBUG_SKIN_ANALYSIS", "false").lower() == "true"
    
    # Server settings
    HOST = os.getenv("HOST", "0.0.0.0")
    # PORT = int(os.getenv("PORT", 5001))
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"

settings = Settings()
