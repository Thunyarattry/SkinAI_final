import sys
import json
from pathlib import Path
from ultralytics import YOLO
import torch

def load_model():
    """โหลด YOLO model"""
    try:
        # ตรวจสอบไฟล์ model
        model_paths = ["yolov8n.pt", "../yolov8n.pt", "./yolov8n.pt"]
        model_path = None
        
        for path in model_paths:
            if Path(path).exists():
                model_path = path
                break
        
        if not model_path:
            raise FileNotFoundError("YOLOv8 model file not found in any expected location")
        
        print(f"Loading model from: {model_path}", file=sys.stderr)
        
        # โหลด model (ครั้งเดียวเท่านั้น!)
        model = YOLO(model_path)
        
        print("✅ Model loaded successfully", file=sys.stderr)
        return model
        
    except Exception as e:
        error_msg = f"Failed to load YOLO model: {str(e)}"
        print(json.dumps({"success": False, "error": error_msg}, ensure_ascii=False))
        sys.exit(1)

def analyze_skin(model, image_path):
    """วิเคราะห์รูปภาพด้วย YOLO"""
    try:
        # ตรวจสอบไฟล์รูปภาพ
        if not Path(image_path).exists():
            return {"success": False, "error": f"Image file not found: {image_path}"}
        
        print(f"Analyzing image: {image_path}", file=sys.stderr)
        
        # ทำการทำนาย
        results = model.predict(
            source=str(image_path), 
            save=False, 
            imgsz=640, 
            conf=0.25,
            verbose=False  # ลด noise ใน output
        )

        if not results or len(results) == 0:
            return {"success": False, "error": "No results from model"}

        result = results[0]
        detected_classes = {}
        total_detections = 0

        # ตรวจสอบว่ามี boxes ถูก detect หรือไม่
        if result.boxes is not None and len(result.boxes) > 0:
            for box in result.boxes:
                cls_idx = int(box.cls.item())  # แปลงเป็น int
                confidence = float(box.conf.item())  # แปลงเป็น float
                
                # ใช้ class name จาก model
                cls_name = model.names.get(cls_idx, f"class_{cls_idx}")
                
                if cls_name not in detected_classes:
                    detected_classes[cls_name] = {
                        "count": 0,
                        "max_confidence": 0.0,
                        "avg_confidence": 0.0,
                        "confidences": []
                    }
                
                detected_classes[cls_name]["count"] += 1
                detected_classes[cls_name]["confidences"].append(confidence)
                detected_classes[cls_name]["max_confidence"] = max(
                    detected_classes[cls_name]["max_confidence"], 
                    confidence
                )
                total_detections += 1
            
            # คำนวณ average confidence
            for cls_name in detected_classes:
                confidences = detected_classes[cls_name]["confidences"]
                detected_classes[cls_name]["avg_confidence"] = sum(confidences) / len(confidences)
                # ลบ confidences list ออกจาก final result
                del detected_classes[cls_name]["confidences"]
            
            print(f"✅ Detected {total_detections} objects in {len(detected_classes)} classes", file=sys.stderr)
            
            return {
                "success": True,
                "total_detections": total_detections,
                "detected_classes": len(detected_classes),
                "detectedIssues": list(detected_classes.keys()),
                "detectionCounts": {cls: data["count"] for cls, data in detected_classes.items()},
                "detection_details": detected_classes
            }
        else:
            print("No objects detected in image", file=sys.stderr)
            return {
                "success": True,
                "total_detections": 0,
                "detected_classes": 0,
                "detectedIssues": [],
                "detectionCounts": {},
                "message": "No objects detected in the image"
            }

    except Exception as e:
        error_msg = f"Prediction failed: {str(e)}"
        print(f"❌ Error: {error_msg}", file=sys.stderr)
        return {"success": False, "error": error_msg}

def main():
    """Main function"""
    try:
        # ตรวจสอบ arguments
        if len(sys.argv) < 2:
            raise ValueError("Usage: python script.py <image_path>")

        image_path = sys.argv[1]
        
        # โหลด model
        model = load_model()
        
        # วิเคราะห์รูปภาพ
        result = analyze_skin(model, image_path)
        
        # แสดงผลลัพธ์
        print(json.dumps(result, ensure_ascii=False, indent=2))

    except Exception as e:
        error_result = {"success": False, "error": str(e)}
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
