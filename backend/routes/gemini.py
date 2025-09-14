from fastapi import APIRouter, HTTPException
import json
import logging
from datetime import datetime
from models.schemas import GeminiRequest, TopicRequest, BulkTopicsRequest
from utils.subprocess_utils import run_subprocess_advanced
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/status")
async def gemini_status():
    """Check Gemini AI service status"""
    gemini_script = settings.AI_MODELS_DIR / "gemini_recommender.py"
    
    if not gemini_script.exists():
        raise HTTPException(status_code=503, detail="Gemini recommender not available")
    
    try:
        # ✅ ส่ง status_check request ตรงกับ Gemini Script
        status_data = {"requestType": "status_check"}
        analysis_json = json.dumps(status_data, ensure_ascii=False)
        
        result = run_subprocess_advanced([
            "python3", str(gemini_script), analysis_json
        ])
        
        if result.get("success") and result.get("available"):
            return {
                "available": True,
                "message": "Gemini AI is ready and operational",
                "version": settings.API_VERSION,
                "model": result.get("model", settings.GEMINI_MODEL),
                "features": {
                    "topicSpecific": True,
                    "bulkGeneration": True,
                    "multiLanguage": True,
                    "structuredPrompts": True
                },
                "api_test": result.get("response", {}),
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(
                status_code=503, 
                detail=f"Gemini not available: {result.get('error', 'Unknown error')}"
            )
            
    except Exception as e:
        logger.error(f"❌ Status check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@router.post("/recommendations")
async def get_gemini_recommendations(request: GeminiRequest):
    """Get enhanced recommendations from Gemini AI"""
    gemini_script = settings.AI_MODELS_DIR / "gemini_recommender.py"
    
    if not gemini_script.exists():
        raise HTTPException(status_code=503, detail="Gemini recommender not available")
    
    try:
        logger.info("🤖 Processing Gemini recommendations request...")
        
        # ✅ Prepare data ตรงกับ Gemini Script
        gemini_data = request.skinAnalysis.copy()
        
        if request.prompt:
            gemini_data["customPrompt"] = request.prompt
        
        # ✅ ใช้ requestType = "analysis" ตรงกับ Gemini Script
        gemini_data.update({
            "language": request.language,
            "requestType": "analysis",  # ✅ เปลี่ยนจาก "recommendations"
            "analysis_type": "direct_api",
            "enhanced_features": True,
            "timestamp": datetime.now().isoformat()
        })
        
        # ✅ Run Gemini analysis
        analysis_json = json.dumps(gemini_data, ensure_ascii=False)
        result = run_subprocess_advanced([
            "python3", str(gemini_script), analysis_json
        ])
        
        if result.get("success") and result.get("recommendations"):
            logger.info("✅ Gemini recommendations generated successfully")
            return {
                "success": True,
                "recommendations": result["recommendations"],
                "timestamp": datetime.now().isoformat(),
                "language": request.language,
                "model": result.get("model", settings.GEMINI_MODEL),
                "processingTime": result.get("processingTime", 0.0),
                "enhancedFeatures": result.get("enhancedFeatures", True),
                "version": result.get("version", settings.API_VERSION)
            }
        else:
            logger.error(f"❌ Gemini failed: {result.get('error', 'Unknown error')}")
            raise HTTPException(
                status_code=500,
                detail=f"Gemini failed: {result.get('error', 'Unknown error')}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Gemini recommendations failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get Gemini recommendations: {str(e)}")

@router.post("/topic")
async def get_topic_specific_recommendations(request: TopicRequest):
    """Get topic-specific recommendations"""
    gemini_script = settings.AI_MODELS_DIR / "gemini_recommender.py"
    
    if not gemini_script.exists():
        raise HTTPException(status_code=503, detail="Gemini recommender not available")
    
    try:
        logger.info(f"🎯 Processing topic-specific request: {request.topic}")
        
        # ✅ Prepare data ตรงกับ Gemini Script
        topic_data = {
            "skinAnalysis": request.skinAnalysis,
            "topic": request.topic,
            "customPrompt": request.prompt,
            "language": request.language,
            "requestType": "topic_specific",  # ✅ ตรงกับ Gemini Script
            "timestamp": datetime.now().isoformat()
        }
        
        analysis_json = json.dumps(topic_data, ensure_ascii=False)
        result = run_subprocess_advanced([
            "python3", str(gemini_script), analysis_json
        ])
        
        if result.get("success"):
            logger.info(f"✅ Topic recommendations generated for: {request.topic}")
            return {
                "success": True,
                "topic": request.topic,
                "recommendations": result.get("recommendations", []),
                "model": result.get("model", settings.GEMINI_MODEL),
                "timestamp": result.get("timestamp", datetime.now().isoformat())
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Topic analysis failed: {result.get('error', 'Unknown error')}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Topic recommendations failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get topic recommendations: {str(e)}")
