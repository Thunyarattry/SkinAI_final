from fastapi import APIRouter, File, UploadFile, HTTPException
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
    cleanup_file
)
from utils.subprocess_utils import (
    run_opencv_analysis, 
    run_legacy_opencv_analysis,
    run_gemini_analysis
)
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter()

async def generate_gemini_recommendations(response_data: dict):
    """Generate Gemini AI recommendations - แก้ไข Pydantic model issue"""
    logger.info("🤖 เริ่ม Gemini recommendations...")
    
    try:
        # ✅ ดึงข้อมูล skin analysis
        skin_analysis = response_data.get("skinAnalysis")
        if not skin_analysis:
            logger.warning("⚠️ ไม่มีข้อมูล skin analysis")
            response_data["recommendations"] = generate_fallback_recommendations({})
            response_data["geminiSuccess"] = False
            response_data["geminiError"] = "No skin analysis data"
            return
        
        # ✅ แปลงเป็น dict (แก้ปัญหา Pydantic)
        if isinstance(skin_analysis, SkinAnalysisResult):
            analysis_data = skin_analysis.dict()
        else:
            analysis_data = skin_analysis
        
        # ✅ แปลง face_detection เป็น dict ด้วย
        face_detection = response_data.get("faceDetection")
        if isinstance(face_detection, FaceDetectionInfo):
            face_detection_dict = face_detection.dict()
        else:
            face_detection_dict = face_detection or {}
        
        # ✅ เตรียมข้อมูลสำหรับ Gemini
        gemini_input = {
            "detected_issues": analysis_data.get("detectedIssues", []),
            "detection_counts": analysis_data.get("detectionCounts", {}),
            "opencv_analysis": analysis_data.get("opencv_analysis", {}),
            "overall_health": analysis_data.get("overall_health", {}),
            "face_analysis": face_detection_dict.get("face_analysis", {}),
            "language": "th",
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"📊 ส่งข้อมูลไป Gemini: {len(gemini_input.get('detected_issues', []))} ปัญหา")
        
        # ✅ เรียก Gemini
        gemini_result = run_gemini_analysis(gemini_input)
        
        # ✅ ตรวจสอบผลลัพธ์
        if gemini_result.get("success") and gemini_result.get("recommendations"):
            response_data["recommendations"] = gemini_result["recommendations"]
            response_data["geminiSuccess"] = True
            response_data["geminiModel"] = gemini_result.get("model", "gemini-1.5-flash")
            logger.info("✅ Gemini สำเร็จ!")
        else:
            error_msg = gemini_result.get("error", "Unknown error")
            logger.error(f"❌ Gemini ล้มเหลว: {error_msg}")
            
            # ✅ ส่งข้อมูลที่ถูกต้องไป fallback
            response_data["recommendations"] = generate_fallback_recommendations(analysis_data)
            response_data["geminiSuccess"] = False
            response_data["geminiError"] = error_msg
            
    except Exception as e:
        logger.error(f"❌ Gemini exception: {e}")
        
        # ✅ ใช้ข้อมูลจาก skin analysis ถ้ามี
        fallback_data = {}
        if response_data.get("skinAnalysis"):
            skin_analysis = response_data["skinAnalysis"]
            if isinstance(skin_analysis, SkinAnalysisResult):
                fallback_data = skin_analysis.dict()
            else:
                fallback_data = skin_analysis
        
        response_data["recommendations"] = generate_fallback_recommendations(fallback_data)
        response_data["geminiSuccess"] = False
        response_data["geminiError"] = f"Exception: {str(e)}"

@router.post("/upload", response_model=AnalysisResponse)
async def upload_and_analyze_advanced(
    file: UploadFile = File(...),
    enable_advanced: bool = True,
    debug_mode: bool = False
):
    """🚀 Enhanced upload and analysis"""
    
    start_time = datetime.now()
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not is_valid_image(file.filename):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload an image file (JPG, PNG, GIF, WEBP, BMP)"
        )
    
    # Check file size
    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size too large. Maximum 15MB allowed")
    await file.seek(0)
    
    analysis_id = generate_analysis_id()
    file_extension = get_file_extension(file.filename)
    original_filename = f"{analysis_id}{file_extension}"
    original_path = settings.UPLOAD_DIR / original_filename
    
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
        
        # STEP 1: OpenCV Analysis
        if enable_advanced:
            logger.info("🔍 Running Advanced OpenCV Analysis...")
            opencv_result = run_opencv_analysis(str(original_path), debug_mode)
            
            if opencv_result.get("success"):
                # Parse face detection results
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
                
                # Add cropped image if available
                if opencv_result.get("croppedImagePath"):
                    cropped_filename = Path(opencv_result["croppedImagePath"]).name
                    response_data["croppedImage"] = f"/uploads/{cropped_filename}"
                
                logger.info(f"✅ Advanced analysis completed: {opencv_result.get('total_detections', 0)} issues detected")
                
            else:
                logger.warning(f"⚠️ OpenCV analysis failed: {opencv_result.get('error')}")
                response_data["faceDetection"] = FaceDetectionInfo(
                    detected=False,
                    message=opencv_result.get("error", "Analysis failed")
                )
        else:
            # Fallback to legacy analysis
            await fallback_to_legacy_analysis(response_data, original_path)
        
        # STEP 2: Generate Gemini AI Recommendations
        if response_data.get("skinAnalysis"):
            await generate_gemini_recommendations(response_data)
        else:
            logger.warning("⚠️ ไม่มี skin analysis, ข้าม Gemini")
            response_data["recommendations"] = generate_fallback_recommendations({})
            response_data["geminiSuccess"] = False
        
        # Calculate total processing time
        total_time = (datetime.now() - start_time).total_seconds()
        response_data["processing_time"] = round(total_time, 2)
        
        # Save analysis result to file for history
        await save_analysis_to_file(analysis_id, response_data)
        
        logger.info(f"🎉 Analysis completed: {analysis_id} in {total_time:.2f}s")
        return AnalysisResponse(**response_data)
        
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        cleanup_file(original_path)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# ✅ เก็บ functions อื่นๆ ไว้เหมือนเดิม
def generate_fallback_recommendations(analysis_data: dict) -> dict:
    """Generate fallback recommendations - แก้ไขให้ใช้ข้อมูลจริง"""
    detected_issues = analysis_data.get("detectedIssues", [])
    detection_counts = analysis_data.get("detectionCounts", {})
    overall_health = analysis_data.get("overall_health", {})
    
    # ✅ ใช้ข้อมูลจริงจาก OpenCV analysis
    total_issues = len(detected_issues)
    health_score = overall_health.get("health_score", 100)
    
    # Basic recommendations based on detected issues
    skincare_recommendations = [
        "ใช้ผลิตภัณฑ์ทำความสะอาดที่อ่อนโยน pH สมดุล",
        "ทาครีมกันแดดสเปกตรัมกว้างทุกวัน",
        "ใช้ครีมบำรุงผิวที่เหมาะสมกับสภาพผิว",
        "รักษาขั้นตอนการดูแลผิวให้สม่ำเสมอ"
    ]
    
    lifestyle_recommendations = [
        "ดื่มน้ำให้เพียงพอต่อวัน",
        "รับประทานอาหารที่มีผักและผลไม้",
        "นอนหลับให้เพียงพอเพื่อการฟื้นฟูผิว",
        "หลีกเลี่ยงการสัมผัสใบหน้าด้วยมือที่ไม่สะอาด"
    ]
    
    # ✅ เพิ่มคำแนะนำเฉพาะตามปัญหาที่พบจริง
    if "acne" in detected_issues:
        acne_count = detection_counts.get("acne", 0)
        skincare_recommendations.extend([
            f"พบสิว {acne_count} จุด - ใช้ผลิตภัณฑ์ที่มี Salicylic Acid",
            "หลีกเลี่ยงการบีบสิวด้วยมือ",
            "ใช้ครีมรักษาสิวที่มี Benzoyl Peroxide ความเข้มข้นต่ำ"
        ])
        lifestyle_recommendations.append("หลีกเลี่ยงอาหารที่มีน้ำตาลและไขมันสูง")
    
    if "redness" in detected_issues:
        skincare_recommendations.extend([
            "พบผิวแดง - ใช้ผลิตภัณฑ์ที่มี Niacinamide",
            "หลีกเลี่ยงผลิตภัณฑ์ที่มีแอลกอฮอล์",
            "ใช้ครีมบำรุงที่มีส่วนผสมของ Centella Asiatica"
        ])
    
    if "texture_variation" in detected_issues:
        skincare_recommendations.extend([
            "พบความไม่เรียบเนียนของผิว - ใช้ AHA/BHA อ่อนๆ",
            "ทำ exfoliate อย่างอ่อนโยน 1-2 ครั้งต่อสัปดาห์"
        ])
    
    if "color_variation" in detected_issues:
        skincare_recommendations.extend([
            "พบจุดด่างดำ - ใช้เซรั่มที่มี Vitamin C",
            "ใช้ครีมกันแดดป้องกันจุดด่างดำเพิ่มเติม"
        ])
    
    # ✅ ประเมินความรุนแรงจากข้อมูลจริง
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
        "skincareRecommendations": skincare_recommendations[:8],  # จำกัดไม่เกิน 8 ข้อ
        "lifestyleRecommendations": lifestyle_recommendations[:6],  # จำกัดไม่เกิน 6 ข้อ
        "dermatologistAdvice": "ปรึกษาแพทย์ผิวหนังหากมีปัญหาที่กังวลหรือไม่ดีขึ้น",
        "improvementTimeline": "2-4 สัปดาห์สำหรับปัญหาเล็กน้อย, 6-12 สัปดาห์สำหรับปัญหาที่รุนแรง",
        "note": "คำแนะนำจากระบบ Advanced OpenCV Analysis",
        "detectedIssues": detected_issues,  # ✅ ใช้ข้อมูลจริง
        "detectionCounts": detection_counts,
        "healthScore": health_score,
        "severity": severity
    }
