#!/usr/bin/env python3
"""
Complete Skin AI Analysis with Gemini Integration
File: ai_models/gemini_recommender.py
"""
import subprocess
import json
import sys
import os
from pathlib import Path
import google.generativeai as genai
from PIL import Image

def setup_gemini():
    """ตั้งค่า Gemini API"""
    api_key = os.getenv('GEMINI_API_KEY')
    # api_key ="AIzaSyDQMvla98RH0xfwAguSbOgHLyQJVhvjBrQ"
    if not api_key:
        return None, "GEMINI_API_KEY not found in environment"
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        return model, None
    except Exception as e:
        return None, f"Failed to setup Gemini: {str(e)}"

def create_realistic_test_image():
    """สร้างรูปทดสอบที่เหมือนจริง"""
    try:
        from PIL import Image, ImageDraw
        import random
        
        uploads_dir = Path(__file__).parent.parent / "uploads"
        uploads_dir.mkdir(exist_ok=True)
        
        skin_test_path = uploads_dir / "skin_test.jpg"
        
        if not skin_test_path.exists():
            print(f"📸 Creating realistic skin test image...", file=sys.stderr)
            
            # สร้างรูปจำลองผิวหนัง
            img = Image.new('RGB', (640, 480), color='#FDBCB4')  # สีผิว
            draw = ImageDraw.Draw(img)
            
            # วาดจุดสีแดงจำลองสิว
            for i in range(random.randint(3, 8)):
                x = random.randint(50, 590)
                y = random.randint(50, 430)
                size = random.randint(5, 15)
                draw.ellipse([x-size, y-size, x+size, y+size], fill='#FF4444')
            
            # วาดจุดสีน้ำตาลจำลองจุดด่างดำ
            for i in range(random.randint(2, 5)):
                x = random.randint(50, 590)
                y = random.randint(50, 430)
                size = random.randint(3, 10)
                draw.ellipse([x-size, y-size, x+size, y+size], fill='#8B4513')
            
            # วาดเส้นจำลองรอยย่น
            for i in range(random.randint(1, 3)):
                x1, y1 = random.randint(100, 540), random.randint(100, 380)
                x2, y2 = x1 + random.randint(-50, 50), y1 + random.randint(-20, 20)
                draw.line([x1, y1, x2, y2], fill='#D2B48C', width=2)
            
            img.save(str(skin_test_path), 'JPEG', quality=95)
            print(f"✅ Realistic skin test image created: {skin_test_path}", file=sys.stderr)
            
        return skin_test_path
        
    except Exception as e:
        print(f"❌ Error creating realistic test image: {e}", file=sys.stderr)
        return None

def run_yolo_analysis(image_path: str):
    """รัน YOLO analysis"""
    yolo_script = Path(__file__).parent / "yolo_analyzer.py"
    
    try:
        print(f"🔍 Running YOLO on: {image_path}", file=sys.stderr)
        
        result = subprocess.run(
            ["python3", str(yolo_script), str(image_path)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=60
        )
        
        if result.stderr:
            print(f"YOLO stderr: {result.stderr}", file=sys.stderr)
        
        if result.returncode != 0:
            return None, f"YOLO failed with code {result.returncode}: {result.stderr}"
        
        yolo_output = json.loads(result.stdout)
        print("✅ YOLO analysis completed", file=sys.stderr)
        return yolo_output, None
        
    except subprocess.TimeoutExpired:
        return None, "YOLO analysis timeout (60s)"
    except json.JSONDecodeError as e:
        return None, f"Invalid JSON from YOLO: {e}"
    except Exception as e:
        return None, f"YOLO error: {str(e)}"

def analyze_with_gemini(model, image_path: str, yolo_results: dict):
    """วิเคราะห์ด้วย Gemini"""
    try:
        print("🤖 Starting Gemini analysis...", file=sys.stderr)
        
        # อ่านรูปภาพ
        image = Image.open(image_path)
        
        # ข้อมูลจาก YOLO
        yolo_data = yolo_results.get('result', {})
        total_detections = yolo_data.get('total_detections', 0)
        detected_issues = yolo_data.get('detectedIssues', [])
        detection_counts = yolo_data.get('detectionCounts', {})
        
        # สร้าง prompt สำหรับ Gemini
        prompt = f"""
คุณเป็นผู้เชี่ยวชาญด้านผิวหนังและเทคโนโลยี AI วิเคราะห์รูปภาพผิวหนังนี้และผลลัพธ์จากระบบ YOLO Object Detection:

📊 YOLO Detection Results:
- จำนวนการตรวจพบทั้งหมด: {total_detections}
- ปัญหาที่ตรวจพบ: {detected_issues}
- จำนวนแต่ละประเภท: {detection_counts}

🎯 งานของคุณ:
1. วิเคราะห์สภาพผิวหนังจากรูปภาพ
2. รวมข้อมูลจาก YOLO กับการวิเคราะห์ของคุณ
3. ให้คำแนะนำที่เป็นประโยชน์

กรุณาตอบในรูปแบบ JSON ที่สมบูรณ์:

{{
    "skin_analysis": {{
        "overall_condition": "คำอธิบายสภาพผิวโดยรวม",
        "detected_issues": ["รายการปัญหาที่พบ"],
        "severity_level": "mild/moderate/severe",
        "confidence_score": 0.85,
        "skin_type": "dry/oily/combination/sensitive/normal",
        "problem_areas": ["บริเวณที่มีปัญหา"]
    }},
    "yolo_integration": {{
        "yolo_detections_confirmed": true/false,
        "additional_findings": ["สิ่งที่พบเพิ่มเติมจาก YOLO"],
        "detection_accuracy": "ความแม่นยำของ YOLO"
    }},
    "recommendations": {{
        "immediate_care": ["การดูแลเร่งด่วน"],
        "daily_skincare": ["กิจวัตรการดูแลผิวประจำวัน"],
        "products_suggested": [
            {{
                "type": "ประเภทผลิตภัณฑ์",
                "ingredients": ["ส่วนผสมที่แนะนำ"],
                "usage": "วิธีใช้"
            }}
        ],
        "lifestyle_tips": ["คำแนะนำการใช้ชีวิต"],
        "avoid": ["สิ่งที่ควรหลีกเลี่ยง"]
    }},
    "follow_up": {{
        "should_see_dermatologist": true/false,
        "timeframe": "กรอบเวลาที่ควรพบแพทย์",
        "warning_signs": ["อาการเตือนที่ต้องระวัง"],
        "next_check": "ควรตรวจสอบอีกครั้งเมื่อไหร่"
    }},
    "prevention": {{
        "daily_habits": ["นิสัยประจำวันที่ดี"],
        "environmental_factors": ["ปัจจัยสิ่งแวดล้อมที่ต้องระวัง"],
        "seasonal_care": ["การดูแลตามฤดูกาล"]
    }}
}}

⚠️ สำคัญ: 
- ตอบเป็นภาษาไทยเท่านั้น
- ให้คำแนะนำที่ปลอดภัยและเป็นประโยชน์
- ไม่วินิจฉัยโรค แต่แนะนำการดูแลและการปรึกษาแพทย์
- ตอบเป็น JSON ที่ถูกต้องเท่านั้น
"""
        
        # ส่งไปยัง Gemini
        response = model.generate_content([prompt, image])
        response_text = response.text.strip()
        
        print("✅ Gemini response received", file=sys.stderr)
        
        # แปลง response เป็น JSON
        try:
            # หา JSON ใน response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                gemini_result = json.loads(json_text)
                
                # เพิ่มข้อมูล metadata
                gemini_result['_metadata'] = {
                    'analysis_timestamp': str(Path(__file__).stat().st_mtime),
                    'model_used': 'gemini-1.5-flash',
                    'image_analyzed': str(image_path),
                    'yolo_integration': True
                }
                
                print("✅ Gemini JSON parsed successfully", file=sys.stderr)
                return gemini_result, None
            else:
                raise json.JSONDecodeError("No JSON found in response", response_text, 0)
                
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing failed: {e}", file=sys.stderr)
            
            # สร้าง fallback response
            fallback_result = {
                "skin_analysis": {
                    "overall_condition": "ไม่สามารถวิเคราะห์รูปภาพได้อย่างสมบูรณ์",
                    "detected_issues": detected_issues if detected_issues else ["ไม่พบปัญหาเฉพาะ"],
                    "severity_level": "unknown",
                    "confidence_score": 0.3,
                    "skin_type": "unknown",
                    "problem_areas": []
                },
                "yolo_integration": {
                    "yolo_detections_confirmed": total_detections > 0,
                    "additional_findings": [f"YOLO ตรวจพบ {total_detections} จุด"],
                    "detection_accuracy": "ไม่สามารถประเมินได้"
                },
                "recommendations": {
                    "immediate_care": ["ปรึกษาผู้เชี่ยวชาญด้านผิวหนัง"],
                    "daily_skincare": ["ทำความสะอาดผิวอย่างอ่อนโยน", "ใช้ครีมกันแดดทุกวัน"],
                    "products_suggested": [
                        {
                            "type": "ผลิตภัณฑ์ทำความสะอาด",
                            "ingredients": ["ส่วนผสมอ่อนโยน"],
                            "usage": "ใช้เช้า-เย็น"
                        }
                    ],
                    "lifestyle_tips": ["ดื่มน้ำให้เพียงพอ", "นอนหลับพักผ่อนให้เพียงพอ"],
                    "avoid": ["การขูดขีดผิวหนัง", "ผลิตภัณฑ์ที่มีแอลกอฮอล์สูง"]
                },
                "follow_up": {
                    "should_see_dermatologist": True,
                    "timeframe": "ภายใน 1-2 สัปดาห์",
                    "warning_signs": ["อาการแย่ลง", "เกิดการอักเสบ", "มีอาการคัน"],
                    "next_check": "2 สัปดาห์"
                },
                "prevention": {
                    "daily_habits": ["ล้างหน้าด้วยน้ำเย็น", "หลีกเลี่ยงการสัมผัสหน้าบ่อย"],
                    "environmental_factors": ["หลีกเลี่ยงแสงแดดจัด", "ใช้เครื่องปรับอากาศในระดับที่เหมาะสม"],
                    "seasonal_care": ["ปรับการดูแลตามความชื้นของอากาศ"]
                },
                "_error": {
                    "gemini_parsing_failed": True,
                    "raw_response": response_text[:500] + "..." if len(response_text) > 500 else response_text,
                    "error_message": str(e)
                }
            }
            
            return fallback_result, None
            
    except Exception as e:
        return None, f"Gemini analysis error: {str(e)}"

def main():
    """Main function - Complete Skin AI Analysis"""
    try:
        print("🚀 Starting Complete Skin AI Analysis System", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        input_data = {}
        if len(sys.argv) > 1:
            try:
                input_data = json.loads(sys.argv[1])
                print(f"📥 Received input: {input_data}", file=sys.stderr)
            except Exception as e:
                print(f"⚠️ Failed to parse input JSON: {e}", file=sys.stderr)

        # Step 1: ตรวจสอบและสร้างรูปทดสอบ
        print("📸 Step 1: Preparing test image...", file=sys.stderr)
        
        # หารูปทดสอบ
        uploads_dir = Path(__file__).parent.parent / "uploads"
        possible_images = [
            uploads_dir / "skin_test.jpg",
            uploads_dir / "test_image.jpg"
        ]
        
        image_path = None
        for img_path in possible_images:
            if img_path.exists():
                image_path = img_path
                break
        
        # ถ้าไม่มีรูป ให้สร้างใหม่
        if not image_path:
            print("📷 No test image found, creating realistic test image...", file=sys.stderr)
            image_path = create_realistic_test_image()
        
        if not image_path or not image_path.exists():
            result = {
                "success": False,
                "error": "Cannot find or create test image",
                "step": "image_preparation"
            }
            print(json.dumps(result, indent=2, ensure_ascii=False))
            sys.exit(1)
        
        print(f"✅ Using image: {image_path}", file=sys.stderr)
        
        # Step 2: YOLO Analysis
        print("🔍 Step 2: YOLO Object Detection...", file=sys.stderr)
        yolo_results, yolo_error = run_yolo_analysis(str(image_path))
        
        if yolo_error:
            result = {
                "success": False,
                "error": f"YOLO analysis failed: {yolo_error}",
                "step": "yolo_analysis"
            }
            print(json.dumps(result, indent=2, ensure_ascii=False))
            sys.exit(1)
        
        print("✅ YOLO analysis completed successfully", file=sys.stderr)
        
        # Step 3: Gemini Analysis
        print("🤖 Step 3: Gemini AI Analysis...", file=sys.stderr)
        model, setup_error = setup_gemini()
        
        if setup_error:
            print(f"⚠️ Gemini setup failed: {setup_error}", file=sys.stderr)
            result = {
                "success": True,
                "message": "YOLO analysis completed, Gemini unavailable",
                "yolo_results": yolo_results,
                "gemini_results": {
                    "error": setup_error,
                    "available": False
                },
                "step": "gemini_setup_failed"
            }
        else:
            gemini_results, gemini_error = analyze_with_gemini(model, str(image_path), yolo_results)
            
            if gemini_error:
                print(f"⚠️ Gemini analysis failed: {gemini_error}", file=sys.stderr)
                result = {
                    "success": True,
                    "message": "YOLO completed, Gemini analysis failed",
                    "yolo_results": yolo_results,
                    "gemini_results": {
                        "error": gemini_error,
                        "available": False
                    },
                    "step": "gemini_analysis_failed"
                }
            else:
                print("✅ Gemini analysis completed successfully", file=sys.stderr)
                # result = {
                #     "success": True,
                #     "message": "Complete skin analysis finished successfully",
                #     "analysis_summary": {
                #         "image_path": str(image_path),
                #         "yolo_detections": yolo_results.get('result', {}).get('total_detections', 0),
                #         "gemini_confidence": gemini_results.get('skin_analysis', {}).get('confidence_score', 0.0),
                #         "severity_level": gemini_results.get('skin_analysis', {}).get('severity_level', 'unknown'),
                #         "should_see_doctor": gemini_results.get('follow_up', {}).get('should_see_dermatologist', False)
                #     },
                #     "yolo_results": yolo_results,
                #     "gemini_results": gemini_results,
                #     "step": "completed"
                # }
                result = {
    "success": True,
    "message": "Complete skin analysis finished successfully",
    "analysis_summary": {
        "image_path": str(image_path),
        "yolo_detections": yolo_results.get('result', {}).get('total_detections', 0),
        "gemini_confidence": gemini_results.get('skin_analysis', {}).get('confidence_score', 0.0),
        "severity_level": gemini_results.get('skin_analysis', {}).get('severity_level', 'unknown'),
        "should_see_doctor": gemini_results.get('follow_up', {}).get('should_see_dermatologist', False)
    },
    "yolo_results": yolo_results,
    "gemini_results": gemini_results,

    # ✅ เพิ่ม block นี้
    "recommendations": gemini_results.get("recommendations", {
        "immediate_care": ["ล้างหน้าด้วยเจลอ่อนโยน", "ใช้ครีมกันแดดทุกวัน"],
        "daily_skincare": ["ใช้มอยส์เจอร์ไรเซอร์เนื้อบางเบา"],
        "lifestyle_tips": ["ดื่มน้ำให้เพียงพอ", "นอนหลับพักผ่อนให้เพียงพอ"],
    }),

    "step": "completed"
}

        
        print("=" * 50, file=sys.stderr)
        print("🎉 Analysis pipeline completed!", file=sys.stderr)
        
        # Output final JSON result
        print(json.dumps(result, indent=2, ensure_ascii=False))
        sys.exit(0)
        
    except KeyboardInterrupt:
        error_result = {
            "success": False,
            "error": "Analysis interrupted by user",
            "step": "interrupted"
        }
        print(json.dumps(error_result, indent=2, ensure_ascii=False))
        sys.exit(1)
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "step": "main_error"
        }
        print(json.dumps(error_result, indent=2, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
