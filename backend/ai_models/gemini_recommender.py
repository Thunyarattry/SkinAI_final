import json
import sys
import os
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_gemini():
    """Setup Gemini API"""
    try:
        import google.generativeai as genai
        
        # api_key = (
        #     os.getenv('GEMINI_API_KEY') or 
        #     os.getenv('GOOGLE_API_KEY') or
        #     "AIzaSyDQMvla98RH0xfwAguSbOgHLyQJVhvjBrQ"
        # )
        api_key = os.getenv('GEMINI_API_KEY') or "AIzaSyDQMvla98RH0xfwAguSbOgHLyQJVhvjBrQ"
        genai.configure(api_key=api_key)
       
        # if not api_key:
        #     return None, "API key not found"
        
        # genai.configure(api_key=api_key)
        
        generation_config = {
            "temperature": 0.3,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        
        # model = genai.GenerativeModel(
        #     'gemini-1.5-flash',
        #     generation_config=generation_config
        # )
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=generation_config
        )       
        return model, None
        
    except ImportError:
        return None, "google-generativeai package not installed"
    except Exception as e:
        return None, f"Setup failed: {str(e)}"

def create_analysis_prompt(data: dict) -> str:
    """Create analysis prompt"""
    detected_issues = data.get('detected_issues', [])
    detection_counts = data.get('detection_counts', {})
    
    return f"""
คุณเป็นผู้เชี่ยวชาญด้านผิวหนัง
วิเคราะห์ข้อมูลผิวหนังและให้คำแนะนำครอบคลุม

ข้อมูลที่ตรวจพบ: {detected_issues}
จำนวนปัญหา: {detection_counts}

ตอบในรูปแบบ JSON:
{{
    "skinType": "ประเภทผิว",
    "conditionAssessment": "การประเมินสภาพผิว",
    "skincareRecommendations": ["คำแนะนำ1", "คำแนะนำ2"],
    "productRecommendations": {{
        "cleanser": "ผลิตภัณฑ์ทำความสะอาด",
        "treatment": "ผลิตภัณฑ์รักษา",
        "moisturizer": "ครีมบำรุง"
    }},
    "severity": "mild/moderate/severe"
}}

ภาษาไทย
"""

def analyze_with_gemini(input_data):
    """Analyze with Gemini"""
    try:
        model, error = setup_gemini()
        if error:
            return {"success": False, "error": error}
        
        prompt = create_analysis_prompt(input_data)
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Try to parse JSON
        try:
            # Find JSON in response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                json_data = json.loads(json_text)
                
                return {
                    "success": True,
                    "recommendations": json_data,
                    "model": "gemini-1.5-flash",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                raise json.JSONDecodeError("No JSON found", response_text, 0)
                
        except json.JSONDecodeError:
            # Fallback - create simple recommendations
            detected_issues = input_data.get('detected_issues', [])
            total_issues = len(detected_issues)
            severity = "severe" if total_issues > 20 else "moderate" if total_issues > 10 else "mild"
            
            recommendations = {
                "skinType": "Mixed" if 'oily_skin' in detected_issues else "Normal",
                "conditionAssessment": f"ตรวจพบปัญหา {total_issues} ประเภท ระดับ {severity}",
                "skincareRecommendations": [
                    "ทำความสะอาดผิวด้วยผลิตภัณฑ์อ่อนโยน",
                    "ใช้ครีมบำรุงที่เหมาะกับสภาพผิว",
                    "ทาครีมกันแดด SPF 30+ ทุกวัน"
                ],
                "productRecommendations": {
                    "cleanser": "เจลทำความสะอาดสำหรับผิวมัน",
                    "treatment": "เซรั่มที่มี Niacinamide",
                    "moisturizer": "ครีมบำรุงไม่มีน้ำมัน"
                },
                "severity": severity
            }
            
            return {
                "success": True,
                "recommendations": recommendations,
                "model": "gemini-1.5-flash-fallback",
                "timestamp": datetime.now().isoformat()
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Analysis failed: {str(e)}"
        }

def main():
    """Main function"""
    try:
        input_data = {}
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
        
        # ✅ รองรับ requestType ต่างๆ
        request_type = input_data.get('requestType', 'analysis')
        
        if request_type == 'status_check':
            result = {
                "success": True,
                "available": True,
                "model": "gemini-1.5-flash",
                "message": "Gemini AI พร้อมให้บริการ"
            }
        else:
            # Default: analysis
            result = analyze_with_gemini(input_data)
        
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Main error: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()

