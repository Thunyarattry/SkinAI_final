import subprocess
import json
import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from config.settings import settings

logger = logging.getLogger(__name__)

def run_subprocess_advanced(
    command: List[str], 
    input_data: Optional[str] = None, 
    timeout: int = settings.DEFAULT_TIMEOUT,
    env: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Enhanced subprocess runner with better error handling"""
    try:
        logger.info(f"🔄 Running advanced command: {' '.join(command)}")
        start_time = datetime.now()
        
        # Set environment variables for advanced mode
        process_env = os.environ.copy()
        process_env['OPENCV_ADVANCED_MODE'] = 'true'
        process_env['FACE_DETECTION_ENHANCED'] = 'true'
        
        # Add any additional environment variables
        if env:
            process_env.update(env)
        
        if input_data:
            result = subprocess.run(
                command,
                input=input_data,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=process_env
            )
        else:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=process_env
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

def run_opencv_analysis(image_path: str, debug_mode: bool = False) -> Dict[str, Any]:
    """Run advanced OpenCV skin analysis using opencv_processor.py"""
    # Changed to use opencv_processor.py instead of opencv_skin_analyzer.py
    opencv_script = settings.AI_MODELS_DIR / "opencv_processor.py"
    
    if not opencv_script.exists():
        logger.warning(f"OpenCV processor not found: {opencv_script}")
        return {
            "success": False,
            "error": "OpenCV analyzer not available"
        }
    
    try:
        logger.info(f"🔍 Running OpenCV analysis: {image_path}")
        
        # Set debug environment if needed
        env = {}
        if debug_mode:
            env['DEBUG_SKIN_ANALYSIS'] = 'true'
        
        result = run_subprocess_advanced([
            "python3", str(opencv_script), image_path
        ], env=env)
        
        if result.get("success"):
            logger.info("✅ OpenCV analysis completed successfully")
            return result
        else:
            logger.error(f"❌ OpenCV analysis failed: {result.get('error')}")
            return result
            
    except Exception as e:
        logger.error(f"❌ OpenCV analysis exception: {e}")
        return {"success": False, "error": f"OpenCV analysis failed: {str(e)}"}

def run_legacy_opencv_analysis(image_path: str) -> Dict[str, Any]:
    """Run legacy OpenCV analysis as fallback"""
    # Keep this as fallback - you can create a simpler version if needed
    opencv_legacy = settings.AI_MODELS_DIR / "opencv_legacy.py"
    
    if not opencv_legacy.exists():
        logger.warning(f"Legacy OpenCV processor not found: {opencv_legacy}")
        # Fallback to main processor
        return run_opencv_analysis(image_path, debug_mode=False)
    
    try:
        logger.info(f"🔄 Running legacy OpenCV analysis: {image_path}")
        result = run_subprocess_advanced([
            "python3", str(opencv_legacy), image_path
        ])
        
        if result.get("success"):
            logger.info("✅ Legacy OpenCV analysis completed")
            return result
        else:
            logger.error(f"❌ Legacy OpenCV analysis failed: {result.get('error')}")
            return result
            
    except Exception as e:
        logger.error(f"❌ Legacy OpenCV analysis exception: {e}")
        return {"success": False, "error": f"Legacy analysis failed: {str(e)}"}

def run_gemini_analysis(input_data: dict) -> dict:
    """Run Gemini analysis - แบบเรียบง่าย"""
    try:
        gemini_script = settings.AI_MODELS_DIR / "gemini_recommender.py"
        
        if not gemini_script.exists():
            logger.error(f"❌ Gemini script ไม่พบ: {gemini_script}")
            return {"success": False, "error": "Gemini script not found"}
        
        # ✅ เตรียมข้อมูลให้ตรงกับ Gemini Script
        gemini_input = {
            "detected_issues": input_data.get("detected_issues", []),
            "detection_counts": input_data.get("detection_counts", {}),
            "opencv_analysis": input_data.get("opencv_analysis", {}),
            "overall_health": input_data.get("overall_health", {}),
            "face_analysis": input_data.get("face_analysis", {}),
            "language": input_data.get("language", "th"),
            "requestType": "analysis",  # ✅ ใช้ "analysis" แทน "upload_analysis"
            "timestamp": input_data.get("timestamp")
        }
        
        analysis_json = json.dumps(gemini_input, ensure_ascii=False)
        
        # ✅ เรียก Gemini Script
        logger.info(f"🤖 เรียก Gemini: {gemini_script}")
        result = subprocess.run(
            ["python3", str(gemini_script), analysis_json],
            capture_output=True,
            text=True,
            timeout=30,
            encoding='utf-8'
        )
        
        # ✅ ตรวจสอบผลลัพธ์
        logger.info(f"📤 Gemini return code: {result.returncode}")
        logger.info(f"📤 Gemini stdout: {result.stdout}")
        
        if result.stderr:
            logger.warning(f"⚠️ Gemini stderr: {result.stderr}")
        
        if result.returncode != 0:
            return {
                "success": False,
                "error": f"Script failed: {result.stderr or 'Unknown error'}"
            }
        
        if not result.stdout.strip():
            return {"success": False, "error": "Empty response"}
        
        # ✅ Parse JSON
        try:
            response = json.loads(result.stdout)
            logger.info(f"✅ Gemini สำเร็จ: {response.get('success', False)}")
            return response
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {e}")
            return {"success": False, "error": f"Invalid JSON: {str(e)}"}
            
    except subprocess.TimeoutExpired:
        logger.error("❌ Gemini timeout")
        return {"success": False, "error": "Timeout"}
    except Exception as e:
        logger.error(f"❌ Gemini exception: {e}")
        return {"success": False, "error": str(e)}