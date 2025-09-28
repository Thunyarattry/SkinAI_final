# routes/upload.py
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
import logging
from datetime import datetime
from pathlib import Path

from models.schemas import AnalysisResponse, FaceDetectionInfo, SkinAnalysisResult
from utils.file_utils import (
    generate_analysis_id,
    is_valid_image,
    save_upload_file,
    save_analysis_to_file,
    get_file_extension,
    cleanup_file,
)
from utils.subprocess_utils import (
    run_opencv_analysis,
    run_legacy_opencv_analysis,
    run_gemini_analysis,   # text-only fallback
    run_gemini_vision,     # vision with image
)
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter()


async def generate_gemini_recommendations(response_data: dict):
    """
    Fallback: เรียก Gemini แบบ text-only โดยส่งสรุปจาก OpenCV เข้าไป
    (ใช้เมื่อ vision ใช้ไม่ได้)
    """
    logger.info("🤖 เริ่ม Gemini (text) recommendations...")
    try:
        skin_analysis = response_data.get("skinAnalysis")
        if not skin_analysis:
            logger.warning("⚠️ ไม่มีข้อมูล skin analysis → ใช้ fallback พื้นฐาน")
            response_data["recommendations"] = generate_fallback_recommendations({})
            response_data["geminiSuccess"] = False
            response_data["geminiError"] = "No skin analysis data"
            return

        # แปลงเป็น dict เผื่อเป็น Pydantic model
        if isinstance(skin_analysis, SkinAnalysisResult):
            analysis_data = skin_analysis.dict()
        else:
            analysis_data = skin_analysis

        face_detection = response_data.get("faceDetection")
        if isinstance(face_detection, FaceDetectionInfo):
            face_detection_dict = face_detection.dict()
        else:
            face_detection_dict = face_detection or {}

        gemini_input = {
            "detected_issues": analysis_data.get("detectedIssues", []),
            "detection_counts": analysis_data.get("detectionCounts", {}),
            "opencv_analysis": analysis_data.get("opencv_analysis", {}),
            "overall_health": analysis_data.get("overall_health", {}),
            "face_analysis": face_detection_dict.get("face_analysis", {}),
            "language": "th",
            "timestamp": datetime.now().isoformat(),
        }

        res = run_gemini_analysis(gemini_input)
        if res.get("success") and res.get("recommendations"):
            response_data["recommendations"] = res["recommendations"]
            response_data["geminiSuccess"] = True
            response_data["geminiModel"] = res.get("model", "gemini-1.5-flash")
            logger.info("✅ Gemini (text) สำเร็จ")
        else:
            err = res.get("error", "Unknown error")
            logger.error(f"❌ Gemini (text) ล้มเหลว: {err}")
            response_data["recommendations"] = generate_fallback_recommendations(analysis_data)
            response_data["geminiSuccess"] = False
            response_data["geminiError"] = err

    except Exception as e:
        logger.exception("❌ Gemini (text) exception")
        fallback_data = {}
        sa = response_data.get("skinAnalysis")
        if isinstance(sa, SkinAnalysisResult):
            fallback_data = sa.dict()
        elif isinstance(sa, dict):
            fallback_data = sa
        response_data["recommendations"] = generate_fallback_recommendations(fallback_data)
        response_data["geminiSuccess"] = False
        response_data["geminiError"] = f"Exception: {str(e)}"


@router.post("/upload", response_model=AnalysisResponse)
async def upload_and_analyze_advanced(
    file: UploadFile = File(...),
    enable_advanced: bool = True,
    debug_mode: bool = False,
    enable_gemini: bool = Form(False),  # ส่งมาจาก FE: formData.append('enable_gemini','true')
):
    """
    🚀 Upload + Analyze (OpenCV + optional Gemini Vision)
    """
    start_time = datetime.now()

    # ---------- Validate ----------
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not is_valid_image(file.filename):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image file (JPG, PNG, GIF, WEBP, BMP)",
        )

    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size too large. Maximum 15MB allowed")
    await file.seek(0)

    analysis_id = generate_analysis_id()
    file_ext = get_file_extension(file.filename)
    original_filename = f"{analysis_id}{file_ext}"
    original_path = settings.UPLOAD_DIR / original_filename

    try:
        # ---------- Save upload ----------
        await save_upload_file(file, original_path)
        logger.info(f"📁 File saved: {original_path}")

        # ---------- Base response ----------
        response_data = {
            "success": True,
            "analysisId": analysis_id,
            "timestamp": datetime.now().isoformat(),
            "originalImage": f"/uploads/{original_filename}",
            "geminiSuccess": False,
        }

        # ---------- STEP 1: OpenCV (advanced or legacy) ----------
        if enable_advanced:
            logger.info("🔍 Running Advanced OpenCV Analysis...")
            ocv = run_opencv_analysis(str(original_path), debug_mode)
        else:
            logger.info("🔁 Running Legacy OpenCV Analysis...")
            ocv = run_legacy_opencv_analysis(str(original_path), debug_mode)

        if ocv.get("success"):
            fd = ocv.get("face_detection", {}) or {}
            response_data["faceDetection"] = FaceDetectionInfo(
                detected=fd.get("detected", False),
                coordinates=fd.get("coordinates"),
                confidence=fd.get("confidence"),
                detection_method=fd.get("detection_method"),
                face_analysis=fd.get("face_analysis"),
                total_faces=fd.get("total_faces"),
                message=fd.get("reason") if not fd.get("detected") else None,
            )

            response_data["skinAnalysis"] = SkinAnalysisResult(
                success=True,
                total_detections=ocv.get("total_detections", 0),
                detected_classes=ocv.get("detected_classes", 0),
                detectedIssues=ocv.get("detectedIssues", []),
                detectionCounts=ocv.get("detectionCounts", {}),
                detection_details=ocv.get("detection_details", {}),
                opencv_analysis=ocv.get("opencv_analysis", {}),
                face_detection=response_data["faceDetection"],
                analysis_method=ocv.get("analysis_method", "OpenCV"),
                overall_health=ocv.get("overall_health"),
            )

            if ocv.get("croppedImagePath"):
                cropped_filename = Path(ocv["croppedImagePath"]).name
                response_data["croppedImage"] = f"/uploads/{cropped_filename}"

            logger.info(
                f"✅ OpenCV completed: {ocv.get('total_detections', 0)} issues detected"
            )
        else:
            logger.warning(f"⚠️ OpenCV analysis failed: {ocv.get('error')}")
            response_data["faceDetection"] = FaceDetectionInfo(
                detected=False,
                message=ocv.get("error", "Analysis failed"),
            )
            # skinAnalysis ไม่ตั้งทับเมื่อ fail; FE จะยังแสดงผลได้ด้วย fallback rec.

        # ---------- STEP 2: Gemini (vision) ----------
        # if enable_gemini:
        #     hint = None
        #     sa = response_data.get("skinAnalysis")
        #     if isinstance(sa, SkinAnalysisResult):
        #         hint = {
        #             "opencv_overall_health": getattr(sa, "overall_health", None),
        #             "detectedIssues": getattr(sa, "detectedIssues", []),
        #             "detectionCounts": getattr(sa, "detectionCounts", {}),
        #         }
        #     elif isinstance(sa, dict):
        #         hint = {
        #             "opencv_overall_health": sa.get("overall_health"),
        #             "detectedIssues": sa.get("detectedIssues", []),
        #             "detectionCounts": sa.get("detectionCounts", {}),
        #         }

        #     g = run_gemini_vision(str(original_path), hint)
        #     if g.get("success") and isinstance(g.get("recommendations"), dict):
        #         rec = g["recommendations"]
        #         response_data["recommendations"] = {
        #             "skinType": rec.get("skinType"),
        #             "conditionAssessment": None,  # optional: map จาก overallHealth ถ้าต้องการ
        #             "skincareRecommendations": rec.get("skincareRecommendations", []),
        #             "lifestyleRecommendations": rec.get("lifestyleRecommendations", []),
        #             "dermatologistAdvice": rec.get("dermatologistAdvice"),
        #             "improvementTimeline": rec.get("improvementTimeline"),
        #             "severity": (rec.get("overallHealth", {}).get("health_category") or "mild").lower(),
        #         }
        #         # อัปเดต overall_health จาก Gemini ถ้าส่งมา
        #         oh = rec.get("overallHealth") or {}
        #         if isinstance(sa, SkinAnalysisResult) and oh:
        #             sa.overall_health = {
        #                 "health_score": oh.get("health_score", 0),
        #                 "health_category": oh.get("health_category", "unknown"),
        #             }

        #         response_data["geminiSuccess"] = True
        #         response_data["geminiModel"] = g.get("model")
        #         logger.info("✨ Gemini (vision) merged into response")
        #     else:
        #         logger.warning("↩️ Gemini (vision) unavailable → try text fallback")
        #         await generate_gemini_recommendations(response_data)
        # else:
        #     # ถ้าไม่ได้เปิด Gemini ให้มีคำแนะนำพื้นฐานอย่างน้อย
        #     if not response_data.get("recommendations"):
        #         await generate_gemini_recommendations(response_data)
        # STEP 2: Generate Gemini AI Recommendations
        if enable_gemini:
            # ส่ง hint จากผล opencv ไปช่วยโมเดล (ถ้ามี)
            hint = None
            if isinstance(response_data.get("skinAnalysis"), SkinAnalysisResult):
                sa = response_data["skinAnalysis"]
                hint = {
                    "opencv_overall_health": getattr(sa, "overall_health", None),
                    "detectedIssues": getattr(sa, "detectedIssues", []),
                    "detectionCounts": getattr(sa, "detectionCounts", {})
                }

            g = run_gemini_vision(str(original_path), hint)

            if g.get("success") and isinstance(g.get("recommendations"), dict):
                rec = g["recommendations"]

                # 1) ใส่ badge Gemini
                response_data["geminiSuccess"] = True
                response_data["geminiModel"] = g.get("model")

                # 2) รวมผล health จาก Gemini ไปอัพเดท skinAnalysis.overall_health
                if response_data.get("skinAnalysis") and isinstance(response_data["skinAnalysis"], SkinAnalysisResult):
                    oh = rec.get("overallHealth") or {}
                    if oh:
                        response_data["skinAnalysis"].overall_health = {
                            "health_score": oh.get("health_score", 0),
                            "health_category": oh.get("health_category", "unknown")
                        }

                # 3) รวม recommendations (คีย์ที่ FE ใช้)
                response_data["recommendations"] = {
                    "skinType": rec.get("skinType", "Unknown"),
                    "conditionAssessment": None,  # จะคำนวนเอง/หรือปล่อยว่าง
                    "skincareRecommendations": rec.get("skincareRecommendations", []),
                    "lifestyleRecommendations": rec.get("lifestyleRecommendations", []),
                    "dermatologistAdvice": rec.get("dermatologistAdvice"),
                    "improvementTimeline": rec.get("improvementTimeline"),
                    "severity": (rec.get("severity") or rec.get("overallHealth", {}).get("health_category") or "mild").lower()
                }

                # 4) เก็บข้อมูล areas/severityScore/confidence ของ Gemini ไว้ให้ FE แสดง
                response_data["gemini"] = {
                    "areas": rec.get("areas", []),             # [{type,bbox{x,y,w,h},confidence},...]
                    "severity": rec.get("severity"),
                    "severityScore": rec.get("severityScore"),
                    "confidence": rec.get("confidence"),
                }

                # 5) ผสาน detectedIssues/detectionCounts จาก Gemini (พื้นที่ที่ตรวจเจอ) เข้า skinAnalysis
                #    เพื่อให้ overview มี "ตรวจพบบริเวณ..." แม้ OpenCV ไม่เจอ
                if response_data.get("skinAnalysis") and isinstance(response_data["skinAnalysis"], SkinAnalysisResult):
                    sa = response_data["skinAnalysis"]
                    # เริ่มจากค่าที่มี
                    det_counts = dict(getattr(sa, "detectionCounts", {}) or {})
                    det_issues = set(getattr(sa, "detectedIssues", []) or [])

                    for a in rec.get("areas", []):
                        t = (a.get("type") or "").strip().lower()
                        if not t:
                            continue
                        # map type -> ชื่อ issue เดิมของ FE ถ้าจำเป็น
                        if t == "texture":
                            mapped = "texture_variation"
                        elif t == "spot":
                            mapped = "color_variation"
                        elif t in ("acne", "redness", "texture_variation", "color_variation"):
                            mapped = t
                        else:
                            mapped = t  # เก็บตามจริง

                        det_counts[mapped] = det_counts.get(mapped, 0) + 1
                        det_issues.add(mapped)

                    sa.detectionCounts = det_counts
                    sa.detectedIssues = list(det_issues)
                    # อัปเดต total_detections ให้สอดคล้อง
                    sa.total_detections = sum(det_counts.values())

            else:
                # ถ้า Gemini fail → ใช้ fallback เดิม (แต่ยังมีผล OpenCV อยู่)
                await generate_gemini_recommendations(response_data)
        else:
            # ไม่เปิด Gemini → อย่างน้อยให้ fallback แนะนำจากผล OpenCV
            if response_data.get("skinAnalysis"):
                await generate_gemini_recommendations(response_data)
            else:
                response_data["recommendations"] = generate_fallback_recommendations({})
                response_data["geminiSuccess"] = False

        # ---------- Wrap up ----------
        total_time = (datetime.now() - start_time).total_seconds()
        response_data["processing_time"] = round(total_time, 2)

        # เก็บประวัติ
        await save_analysis_to_file(analysis_id, response_data)

        logger.info(f"🎉 Analysis completed: {analysis_id} in {total_time:.2f}s")
        return AnalysisResponse(**response_data)

    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        cleanup_file(original_path)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ----------------------------
# Fallback recommendations
# ----------------------------
def generate_fallback_recommendations(analysis_data: dict) -> dict:
    """สร้างคำแนะนำพื้นฐานจากผล OpenCV (ถ้ามี)"""
    detected_issues = analysis_data.get("detectedIssues", [])
    detection_counts = analysis_data.get("detectionCounts", {})
    overall_health = analysis_data.get("overall_health", {})

    total_issues = len(detected_issues)
    health_score = overall_health.get("health_score", 100)

    skincare_recommendations = [
        "ใช้ผลิตภัณฑ์ทำความสะอาดที่อ่อนโยน pH สมดุล",
        "ทาครีมกันแดดสเปกตรัมกว้างทุกวัน",
        "ใช้ครีมบำรุงผิวที่เหมาะสมกับสภาพผิว",
        "รักษาขั้นตอนการดูแลผิวให้สม่ำเสมอ",
    ]
    lifestyle_recommendations = [
        "ดื่มน้ำให้เพียงพอต่อวัน",
        "รับประทานอาหารที่มีผักและผลไม้",
        "นอนหลับให้เพียงพอเพื่อการฟื้นฟูผิว",
        "หลีกเลี่ยงการสัมผัสใบหน้าด้วยมือที่ไม่สะอาด",
    ]

    if "acne" in detected_issues:
        acne_count = detection_counts.get("acne", 0)
        skincare_recommendations.extend(
            [
                f"พบสิว {acne_count} จุด - ใช้ผลิตภัณฑ์ที่มี Salicylic Acid",
                "หลีกเลี่ยงการบีบสิวด้วยมือ",
                "ใช้ครีมรักษาสิวที่มี Benzoyl Peroxide ความเข้มข้นต่ำ",
            ]
        )
        lifestyle_recommendations.append("หลีกเลี่ยงอาหารที่มีน้ำตาลและไขมันสูง")

    if "redness" in detected_issues:
        skincare_recommendations.extend(
            [
                "พบผิวแดง - ใช้ผลิตภัณฑ์ที่มี Niacinamide",
                "หลีกเลี่ยงผลิตภัณฑ์ที่มีแอลกอฮอล์",
                "ใช้ครีมบำรุงที่มีส่วนผสมของ Centella Asiatica",
            ]
        )

    if "texture_variation" in detected_issues:
        skincare_recommendations.extend(
            [
                "พบความไม่เรียบเนียนของผิว - ใช้ AHA/BHA อ่อนๆ",
                "ทำ exfoliate อย่างอ่อนโยน 1-2 ครั้งต่อสัปดาห์",
            ]
        )

    if "color_variation" in detected_issues:
        skincare_recommendations.extend(
            [
                "พบจุดด่างดำ - ใช้เซรั่มที่มี Vitamin C",
                "ใช้ครีมกันแดดป้องกันจุดด่างดำเพิ่มเติม",
            ]
        )

    if health_score >= 70:
        severity = "mild"
        skin_type = "Normal"
        condition_assessment = "ผิวอยู่ในสภาพดี มีปัญหาเล็กน้อย"
    elif health_score >= 40:
        severity = "moderate"
        skin_type = "Combination"
        condition_assessment = f"พบปัญหาผิว {total_issues} ประเภท ต้องดูแลเป็นพิเศษ"
    else:
        severity = "severe"
        skin_type = "Problematic"
        condition_assessment = f"พบปัญหาผิวหลายประเภท (คะแนนสุขภาพ: {health_score}/100) ควรปรึกษาแพทย์"
        lifestyle_recommendations.append("ควรปรึกษาแพทย์ผิวหนังเพื่อการรักษาที่เหมาะสม")

    return {
        "skinType": skin_type,
        "conditionAssessment": condition_assessment,
        "skincareRecommendations": skincare_recommendations[:8],
        "lifestyleRecommendations": lifestyle_recommendations[:6],
        "dermatologistAdvice": "ปรึกษาแพทย์ผิวหนังหากมีปัญหาที่กังวลหรือไม่ดีขึ้น",
        "improvementTimeline": "2-4 สัปดาห์สำหรับปัญหาเล็กน้อย, 6-12 สัปดาห์สำหรับปัญหาที่รุนแรง",
        "note": "คำแนะนำจากระบบ OpenCV/Fallback",
        "detectedIssues": detected_issues,
        "detectionCounts": detection_counts,
        "healthScore": health_score,
        "severity": severity,
    }
