# # backend/utils/subprocess_utils.py
# import subprocess
# import json
# import os
# import logging
# from datetime import datetime
# from typing import List, Dict, Any, Optional

# from config.settings import settings

# logger = logging.getLogger(__name__)

# def run_subprocess_advanced(
#     command: List[str],
#     input_data: Optional[str] = None,
#     timeout: int = settings.DEFAULT_TIMEOUT,
#     env: Optional[Dict[str, str]] = None
# ) -> Dict[str, Any]:
#     """Enhanced subprocess runner with better error handling"""
#     try:
#         logger.info(f"🔄 Running advanced command: {' '.join(command)}")
#         start_time = datetime.now()

#         # Set environment variables for advanced mode
#         process_env = os.environ.copy()
#         process_env['OPENCV_ADVANCED_MODE'] = 'true'
#         process_env['FACE_DETECTION_ENHANCED'] = 'true'

#         # Add any additional environment variables
#         if env:
#             process_env.update(env)

#         if input_data:
#             result = subprocess.run(
#                 command,
#                 input=input_data,
#                 capture_output=True,
#                 text=True,
#                 timeout=timeout,
#                 env=process_env
#             )
#         else:
#             result = subprocess.run(
#                 command,
#                 capture_output=True,
#                 text=True,
#                 timeout=timeout,
#                 env=process_env
#             )

#         processing_time = (datetime.now() - start_time).total_seconds()
#         logger.info(f"⏱️ Command completed in {processing_time:.2f} seconds")

#         if result.returncode != 0:
#             logger.error(f"❌ Command failed with return code {result.returncode}")
#             logger.error(f"STDERR: {result.stderr}")
#             return {
#                 "success": False,
#                 "error": f"Process failed: {result.stderr}",
#                 "returncode": result.returncode,
#                 "processing_time": processing_time
#             }

#         try:
#             parsed_result = json.loads(result.stdout)
#             parsed_result["processing_time"] = processing_time
#             return parsed_result
#         except json.JSONDecodeError as e:
#             logger.error(f"❌ Failed to parse JSON output: {e}")
#             logger.error(f"Raw output: {result.stdout}")
#             return {
#                 "success": False,
#                 "error": "Invalid JSON response from subprocess",
#                 "raw_output": result.stdout,
#                 "processing_time": processing_time
#             }

#     except subprocess.TimeoutExpired:
#         logger.error(f"⏰ Subprocess timed out after {timeout} seconds")
#         return {"success": False, "error": f"Process timed out after {timeout} seconds"}
#     except Exception as e:
#         logger.error(f"❌ Subprocess error: {e}")
#         return {"success": False, "error": str(e)}


# def run_opencv_analysis(image_path: str, debug_mode: bool = False) -> Dict[str, Any]:
#     """Run advanced OpenCV skin analysis using opencv_processor.py"""
#     opencv_script = settings.AI_MODELS_DIR / "opencv_processor.py"

#     if not opencv_script.exists():
#         logger.warning(f"OpenCV processor not found: {opencv_script}")
#         return {"success": False, "error": "OpenCV analyzer not available"}

#     try:
#         logger.info(f"🔍 Running OpenCV analysis: {image_path}")

#         # Set debug environment if needed
#         env: Dict[str, str] = {}
#         if debug_mode:
#             env['DEBUG_SKIN_ANALYSIS'] = 'true'

#         result = run_subprocess_advanced(["python3", str(opencv_script), image_path], env=env)

#         if result.get("success"):
#             logger.info("✅ OpenCV analysis completed successfully")
#             return result
#         else:
#             logger.error(f"❌ OpenCV analysis failed: {result.get('error')}")
#             return result

#     except Exception as e:
#         logger.error(f"❌ OpenCV analysis exception: {e}")
#         return {"success": False, "error": f"OpenCV analysis failed: {str(e)}"}


# def run_legacy_opencv_analysis(image_path: str) -> Dict[str, Any]:
#     """Run legacy OpenCV analysis as fallback"""
#     opencv_legacy = settings.AI_MODELS_DIR / "opencv_legacy.py"

#     if not opencv_legacy.exists():
#         logger.warning(f"Legacy OpenCV processor not found: {opencv_legacy}")
#         # Fallback to main processor
#         return run_opencv_analysis(image_path, debug_mode=False)

#     try:
#         logger.info(f"🔄 Running legacy OpenCV analysis: {image_path}")
#         result = run_subprocess_advanced(["python3", str(opencv_legacy), image_path])

#         if result.get("success"):
#             logger.info("✅ Legacy OpenCV analysis completed")
#             return result
#         else:
#             logger.error(f"❌ Legacy OpenCV analysis failed: {result.get('error')}")
#             return result

#     except Exception as e:
#         logger.error(f"❌ Legacy OpenCV analysis exception: {e}")
#         return {"success": False, "error": f"Legacy analysis failed: {str(e)}"}


# # ---------- Gemini (optional) ----------
# try:
#     import google.generativeai as genai  # type: ignore
#     _HAS_GEMINI = True
# except Exception as e:
#     genai = None
#     _HAS_GEMINI = False
#     logger.warning("Gemini SDK not available: %s", e)

# try:
#     from PIL import Image
# except Exception:
#     Image = None


# def _ensure_gemini_ready() -> Optional[str]:
#     """คืนข้อความ error ถ้ายังใช้ Gemini ไม่ได้; คืน None ถ้าโอเค"""
#     if not _HAS_GEMINI:
#         return "google-generativeai not installed"
#     if not getattr(settings, "GEMINI_API_KEY", None):
#         return "GEMINI_API_KEY is missing"
#     return None


# def run_gemini_vision(image_path: str, hint: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
#     """
#     วิเคราะห์ภาพด้วย Gemini Vision
#     return: {"success": bool, "model": str|None, "recommendations": dict|None, "error": str|None}
#     """
#     err = _ensure_gemini_ready()
#     if err:
#         return {"success": False, "model": None, "recommendations": None, "error": err}
#     if Image is None:
#         return {"success": False, "model": None, "recommendations": None, "error": "Pillow not installed"}

#     try:
#         genai.configure(api_key=settings.GEMINI_API_KEY)  # type: ignore[attr-defined]
#         model_name = "gemini-1.5-flash"
#         model = genai.GenerativeModel(model_name)  # type: ignore

#         img = Image.open(image_path)  # type: ignore

#         prompt = f"""
#         คุณเป็นผู้ช่วยด้านสกินแคร์ (ไม่ใช่แพทย์) วิเคราะห์ภาพผิวหน้าเพื่อ "ตรวจหาบริเวณที่เป็นสิว" เท่านั้น
#         กติกา:
#         - ระบุเฉพาะบริเวณที่พบสิว (acne) เป็นกรอบ bbox แบบ normalized (x,y,w,h) ค่าระหว่าง 0..1
#         - ถ้าไม่พบสิว ให้ "areas" เป็นลิสต์ว่าง []
#         - ให้ประเมินภาพรวมความรุนแรงของผิว (severity: mild|moderate|severe) และ severityScore 0..100
#         - ให้คำแนะนำเบื้องต้น 3–6 ข้อเป็นภาษาไทย (เช่น การล้างหน้า การกันแดด การแต้มยา ฯลฯ)
#         - ให้ความมั่นใจรวมของผล (confidence 0..100)
#         {_JSON_SCHEMA}
#         """
#         if hint:
#             prompt += f"\n\n(HINT จาก OpenCV): {hint}"


#         resp = model.generate_content([prompt, img])  # type: ignore

#         text = (getattr(resp, "text", "") or "").strip()
#         try:
#             data = json.loads(text)
#         except Exception:
#             logger.warning("Gemini vision response not JSON; using defaults")
#             data = {
#                 "skinType": "Unknown",
#                 "overallHealth": {"health_score": 60, "health_category": "moderate"},
#                 "skincareRecommendations": [],
#                 "lifestyleRecommendations": [],
#                 "dermatologistAdvice": None,
#                 "improvementTimeline": None,
#             }

#         # defaults
#         data.setdefault("skinType", "Unknown")
#         data.setdefault("overallHealth", {"health_score": 60, "health_category": "moderate"})
#         data.setdefault("skincareRecommendations", [])
#         data.setdefault("lifestyleRecommendations", [])
#         data.setdefault("dermatologistAdvice", None)
#         data.setdefault("improvementTimeline", None)

#         return {"success": True, "model": model_name, "recommendations": data, "error": None}

#     except Exception as e:
#         logger.exception("Gemini vision error")
#         return {"success": False, "model": None, "recommendations": None, "error": str(e)}


# def run_gemini_analysis(analysis_payload: Dict[str, Any]) -> Dict[str, Any]:
#     """
#     วิเคราะห์แบบ text-only (ไม่ใช้รูป) จากผล OpenCV ที่สรุปมาแล้ว
#     return: {"success": bool, "model": str|None, "recommendations": dict|None, "error": str|None}
#     """
#     err = _ensure_gemini_ready()
#     if err:
#         return {"success": False, "model": None, "recommendations": None, "error": err}

#     try:
#         genai.configure(api_key=settings.GEMINI_API_KEY)  # type: ignore[attr-defined]
#         model_name = "gemini-1.5-flash"
#         model = genai.GenerativeModel(model_name)  # type: ignore

#         payload_str = json.dumps(analysis_payload, ensure_ascii=False)

#         prompt = (
#             "คุณเป็นผู้ช่วยด้านผิวหนัง ใช้ข้อมูลการวิเคราะห์เบื้องต้นต่อไปนี้เพื่อแนะนำสกินแคร์ "
#             "และสรุปสุขภาพผิว ตอบเป็น JSON ที่มีคีย์: "
#             "skinType, overallHealth{health_score,health_category}, "
#             "skincareRecommendations[], lifestyleRecommendations[], "
#             "dermatologistAdvice, improvementTimeline. "
#             "ตอบภาษาไทยและกระชับ\n\n"
#             f"DATA:\n{payload_str}"
#         )

#         resp = model.generate_content(prompt)  # type: ignore

#         text = (getattr(resp, "text", "") or "").strip()
#         try:
#             data = json.loads(text)
#         except Exception:
#             logger.warning("Gemini text response not JSON; using defaults")
#             data = {
#                 "skinType": "Unknown",
#                 "overallHealth": {"health_score": 65, "health_category": "moderate"},
#                 "skincareRecommendations": [],
#                 "lifestyleRecommendations": [],
#                 "dermatologistAdvice": None,
#                 "improvementTimeline": None,
#             }

#         data.setdefault("skinType", "Unknown")
#         data.setdefault("overallHealth", {"health_score": 65, "health_category": "moderate"})
#         data.setdefault("skincareRecommendations", [])
#         data.setdefault("lifestyleRecommendations", [])
#         data.setdefault("dermatologistAdvice", None)
#         data.setdefault("improvementTimeline", None)

#         return {"success": True, "model": model_name, "recommendations": data, "error": None}

#     except Exception as e:
#         logger.exception("Gemini text analysis error")
#         return {"success": False, "model": None, "recommendations": None, "error": str(e)}
# backend/utils/subprocess_utils.py
import subprocess
import json
import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from config.settings import settings

logger = logging.getLogger(__name__)


# =========================================================
# Subprocess (OpenCV)
# =========================================================
def run_subprocess_advanced(
    command: List[str],
    input_data: Optional[str] = None,
    timeout: int = settings.DEFAULT_TIMEOUT,
    env: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Enhanced subprocess runner with better error handling"""
    try:
        logger.info("🔄 Running advanced command: %s", " ".join(command))
        start_time = datetime.now()

        # Set environment variables for advanced mode
        process_env = os.environ.copy()
        process_env["OPENCV_ADVANCED_MODE"] = "true"
        process_env["FACE_DETECTION_ENHANCED"] = "true"

        if env:
            process_env.update(env)

        result = subprocess.run(
            command,
            input=input_data if input_data else None,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=process_env,
        )

        processing_time = (datetime.now() - start_time).total_seconds()
        logger.info("⏱️ Command completed in %.2f seconds", processing_time)

        if result.returncode != 0:
            logger.error("❌ Command failed with return code %s", result.returncode)
            logger.error("STDERR: %s", result.stderr)
            return {
                "success": False,
                "error": f"Process failed: {result.stderr}",
                "returncode": result.returncode,
                "processing_time": processing_time,
            }

        try:
            parsed_result = json.loads(result.stdout)
            parsed_result["processing_time"] = processing_time
            return parsed_result
        except json.JSONDecodeError as e:
            logger.error("❌ Failed to parse JSON output: %s", e)
            logger.error("Raw output: %s", result.stdout)
            return {
                "success": False,
                "error": "Invalid JSON response from subprocess",
                "raw_output": result.stdout,
                "processing_time": processing_time,
            }

    except subprocess.TimeoutExpired:
        logger.error("⏰ Subprocess timed out after %s seconds", timeout)
        return {"success": False, "error": f"Process timed out after {timeout} seconds"}
    except Exception as e:
        logger.error("❌ Subprocess error: %s", e)
        return {"success": False, "error": str(e)}


def run_opencv_analysis(image_path: str, debug_mode: bool = False) -> Dict[str, Any]:
    """Run advanced OpenCV skin analysis using opencv_processor.py"""
    opencv_script = settings.AI_MODELS_DIR / "opencv_processor.py"

    if not opencv_script.exists():
        logger.warning("OpenCV processor not found: %s", opencv_script)
        return {"success": False, "error": "OpenCV analyzer not available"}

    try:
        logger.info("🔍 Running OpenCV analysis: %s", image_path)

        env: Dict[str, str] = {}
        if debug_mode:
            env["DEBUG_SKIN_ANALYSIS"] = "true"

        result = run_subprocess_advanced(["python3", str(opencv_script), image_path], env=env)

        if result.get("success"):
            logger.info("✅ OpenCV analysis completed successfully")
            return result
        else:
            logger.error("❌ OpenCV analysis failed: %s", result.get("error"))
            return result

    except Exception as e:
        logger.error("❌ OpenCV analysis exception: %s", e)
        return {"success": False, "error": f"OpenCV analysis failed: {str(e)}"}


def run_legacy_opencv_analysis(image_path: str) -> Dict[str, Any]:
    """Run legacy OpenCV analysis as fallback"""
    opencv_legacy = settings.AI_MODELS_DIR / "opencv_legacy.py"

    if not opencv_legacy.exists():
        logger.warning("Legacy OpenCV processor not found: %s", opencv_legacy)
        return run_opencv_analysis(image_path, debug_mode=False)

    try:
        logger.info("🔄 Running legacy OpenCV analysis: %s", image_path)
        result = run_subprocess_advanced(["python3", str(opencv_legacy), image_path])

        if result.get("success"):
            logger.info("✅ Legacy OpenCV analysis completed")
            return result
        else:
            logger.error("❌ Legacy OpenCV analysis failed: %s", result.get("error"))
            return result

    except Exception as e:
        logger.error("❌ Legacy OpenCV analysis exception: %s", e)
        return {"success": False, "error": f"Legacy analysis failed: {str(e)}"}


# =========================================================
# Gemini (Vision / Text)
# =========================================================
try:
    import google.generativeai as genai  # type: ignore
    _HAS_GEMINI = True
except Exception as e:
    genai = None
    _HAS_GEMINI = False
    logger.warning("Gemini SDK not available: %s", e)

try:
    from PIL import Image
except Exception:
    Image = None


def _ensure_gemini_ready() -> Optional[str]:
    """Return error message if Gemini isn't ready; None if ok."""
    if not _HAS_GEMINI:
        return "google-generativeai not installed"
    if not getattr(settings, "GEMINI_API_KEY", None):
        return "GEMINI_API_KEY is missing"
    return None


# ---------- JSON Schema & Prompt ----------
_JSON_SCHEMA = """
โปรดตอบเป็น JSON ตรงตามสคีมาต่อไปนี้ (ห้ามมีข้อความอื่นปน):
{
  "overallHealth": {
    "health_score": number,                  // 0..100
    "health_category": "good"|"mild"|"moderate"|"severe"
  },
  "skinType": "Normal"|"Dry"|"Oily"|"Combination"|"Sensitive"|"Unknown",
  "areas": [
    {
      "type": "acne"|"redness"|"texture"|"spot"|"other",
      "bbox": { "x": number, "y": number, "w": number, "h": number }, // normalized 0..1
      "confidence": number                 // 0..100
    }
  ],
  "detectedIssues": ["acne","redness","texture_variation","color_variation"],
  "detectionCounts": { "acne": number, "redness": number, "texture_variation": number, "color_variation": number },
  "skincareRecommendations": [string],     // 3..8 ข้อ ภาษาไทย กระชับ
  "lifestyleRecommendations": [string],    // 3..6 ข้อ ภาษาไทย กระชับ
  "dermatologistAdvice": string|null,
  "improvementTimeline": string|null,
  "severity": "mild"|"moderate"|"severe",
  "severityScore": number,                 // 0..100
  "confidence": number                     // 0..100 ความมั่นใจรวมของผล
}
"""


def _extract_json(text: str) -> Optional[dict]:
    """พยายามดึง JSON แม้คำตอบจะห่อในโค้ดบล็อกหรือมีข้อความแทรก"""
    text = (text or "").strip()
    if not text:
        return None
    # ตัดโค้ดบล็อก ```json ... ```
    if "```" in text:
        parts = text.split("```")
        # หา chunk ที่เป็น json ที่สุด
        for i in range(len(parts) - 1, -1, -1):
            chunk = parts[i].strip()
            if chunk.lower().startswith("json"):
                chunk = chunk[4:].strip()
            try:
                return json.loads(chunk)
            except Exception:
                pass
    # ลอง parse ทั้งก้อน
    try:
        return json.loads(text)
    except Exception:
        return None


def run_gemini_vision(image_path: str, hint: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    วิเคราะห์ภาพด้วย Gemini Vision
    return: {"success": bool, "model": str|None, "recommendations": dict|None, "error": str|None, "raw": str|None}
    """
    err = _ensure_gemini_ready()
    if err:
        return {"success": False, "model": None, "recommendations": None, "error": err, "raw": None}
    if Image is None:
        return {"success": False, "model": None, "recommendations": None, "error": "Pillow not installed", "raw": None}

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)  # type: ignore[attr-defined]
        model_name = "gemini-1.5-flash"
        model = genai.GenerativeModel(model_name)  # type: ignore

        img = Image.open(image_path)  # type: ignore

        # ---- PROMPT (ตามที่คุณต้องการโฟกัสสิว + เพิ่มสคีมาเต็มที่ FE ใช้ได้) ----
        prompt = (
            "คุณเป็นผู้ช่วยด้านสกินแคร์ (ไม่ใช่แพทย์) วิเคราะห์ภาพผิวหน้าเพื่อ \"ตรวจหาบริเวณที่เป็นสิว\" เป็นหลัก "
            "และสรุปภาพรวมสุขภาพผิวสำหรับการแนะนำสกินแคร์.\n"
            "กติกา:\n"
            "- ระบุบริเวณที่พบสิว (acne) เป็นกรอบ bbox แบบ normalized (x,y,w,h) ค่าระหว่าง 0..1\n"
            "- ถ้าไม่พบปัญหา ให้ \"areas\" เป็นลิสต์ว่าง []\n"
            "- ประเมิน severity (mild|moderate|severe) และ severityScore 0..100\n"
            "- ให้คำแนะนำเบื้องต้น 3–6 ข้อเป็นภาษาไทย (ล้างหน้า/กันแดด/แต้มยา ฯลฯ)\n"
            "- ใส่ความมั่นใจรวมของผล (confidence 0..100)\n"
            f"{_JSON_SCHEMA}\n"
        )
        if hint:
            prompt += "\n(HINT จาก OpenCV – ใช้เป็น context เท่านั้น):\n" + json.dumps(hint, ensure_ascii=False)

        resp = model.generate_content([prompt, img])  # type: ignore
        raw_text = (getattr(resp, "text", "") or "").strip()

        data = _extract_json(raw_text)
        if data is None:
            return {
                "success": False,
                "model": model_name,
                "recommendations": None,
                "error": "Invalid JSON from Gemini",
                "raw": raw_text,
            }

        # เติม defaults กันคีย์หาย
        data.setdefault("overallHealth", {"health_score": 60, "health_category": "moderate"})
        data.setdefault("skinType", "Unknown")
        data.setdefault("areas", [])
        data.setdefault("detectedIssues", [])
        data.setdefault("detectionCounts", {})
        data.setdefault("skincareRecommendations", [])
        data.setdefault("lifestyleRecommendations", [])
        data.setdefault("dermatologistAdvice", None)
        data.setdefault("improvementTimeline", None)
        data.setdefault("severity", "mild")
        data.setdefault("severityScore", 50)
        data.setdefault("confidence", 60)

        return {"success": True, "model": model_name, "recommendations": data, "error": None, "raw": raw_text}

    except Exception as e:
        logger.exception("Gemini vision error")
        return {"success": False, "model": None, "recommendations": None, "error": str(e), "raw": None}


def run_gemini_analysis(analysis_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    วิเคราะห์แบบ text-only (ไม่ใช้รูป) จากผล OpenCV ที่สรุปมาแล้ว
    return: {"success": bool, "model": str|None, "recommendations": dict|None, "error": str|None, "raw": str|None}
    """
    err = _ensure_gemini_ready()
    if err:
        return {"success": False, "model": None, "recommendations": None, "error": err, "raw": None}

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)  # type: ignore[attr-defined]
        model_name = "gemini-1.5-flash"
        model = genai.GenerativeModel(model_name)  # type: ignore

        payload_str = json.dumps(analysis_payload, ensure_ascii=False)

        prompt = (
            "คุณเป็นผู้ช่วยด้านผิวหนัง ใช้ข้อมูลการวิเคราะห์เบื้องต้นต่อไปนี้เพื่อแนะนำสกินแคร์ "
            "และสรุปสุขภาพผิว ตอบเป็น JSON ที่มีคีย์: "
            "skinType, overallHealth{health_score,health_category}, "
            "skincareRecommendations[], lifestyleRecommendations[], "
            "dermatologistAdvice, improvementTimeline, "
            "detectedIssues[], detectionCounts{}, severity, severityScore, confidence. "
            "ตอบภาษาไทยและกระชับ\n\n"
            f"DATA:\n{payload_str}\n\n"
            f"{_JSON_SCHEMA}\n"
        )

        resp = model.generate_content(prompt)  # type: ignore
        raw_text = (getattr(resp, "text", "") or "").strip()

        data = _extract_json(raw_text)
        if data is None:
            return {
                "success": False,
                "model": model_name,
                "recommendations": None,
                "error": "Invalid JSON from Gemini",
                "raw": raw_text,
            }

        # defaults
        data.setdefault("skinType", "Unknown")
        data.setdefault("overallHealth", {"health_score": 65, "health_category": "moderate"})
        data.setdefault("skincareRecommendations", [])
        data.setdefault("lifestyleRecommendations", [])
        data.setdefault("dermatologistAdvice", None)
        data.setdefault("improvementTimeline", None)
        data.setdefault("detectedIssues", [])
        data.setdefault("detectionCounts", {})
        data.setdefault("severity", "mild")
        data.setdefault("severityScore", 50)
        data.setdefault("confidence", 60)

        return {"success": True, "model": model_name, "recommendations": data, "error": None, "raw": raw_text}

    except Exception as e:
        logger.exception("Gemini text analysis error")
        return {"success": False, "model": None, "recommendations": None, "error": str(e), "raw": None}
