from pathlib import Path
from fastapi import UploadFile
import aiofiles
import uuid
import json
from datetime import datetime
from config.settings import settings
from models.schemas import FaceDetectionInfo, SkinAnalysisResult
import logging
import ulid

logger = logging.getLogger(__name__)

# def generate_analysis_id() -> str:
#     """Generate unique analysis ID"""
#     timestamp = int(datetime.now().timestamp() * 1000)
#     random_id = str(uuid.uuid4()).replace('-', '')[:12]
#     return f"skinai-topic-{timestamp}-{random_id}"


def generate_analysis_id() -> str:
    return f"sk_{ulid.new().str.lower()}"  # ยาว ~ 26 ตัว, ตัวพิมพ์เล็ก


def get_file_extension(filename: str) -> str:
    """Get file extension"""
    return Path(filename).suffix.lower()

def is_valid_image(filename: str) -> bool:
    """Check if file is a valid image"""
    return get_file_extension(filename) in settings.VALID_IMAGE_EXTENSIONS

async def save_upload_file(upload_file: UploadFile, destination: Path) -> None:
    """Save uploaded file to destination"""
    try:
        async with aiofiles.open(destination, 'wb') as f:
            while chunk := await upload_file.read(1024):
                await f.write(chunk)
        logger.info(f"📁 File saved successfully: {destination}")
    except Exception as e:
        logger.error(f"❌ Failed to save file {destination}: {e}")
        raise

async def save_analysis_to_file(analysis_id: str, response_data: dict) -> None:
    """Save analysis result to file for history"""
    try:
        analysis_file = settings.UPLOAD_DIR / f"{analysis_id}_analysis.json"
        
        # Convert Pydantic models to dict for JSON serialization
        serializable_data = response_data.copy()
        if isinstance(serializable_data.get("faceDetection"), FaceDetectionInfo):
            serializable_data["faceDetection"] = serializable_data["faceDetection"].dict()
        if isinstance(serializable_data.get("skinAnalysis"), SkinAnalysisResult):
            serializable_data["skinAnalysis"] = serializable_data["skinAnalysis"].dict()
        
        async with aiofiles.open(analysis_file, 'w') as f:
            await f.write(json.dumps(serializable_data, indent=2, ensure_ascii=False))
            
        logger.info(f"💾 Analysis saved to history: {analysis_file}")
        
    except Exception as e:
        logger.error(f"❌ Failed to save analysis to history: {e}")
        raise

def cleanup_file(file_path: Path) -> bool:
    """Clean up a single file"""
    try:
        if file_path.exists():
            file_path.unlink()
            return True
        return False
    except Exception as e:
        logger.error(f"❌ Failed to cleanup file {file_path}: {e}")
        return False

def get_cropped_filename_from_result(opencv_result: dict) -> str:
    """Extract cropped filename from OpenCV result"""
    cropped_path = opencv_result.get("croppedImagePath")
    if cropped_path:
        return Path(cropped_path).name
    return ""
