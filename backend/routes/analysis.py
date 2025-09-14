from fastapi import APIRouter, HTTPException
import json
import logging
from datetime import datetime
from pathlib import Path
from config.settings import settings
import aiofiles

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/history")
async def get_history():
    """Get analysis history with enhanced metadata"""
    try:
        logger.info("📋 Retrieving analysis history...")
        history = []
        
        for analysis_file in settings.UPLOAD_DIR.glob("*_analysis.json"):
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
                    "overallHealth": skin_analysis.get("overall_health", {}).get("health_category") if skin_analysis.get("overall_health") else None,
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
        
        logger.info(f"✅ Retrieved {len(history)} analysis records")
        
        return {
            "success": True,
            "count": len(history),
            "history": history,
            "metadata": {
                "version": settings.API_VERSION,
                "advancedAnalyses": len([h for h in history if h.get("hasAdvancedFeatures")]),
                "legacyAnalyses": len([h for h in history if not h.get("hasAdvancedFeatures")]),
                "totalAnalyses": len(history),
                "successfulAnalyses": len([h for h in history if h.get("faceDetected")]),
                "withGeminiRecommendations": len([h for h in history if h.get("geminiSuccess")]),
                "averageProcessingTime": round(
                    sum([h.get("processingTime", 0) for h in history]) / len(history), 2
                ) if history else 0
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get history")

@router.get("/analysis/{analysis_id}")
async def get_analysis_enhanced(analysis_id: str):
    """Get enhanced analysis result by ID"""
    logger.info(f"🔍 Retrieving analysis: {analysis_id}")
    
    analysis_file = settings.UPLOAD_DIR / f"{analysis_id}_analysis.json"
    
    if not analysis_file.exists():
        logger.warning(f"❌ Analysis not found: {analysis_id}")
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    try:
        async with aiofiles.open(analysis_file, 'r') as f:
            content = await f.read()
            analysis_data = json.loads(content)
            
        # Ensure all required fields exist
        if "success" not in analysis_data:
            analysis_data["success"] = True
        
        # Add enhanced metadata
        analysis_data["metadata"] = {
            "version": settings.API_VERSION,
            "retrievedAt": datetime.now().isoformat(),
            "fileSize": analysis_file.stat().st_size,
            "lastModified": datetime.fromtimestamp(analysis_file.stat().st_mtime).isoformat(),
            "hasAdvancedFeatures": bool(analysis_data.get("faceDetection", {}).get("face_analysis")),
            "processingTime": analysis_data.get("processing_time"),
            "analysisMethod": analysis_data.get("skinAnalysis", {}).get("analysis_method", "Standard"),
            "topicSpecificSupport": True,
            "geminiRecommendations": bool(analysis_data.get("recommendations"))
        }
        
        # Validate image file existence
        original_image = analysis_data.get("originalImage")
        if original_image:
            image_path = settings.UPLOAD_DIR / original_image.replace("/uploads/", "")
            analysis_data["metadata"]["originalImageExists"] = image_path.exists()
        
        cropped_image = analysis_data.get("croppedImage")
        if cropped_image:
            cropped_path = settings.UPLOAD_DIR / cropped_image.replace("/uploads/", "")
            analysis_data["metadata"]["croppedImageExists"] = cropped_path.exists()
        
        logger.info(f"✅ Analysis retrieved successfully: {analysis_id}")
        return analysis_data
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON in analysis file {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail="Analysis file is corrupted")
    except Exception as e:
        logger.error(f"❌ Failed to load analysis {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load analysis: {str(e)}")

@router.delete("/analysis/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """Delete analysis and associated files"""
    try:
        deleted_files = []
        
        # Delete analysis JSON file
        analysis_file = settings.UPLOAD_DIR / f"{analysis_id}_analysis.json"
        if analysis_file.exists():
            analysis_file.unlink()
            deleted_files.append(str(analysis_file))
        
        # Delete associated image files
        for image_file in settings.UPLOAD_DIR.glob(f"{analysis_id}.*"):
            if image_file.suffix.lower() in settings.VALID_IMAGE_EXTENSIONS:
                image_file.unlink()
                deleted_files.append(str(image_file))
        
        # Delete cropped images
        for cropped_file in settings.UPLOAD_DIR.glob(f"{analysis_id}_cropped.*"):
            cropped_file.unlink()
            deleted_files.append(str(cropped_file))
        
        if deleted_files:
            logger.info(f"🗑️ Deleted analysis {analysis_id}: {len(deleted_files)} files")
            return {
                "success": True,
                "message": f"Analysis {analysis_id} deleted successfully",
                "deletedFiles": deleted_files,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Analysis not found")
            
    except Exception as e:
        logger.error(f"Failed to delete analysis {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete analysis")

@router.get("/analysis/{analysis_id}/images")
async def get_analysis_images(analysis_id: str):
    """Get image URLs for a specific analysis"""
    try:
        analysis_file = settings.UPLOAD_DIR / f"{analysis_id}_analysis.json"
        
        if not analysis_file.exists():
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        async with aiofiles.open(analysis_file, 'r') as f:
            content = await f.read()
            analysis_data = json.loads(content)
        
        images = {
            "originalImage": analysis_data.get("originalImage"),
            "croppedImage": analysis_data.get("croppedImage"),
            "analysisId": analysis_id,
            "timestamp": analysis_data.get("timestamp")
        }
        
        # Check if files actually exist
        if images["originalImage"]:
            original_path = settings.UPLOAD_DIR / images["originalImage"].replace("/uploads/", "")
            images["originalImageExists"] = original_path.exists()
        
        if images["croppedImage"]:
            cropped_path = settings.UPLOAD_DIR / images["croppedImage"].replace("/uploads/", "")
            images["croppedImageExists"] = cropped_path.exists()
        
        return {
            "success": True,
            "images": images,
            "metadata": {
                "version": settings.API_VERSION,
                "retrievedAt": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get images for analysis {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get analysis images")
