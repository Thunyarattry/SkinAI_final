import sys
import json
import cv2
import numpy as np
from pathlib import Path
import os

# Debug mode control
DEBUG_MODE = os.getenv('DEBUG_FACE_DETECTION', 'false').lower() == 'true'

def debug_print(message):
    """Print debug messages to stderr only when DEBUG_MODE is enabled"""
    if DEBUG_MODE:
        print(message, file=sys.stderr)

def analyze_image(image_path):
    """
    วิเคราะห์ภาพและตรวจจับใบหน้า พร้อมวิเคราะห์ผิวหนัง
    """
    # โหลดภาพ
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError("Cannot read image")
    
    debug_print(f"Image loaded: {img.shape}")
    
    # โหลด cascade classifier สำหรับตรวจจับหน้า
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    
    # ตรวจสอบว่า cascade โหลดสำเร็จ
    if face_cascade.empty():
        raise ValueError("Failed to load face cascade classifier")
    
    # แปลงเป็น grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # ลองหลาย parameters สำหรับ face detection
    detection_params = [
        {"scaleFactor": 1.05, "minNeighbors": 3, "minSize": (30, 30)},
        {"scaleFactor": 1.1, "minNeighbors": 3, "minSize": (50, 50)},
        {"scaleFactor": 1.1, "minNeighbors": 5, "minSize": (30, 30)},
        {"scaleFactor": 1.3, "minNeighbors": 3, "minSize": (20, 20)},
        {"scaleFactor": 1.05, "minNeighbors": 2, "minSize": (40, 40)}
    ]
    
    faces = []
    detection_method_used = None
    
    for i, params in enumerate(detection_params):
        temp_faces = face_cascade.detectMultiScale(gray, **params)
        debug_print(f"Method {i+1}: Found {len(temp_faces)} faces with params {params}")
        
        if len(temp_faces) > 0:
            faces = temp_faces
            detection_method_used = f"frontal_method_{i+1}"
            debug_print(f"Using detection method {i+1}")
            break
    
    # หากยังไม่เจอ ลองใช้ profile face cascade
    if len(faces) == 0:
        debug_print("Trying profile face detection...")
        profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")
        if not profile_cascade.empty():
            faces = profile_cascade.detectMultiScale(gray, 1.1, 3, minSize=(30, 30))
            if len(faces) > 0:
                detection_method_used = "profile_detection"
            debug_print(f"Profile detection found: {len(faces)} faces")
    
    # หากยังไม่เจอ ลองปรับ contrast และ brightness
    if len(faces) == 0:
        debug_print("Trying enhanced image...")
        enhanced = cv2.convertScaleAbs(gray, alpha=1.2, beta=30)
        faces = face_cascade.detectMultiScale(enhanced, 1.05, 3, minSize=(30, 30))
        if len(faces) > 0:
            detection_method_used = "enhanced_image"
        debug_print(f"Enhanced image detection found: {len(faces)} faces")
    
    if len(faces) == 0:
        return {
            "success": False, 
            "error": "No face detected",
            "debug": {
                "imageSize": {"width": img.shape[1], "height": img.shape[0]},
                "methodsTried": len(detection_params) + 2,
                "detectionMethod": "none"
            }
        }
    
    # เลือกใบหน้าที่ใหญ่ที่สุด
    if len(faces) > 1:
        areas = [w * h for (x, y, w, h) in faces]
        largest_face_idx = np.argmax(areas)
        x, y, w, h = faces[largest_face_idx]
        debug_print(f"Selected largest face from {len(faces)} detected faces")
    else:
        x, y, w, h = faces[0]
    
    debug_print(f"Face coordinates: x={x}, y={y}, w={w}, h={h}")
    
    # ขยายขอบเขตใบหน้าเล็กน้อย (padding)
    padding = 20
    x_pad = max(0, x - padding)
    y_pad = max(0, y - padding)
    w_pad = min(img.shape[1] - x_pad, w + 2*padding)
    h_pad = min(img.shape[0] - y_pad, h + 2*padding)
    
    # ตัดใบหน้า
    cropped_face = img[y_pad:y_pad+h_pad, x_pad:x_pad+w_pad]
    
    # บันทึกภาพ cropped
    output_path = Path(image_path).parent / f"{Path(image_path).stem}_cropped{Path(image_path).suffix}"
    cv2.imwrite(str(output_path), cropped_face)
    debug_print(f"Cropped face saved to: {output_path}")
    
    # วิเคราะห์ผิวหนังแบบละเอียด
    skin_analysis = analyze_skin_detailed(cropped_face)
    
    return {
        "success": True,
        "faceCoordinates": {
            "x": int(x), 
            "y": int(y), 
            "width": int(w), 
            "height": int(h)
        },
        "paddedCoordinates": {
            "x": int(x_pad),
            "y": int(y_pad), 
            "width": int(w_pad), 
            "height": int(h_pad)
        },
        "originalSize": {
            "width": img.shape[1], 
            "height": img.shape[0]
        },
        "croppedSize": {
            "width": int(w_pad), 
            "height": int(h_pad)
        },
        "croppedImagePath": str(output_path),
        "skinAnalysis": skin_analysis,
        "debug": {
            "facesDetected": len(faces),
            "detectionMethod": detection_method_used or "unknown"
        }
    }

def analyze_skin_detailed(face_img):
    """
    วิเคราะห์ผิวหนังแบบละเอียด
    """
    # แปลงเป็น different color spaces
    gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(face_img, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(face_img, cv2.COLOR_BGR2LAB)
    
    # คำนวณค่าสถิติ
    mean_intensity = int(cv2.mean(gray)[0])
    std_intensity = int(np.std(gray))
    
    # วิเคราะห์ brightness
    brightness = np.mean(lab[:,:,0])
    
    # วิเคราะห์ skin tone จาก HSV
    h_mean = np.mean(hsv[:,:,0])
    s_mean = np.mean(hsv[:,:,1])
    v_mean = np.mean(hsv[:,:,2])
    
    # กำหนดประเภทผิว
    if mean_intensity > 140:
        skin_type = "Oily"
        skin_condition = "May have excess oil production"
    elif mean_intensity < 100:
        skin_type = "Dry"
        skin_condition = "May need more moisture"
    else:
        skin_type = "Normal"
        skin_condition = "Balanced skin condition"
    
    # วิเคราะห์ skin tone
    if brightness > 170:
        skin_tone = "Light"
    elif brightness > 120:
        skin_tone = "Medium"
    else:
        skin_tone = "Dark"
    
    # คำนวณ texture (ใช้ standard deviation เป็นตัวบ่งชี้)
    if std_intensity > 30:
        texture = "Rough/Uneven"
    elif std_intensity > 20:
        texture = "Moderate"
    else:
        texture = "Smooth"
    
    return {
        "skinType": skin_type,
        "skinTone": skin_tone,
        "skinCondition": skin_condition,
        "texture": texture,
        "metrics": {
            "meanIntensity": mean_intensity,
            "stdIntensity": std_intensity,
            "brightness": round(brightness, 2),
            "hue": round(h_mean, 2),
            "saturation": round(s_mean, 2),
            "value": round(v_mean, 2)
        },
        "recommendations": generate_recommendations(skin_type, skin_tone, texture)
    }

def generate_recommendations(skin_type, skin_tone, texture):
    """
    สร้างคำแนะนำตามประเภทผิว
    """
    recommendations = []
    
    # แนะนำตามประเภทผิว
    if skin_type == "Oily":
        recommendations.extend([
            "Use cleansers with Salicylic Acid",
            "Avoid heavy oil-based creams",
            "Use toner to control oil production"
        ])
    elif skin_type == "Dry":
        recommendations.extend([
            "Use moisturizers with Hyaluronic Acid",
            "Avoid over-cleansing",
            "Use hydrating serums"
        ])
    else:
        recommendations.extend([
            "Maintain balance with gentle products",
            "Use sunscreen daily"
        ])
    
    # แนะนำตาม skin tone
    if skin_tone == "Light":
        recommendations.append("Use SPF 30+ sunscreen regularly")
    elif skin_tone == "Dark":
        recommendations.append("Focus on preventing dark spots")
    
    # แนะนำตาม texture
    if texture == "Rough/Uneven":
        recommendations.extend([
            "Use gentle AHA/BHA products",
            "Gentle exfoliation 1-2 times per week"
        ])
    
    return recommendations

def test_opencv_installation():
    """
    ทดสอบการติดตั้ง OpenCV
    """
    try:
        debug_print(f"OpenCV version: {cv2.__version__}")
        
        # ทดสอบ cascade files
        face_cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        if Path(face_cascade_path).exists():
            debug_print("✅ Face cascade file found")
        else:
            debug_print("❌ Face cascade file not found")
            return False
            
        profile_cascade_path = cv2.data.haarcascades + "haarcascade_profileface.xml"
        if Path(profile_cascade_path).exists():
            debug_print("✅ Profile cascade file found")
        else:
            debug_print("❌ Profile cascade file not found")
            
        return True
    except Exception as e:
        debug_print(f"❌ OpenCV test failed: {e}")
        return False

if __name__ == "__main__":
    try:
        # ทดสอบ OpenCV ก่อน
        if not test_opencv_installation():
            print(json.dumps({"success": False, "error": "OpenCV installation problem"}))
            sys.exit(1)
        
        if len(sys.argv) < 2:
            raise ValueError("No image path provided")
        
        image_path = sys.argv[1]
        if not Path(image_path).exists():
            raise FileNotFoundError(f"File not found: {image_path}")
        
        debug_print(f"Processing image: {image_path}")
        result = analyze_image(image_path)
        
        # Output clean JSON only
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        error_result = {
            "success": False, 
            "error": str(e),
            "errorType": type(e).__name__
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)
