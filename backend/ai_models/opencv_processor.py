import sys
import json
import cv2
import numpy as np
from pathlib import Path
import os
from typing import Dict, List, Tuple, Optional
import math

# Debug mode control
DEBUG_MODE = os.getenv('DEBUG_SKIN_ANALYSIS', 'false').lower() == 'true'

def debug_print(message):
    """Print debug messages to stderr only when DEBUG_MODE is enabled"""
    if DEBUG_MODE:
        print(message, file=sys.stderr)

class EnhancedFaceDetector:
    """Enhanced face detection with multiple methods"""
    def __init__(self):
        try:
            self.cascades = {}
            self.cascades['frontal'] = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            self.cascades['frontal_alt'] = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt.xml")
            self.cascades['frontal_alt2'] = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml")
            self.cascades['profile'] = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")
            self.cascades['eyes'] = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
            debug_print("✅ Enhanced Face Detector initialized with multiple cascades")
        except Exception as e:
            debug_print(f"❌ Face Detector initialization failed: {e}")
            raise

    def detect_face(self, image: np.ndarray) -> Dict:
        try:
            if image is None or image.size == 0:
                return {"detected": False, "reason": "Empty or invalid image", "methods_tried": []}

            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            preprocessed_images = {
                'original': gray,
                'equalized': cv2.equalizeHist(gray),
                'clahe': cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(gray),
                'blurred': cv2.GaussianBlur(gray, (3, 3), 0)
            }

            methods_tried = []
            all_detections = []

            # Frontal cascade
            for prep_name, prep_image in preprocessed_images.items():
                faces = self.cascades['frontal'].detectMultiScale(prep_image, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30))
                if len(faces) > 0:
                    method_name = f"frontal_{prep_name}"
                    methods_tried.append(method_name)
                    best_face = max(faces, key=lambda f: f[2]*f[3])
                    x, y, w, h = best_face
                    if self._validate_coordinates(x, y, w, h, image.shape):
                        all_detections.append(({
                            "detected": True,
                            "coordinates": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                            "detection_method": method_name,
                            "confidence": 0.85
                        }, 0.85))

            # Profile / eye-based / skin color fallback (similar logic)
            # Eye-based detection
            eyes = self.cascades['eyes'].detectMultiScale(preprocessed_images['clahe'], scaleFactor=1.1, minNeighbors=2, minSize=(10, 10))
            if len(eyes) >= 2:
                methods_tried.append("eye_based")
                estimated_face = self._estimate_face_from_eyes(eyes, image.shape)
                if estimated_face is not None:
                    x, y, w, h = estimated_face
                    if self._validate_coordinates(x, y, w, h, image.shape):
                        all_detections.append(({
                            "detected": True,
                            "coordinates": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                            "detection_method": "eye_based_enhanced",
                            "confidence": 0.70
                        }, 0.70))

            # Skin color fallback
            skin_regions = self._detect_skin_regions(image)
            if skin_regions:
                methods_tried.append("skin_color_based")
                largest_region = max(skin_regions, key=lambda r: r[2]*r[3])
                x, y, w, h = largest_region
                if w>50 and h>50 and 0.7<w/h<1.5:
                    all_detections.append(({
                        "detected": True,
                        "coordinates": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                        "detection_method": "skin_color_based",
                        "confidence": 0.60
                    }, 0.60))

            if all_detections:
                best_detection = max(all_detections, key=lambda x: x[1])
                return best_detection[0]

            return {"detected": False, "reason": "No face detected", "methods_tried": methods_tried}

        except Exception as e:
            debug_print(f"❌ Face detection error: {e}")
            return {"detected": False, "reason": str(e)}

    def _detect_skin_regions(self, image: np.ndarray) -> List[Tuple[int,int,int,int]]:
        try:
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            lower_skin = np.array([0, 20, 70], dtype=np.uint8)
            upper_skin = np.array([20, 255, 255], dtype=np.uint8)
            mask = cv2.inRange(hsv, lower_skin, upper_skin)
            kernel = np.ones((3,3), np.uint8)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            regions = [(x, y, w, h) for c in contours if (x:=cv2.boundingRect(c)[0]) is not None and (y:=cv2.boundingRect(c)[1]) is not None and (w:=cv2.boundingRect(c)[2])>40 and (h:=cv2.boundingRect(c)[3])>40]
            return regions
        except:
            return []

    def _validate_coordinates(self, x:int, y:int, w:int, h:int, shape:Tuple) -> bool:
        height, width = shape[:2]
        return 0<=x<width and 0<=y<height and w>20 and h>20 and x+w<=width and y+h<=height

    def _estimate_face_from_eyes(self, eyes: np.ndarray, shape: Tuple) -> Optional[np.ndarray]:
        if len(eyes)<2:
            return None
        eye1, eye2 = eyes[0], eyes[1]
        left_eye = eye1 if eye1[0]<eye2[0] else eye2
        right_eye = eye2 if eye1[0]<eye2[0] else eye1
        eye_dist = (right_eye[0]+right_eye[2]//2)-(left_eye[0]+left_eye[2]//2)
        face_w, face_h = int(eye_dist*3.0), int(eye_dist*3.0*1.3)
        center_x = (left_eye[0]+right_eye[0]+left_eye[2]+right_eye[2])//4
        center_y = (left_eye[1]+right_eye[1]+left_eye[3]+right_eye[3])//4
        x = max(0, center_x-face_w//2)
        y = max(0, center_y-int(face_h*0.35))
        face_w = min(face_w, shape[1]-x)
        face_h = min(face_h, shape[0]-y)
        return np.array([x,y,face_w,face_h]) if face_w>40 and face_h>40 else None

class SkinAnalyzer:
    """Enhanced skin analysis with detailed classification"""
    def __init__(self):
        self.face_detector = EnhancedFaceDetector()
        debug_print("✅ Enhanced Skin Analyzer initialized")

    def analyze_image(self, image_path:str) -> Dict:
        try:
            image_path = Path(image_path)
            if not image_path.exists():
                return {"success": False, "error": f"Image not found: {image_path}", "face_detection":{"detected":False}}

            image = cv2.imread(str(image_path))
            if image is None:
                return {"success": False, "error": "Cannot read image", "face_detection":{"detected":False}}

            face_result = self.face_detector.detect_face(image)

            cropped_image_path = None
            if face_result.get("detected") and "coordinates" in face_result:
                coords = face_result["coordinates"]
                x, y, w, h = coords["x"], coords["y"], coords["width"], coords["height"]
                padding = min(15, x, y, image.shape[1]-x-w, image.shape[0]-y-h)
                cropped_face = image[y-padding:y+h+padding, x-padding:x+w+padding]
                cropped_image_path = image_path.parent / f"{image_path.stem}_cropped{image_path.suffix}"
                cv2.imwrite(str(cropped_image_path), cropped_face)

            skin_analysis = self._enhanced_skin_analysis(image, face_result)

            return {
                "success": True,
                "face_detection": face_result,
                "croppedImagePath": str(cropped_image_path) if cropped_image_path else None,
                "detectedIssues": skin_analysis.get("detected_issues", []),
                "issueCounts": skin_analysis.get("issue_counts", {}),
                "detection_details": skin_analysis.get("details", {}),
                "overall_health": skin_analysis.get("overall_health"),
                "analysis_method": "Enhanced OpenCV + Skin Type Classification",
                "image_info": {"original_path": str(image_path), "image_size":{"width":image.shape[1],"height":image.shape[0]}, "channels":image.shape[2] if len(image.shape)>2 else 1}
            }

        except Exception as e:
            debug_print(f"❌ Analysis failed: {e}")
            return {"success": False, "error": str(e), "face_detection":{"detected":False}}

    def _enhanced_skin_analysis(self, image: np.ndarray, face_result: Dict) -> Dict:
        """Enhanced skin analysis with acne, blemish, texture, brightness, skin type"""
        detected_issues=[]
        issue_counts={}
        details={}

        # Region
        if face_result.get("detected") and "coordinates" in face_result:
            coords = face_result["coordinates"]
            x, y, w, h = coords["x"], coords["y"], coords["width"], coords["height"]
            if self.face_detector._validate_coordinates(x,y,w,h,image.shape):
                region=image[y:y+h, x:x+w]
            else:
                region=image
        else:
            region=image

        if region is None or region.size==0:
            return {"detected_issues":[],"issue_counts":{},"total_issues":0,"details":{"error":"Invalid region"},"overall_health":{"health_category":"unknown","health_score":0}}

        gray=cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
        hsv=cv2.cvtColor(region, cv2.COLOR_BGR2HSV)

        # Acne
        acne_count=self._detect_acne_spots(region)
        if acne_count>0:
            detected_issues.append("acne")
            issue_counts["acne"]=acne_count
            details["acne"]={"count":acne_count,"severity":"moderate" if acne_count>3 else "mild"}

        # Blemishes (ฝ้า, จุดด่างดำ)
        mask_blemish=cv2.inRange(hsv,np.array([0,0,50]),np.array([179,50,150]))
        contours,_=cv2.findContours(mask_blemish,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
        blemish_count=len([c for c in contours if cv2.contourArea(c)>30])
        if blemish_count>0:
            detected_issues.append("blemishes")
            issue_counts["blemishes"]=blemish_count
            details["blemishes"]={"count":blemish_count}

        # Skin type
        mean_val=np.mean(gray)
        brightness_std=np.std(gray)
        if mean_val>180 and brightness_std>50:
            skin_type="oily"
        elif mean_val<100 and brightness_std<30:
            skin_type="dry"
        else:
            skin_type="normal"
        details["skin_type"]=skin_type

        # Texture
        laplacian_var=cv2.Laplacian(gray,cv2.CV_64F).var()
        details["texture_variance"]=laplacian_var
        if laplacian_var>150:
            detected_issues.append("rough_texture")
        elif laplacian_var>80:
            detected_issues.append("mild_rough_texture")

        # Brightness-based skin condition
        mean_brightness=np.mean(gray)
        if mean_brightness>200:
            details["skin_condition"]="oily"
        elif mean_brightness<70:
            details["skin_condition"]="dry"
        else:
            details["skin_condition"]="normal"

        # Overall health score
        total_issues=len(detected_issues)
        if total_issues==0:
            health_category="excellent"; health_score=95
        elif total_issues<=2:
            health_category="good"; health_score=80
        elif total_issues<=4:
            health_category="fair"; health_score=65
        else:
            health_category="needs_attention"; health_score=max(30,80-total_issues*10)

        return {
            "detected_issues":detected_issues,
            "issue_counts":issue_counts,
            "total_issues":total_issues,
            "details":details,
            "overall_health":{"health_category":health_category,"health_score":health_score}
        }

    def _detect_acne_spots(self, region: np.ndarray) -> int:
        """Simple acne detection based on red spots"""
        try:
            hsv=cv2.cvtColor(region, cv2.COLOR_BGR2HSV)
            lower_red1=np.array([0,50,50])
            upper_red1=np.array([10,255,255])
            lower_red2=np.array([160,50,50])
            upper_red2=np.array([179,255,255])
            mask1=cv2.inRange(hsv,lower_red1,upper_red1)
            mask2=cv2.inRange(hsv,lower_red2,upper_red2)
            mask=mask1|mask2
            kernel=np.ones((3,3),np.uint8)
            mask=cv2.morphologyEx(mask,cv2.MORPH_OPEN,kernel)
            mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,kernel)
            contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
            acne_spots=len([c for c in contours if 5<cv2.contourArea(c)<200])
            return acne_spots
        except:
            return 0

# Example usage
if __name__=="__main__":
    import argparse
    parser=argparse.ArgumentParser(description="Enhanced Face & Skin Analysis")
    parser.add_argument("image",help="Path to input image")
    parser.add_argument("--debug",action="store_true",help="Enable debug messages")
    args=parser.parse_args()

    if args.debug:
        DEBUG_MODE=True

    analyzer=SkinAnalyzer()
    result=analyzer.analyze_image(args.image)
    print(json.dumps(result,ensure_ascii=False,indent=2))

