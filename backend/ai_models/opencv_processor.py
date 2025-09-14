#!/usr/bin/env python3
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
        """Initialize multiple face detection cascades"""
        try:
            # Load all available cascades
            self.cascades = {}
            
            # Standard frontal face
            self.cascades['frontal'] = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            )
            
            # Alternative frontal face
            self.cascades['frontal_alt'] = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_frontalface_alt.xml"
            )
            
            # Alternative frontal face 2
            self.cascades['frontal_alt2'] = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml"
            )
            
            # Profile face
            self.cascades['profile'] = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_profileface.xml"
            )
            
            # Eyes for fallback
            self.cascades['eyes'] = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_eye.xml"
            )
            
            debug_print("✅ Enhanced Face Detector initialized with multiple cascades")
            
        except Exception as e:
            debug_print(f"❌ Face Detector initialization failed: {e}")
            raise

    def detect_face(self, image: np.ndarray) -> Dict:
        """Enhanced face detection with multiple methods"""
        try:
            if image is None or image.size == 0:
                return {
                    "detected": False,
                    "reason": "Empty or invalid image",
                    "methods_tried": []
                }

            # Prepare image variations for better detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Try multiple preprocessing approaches
            preprocessed_images = {
                'original': gray,
                'equalized': cv2.equalizeHist(gray),
                'clahe': cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(gray),
                'blurred': cv2.GaussianBlur(gray, (3, 3), 0)
            }
            
            methods_tried = []
            all_detections = []
            
            # Method 1: Standard frontal detection with multiple preprocessing
            for prep_name, prep_image in preprocessed_images.items():
                faces = self.cascades['frontal'].detectMultiScale(
                    prep_image, 
                    scaleFactor=1.1, 
                    minNeighbors=3,  # Reduced for better detection
                    minSize=(30, 30), 
                    maxSize=(int(image.shape[1]*0.8), int(image.shape[0]*0.8))
                )
                
                if len(faces) > 0:
                    method_name = f"frontal_standard_{prep_name}"
                    methods_tried.append(method_name)
                    best_face = max(faces, key=lambda f: f[2] * f[3])
                    x, y, w, h = best_face
                    
                    if self._validate_coordinates(x, y, w, h, image.shape):
                        detection = {
                            "detected": True,
                            "coordinates": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                            "detection_method": method_name,
                            "confidence": 0.85,
                            "total_faces": len(faces),
                            "face_analysis": self._analyze_face_region(image[y:y+h, x:x+w])
                        }
                        all_detections.append((detection, 0.85))
            
            # Method 2: Alternative frontal cascades
            for cascade_name in ['frontal_alt', 'frontal_alt2']:
                if cascade_name in self.cascades:
                    for prep_name, prep_image in preprocessed_images.items():
                        faces = self.cascades[cascade_name].detectMultiScale(
                            prep_image, 
                            scaleFactor=1.05, 
                            minNeighbors=3, 
                            minSize=(25, 25),
                            maxSize=(int(image.shape[1]*0.8), int(image.shape[0]*0.8))
                        )
                        
                        if len(faces) > 0:
                            method_name = f"{cascade_name}_{prep_name}"
                            methods_tried.append(method_name)
                            best_face = max(faces, key=lambda f: f[2] * f[3])
                            x, y, w, h = best_face
                            
                            if self._validate_coordinates(x, y, w, h, image.shape):
                                detection = {
                                    "detected": True,
                                    "coordinates": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                                    "detection_method": method_name,
                                    "confidence": 0.80,
                                    "total_faces": len(faces),
                                    "face_analysis": self._analyze_face_region(image[y:y+h, x:x+w])
                                }
                                all_detections.append((detection, 0.80))
            
            # Method 3: Profile face detection
            if 'profile' in self.cascades:
                for prep_name, prep_image in preprocessed_images.items():
                    # Try both orientations
                    for flip in [False, True]:
                        test_image = cv2.flip(prep_image, 1) if flip else prep_image
                        
                        faces = self.cascades['profile'].detectMultiScale(
                            test_image, 
                            scaleFactor=1.1, 
                            minNeighbors=3, 
                            minSize=(30, 30)
                        )
                        
                        if len(faces) > 0:
                            method_name = f"profile_{prep_name}{'_flipped' if flip else ''}"
                            methods_tried.append(method_name)
                            best_face = max(faces, key=lambda f: f[2] * f[3])
                            x, y, w, h = best_face
                            
                            # Adjust coordinates if image was flipped
                            if flip:
                                x = image.shape[1] - x - w
                            
                            if self._validate_coordinates(x, y, w, h, image.shape):
                                detection = {
                                    "detected": True,
                                    "coordinates": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                                    "detection_method": method_name,
                                    "confidence": 0.75,
                                    "total_faces": len(faces),
                                    "face_analysis": self._analyze_face_region(image[y:y+h, x:x+w])
                                }
                                all_detections.append((detection, 0.75))
            
            # Method 4: Eye-based detection (more aggressive)
            eyes = self.cascades['eyes'].detectMultiScale(
                preprocessed_images['clahe'], 
                scaleFactor=1.1, 
                minNeighbors=2,  # More lenient
                minSize=(10, 10)
            )
            
            if len(eyes) >= 2:
                methods_tried.append("eye_based")
                estimated_face = self._estimate_face_from_eyes(eyes, image.shape)
                if estimated_face is not None:
                    x, y, w, h = estimated_face
                    if self._validate_coordinates(x, y, w, h, image.shape):
                        detection = {
                            "detected": True,
                            "coordinates": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                            "detection_method": "eye_based_enhanced",
                            "confidence": 0.70,
                            "total_faces": 1,
                            "face_analysis": self._analyze_face_region(image[y:y+h, x:x+w])
                        }
                        all_detections.append((detection, 0.70))
            
            # Method 5: Skin color-based region detection (fallback)
            skin_regions = self._detect_skin_regions(image)
            if skin_regions:
                methods_tried.append("skin_color_based")
                # Find largest skin region that could be a face
                largest_region = max(skin_regions, key=lambda r: r[2] * r[3])
                x, y, w, h = largest_region
                
                if w > 50 and h > 50 and w/h > 0.7 and w/h < 1.5:  # Face-like proportions
                    detection = {
                        "detected": True,
                        "coordinates": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                        "detection_method": "skin_color_based",
                        "confidence": 0.60,
                        "total_faces": 1,
                        "face_analysis": self._analyze_face_region(image[y:y+h, x:x+w])
                    }
                    all_detections.append((detection, 0.60))
            
            # Return best detection
            if all_detections:
                best_detection = max(all_detections, key=lambda x: x[1])
                debug_print(f"✅ Face detected using: {best_detection[0]['detection_method']}")
                return best_detection[0]
            
            return {
                "detected": False,
                "reason": "No face detected with any method",
                "methods_tried": methods_tried,
                "total_methods": len(methods_tried)
            }
            
        except Exception as e:
            debug_print(f"❌ Face detection error: {e}")
            return {
                "detected": False,
                "reason": f"Face detection failed: {str(e)}"
            }

    def _detect_skin_regions(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect skin-colored regions as fallback face detection"""
        try:
            # Convert to HSV for better skin detection
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            
            # Define skin color range in HSV
            lower_skin = np.array([0, 20, 70], dtype=np.uint8)
            upper_skin = np.array([20, 255, 255], dtype=np.uint8)
            
            # Create mask
            mask = cv2.inRange(hsv, lower_skin, upper_skin)
            
            # Apply morphological operations
            kernel = np.ones((3,3), np.uint8)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            
            # Find contours
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            regions = []
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                area = cv2.contourArea(contour)
                
                # Filter by size and shape
                if area > 1000 and w > 40 and h > 40:
                    regions.append((x, y, w, h))
            
            return regions
            
        except Exception as e:
            debug_print(f"❌ Skin detection error: {e}")
            return []

    def _validate_coordinates(self, x: int, y: int, w: int, h: int, image_shape: Tuple) -> bool:
        """Validate face coordinates"""
        height, width = image_shape[:2]
        return (0 <= x < width and 0 <= y < height and 
                w > 0 and h > 0 and 
                x + w <= width and y + h <= height and
                w >= 20 and h >= 20)  # Minimum size check

    def _estimate_face_from_eyes(self, eyes: np.ndarray, image_shape: Tuple) -> Optional[np.ndarray]:
        """Enhanced face estimation from eyes"""
        if len(eyes) < 2:
            return None
        
        # Find the best eye pair
        best_pair = None
        best_score = 0
        
        for i in range(len(eyes)):
            for j in range(i + 1, len(eyes)):
                eye1, eye2 = eyes[i], eyes[j]
                center1 = (eye1[0] + eye1[2]//2, eye1[1] + eye1[3]//2)
                center2 = (eye2[0] + eye2[2]//2, eye2[1] + eye2[3]//2)
                distance = math.sqrt((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)
                
                # Score based on distance and y-alignment
                y_diff = abs(center1[1] - center2[1])
                if 20 < distance < 300 and y_diff < distance * 0.3:  # More lenient
                    score = distance - y_diff * 2  # Prefer horizontally aligned eyes
                    if score > best_score:
                        best_score = score
                        best_pair = (eye1, eye2)
        
        if best_pair is None:
            return None
        
        eye1, eye2 = best_pair
        left_eye = eye1 if eye1[0] < eye2[0] else eye2
        right_eye = eye2 if eye1[0] < eye2[0] else eye1
        
        # Calculate face region with better proportions
        eye_distance = (right_eye[0] + right_eye[2]//2) - (left_eye[0] + left_eye[2]//2)
        face_width = int(eye_distance * 3.0)  # Wider face estimation
        face_height = int(face_width * 1.3)   # Better face proportions
        
        # Center between eyes
        eyes_center_x = (left_eye[0] + left_eye[2] + right_eye[0] + right_eye[2]) // 4
        eyes_center_y = (left_eye[1] + left_eye[3] + right_eye[1] + right_eye[3]) // 4
        
        # Position face region
        face_x = max(0, eyes_center_x - face_width // 2)
        face_y = max(0, eyes_center_y - int(face_height * 0.35))  # Eyes in upper third
        
        # Adjust to image boundaries
        face_width = min(face_width, image_shape[1] - face_x)
        face_height = min(face_height, image_shape[0] - face_y)
        
        if face_width > 40 and face_height > 40:
            return np.array([face_x, face_y, face_width, face_height])
        
        return None

    def _analyze_face_region(self, face_region: np.ndarray) -> Dict:
        """Enhanced face region analysis"""
        try:
            if face_region is None or face_region.size == 0:
                return {"error": "Empty face region"}
                
            height, width = face_region.shape[:2]
            
            # Color analysis
            mean_color = np.mean(face_region, axis=(0, 1))
            
            # Brightness analysis
            gray_face = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
            brightness = np.mean(gray_face)
            
            # Texture analysis
            laplacian_var = cv2.Laplacian(gray_face, cv2.CV_64F).var()
            
            # Color uniformity
            color_std = np.std(face_region, axis=(0, 1))
            
            return {
                "region_size": {"width": width, "height": height},
                "mean_color": {"b": float(mean_color[0]), "g": float(mean_color[1]), "r": float(mean_color[2])},
                "brightness": float(brightness),
                "texture_variance": float(laplacian_var),
                "color_uniformity": {"b": float(color_std[0]), "g": float(color_std[1]), "r": float(color_std[2])},
                "aspect_ratio": float(width / height) if height > 0 else 1.0
            }
        except Exception as e:
            debug_print(f"❌ Face analysis error: {e}")
            return {"error": str(e)}

# Update the SkinAnalyzer class to use EnhancedFaceDetector
class SkinAnalyzer:
    """Enhanced skin analysis with better face detection"""
    
    def __init__(self):
        self.face_detector = EnhancedFaceDetector()
        debug_print("✅ Enhanced Skin Analyzer initialized")

    def analyze_image(self, image_path: str) -> Dict:
        """Main analysis function with enhanced detection"""
        try:
            image_path = Path(image_path)
            if not image_path.exists():
                return {
                    "success": False,
                    "error": f"Image not found: {image_path}",
                    "face_detection": {"detected": False, "reason": "File not found"}
                }
            
            debug_print(f"📁 Reading image: {image_path}")
            image = cv2.imread(str(image_path))
            if image is None:
                return {
                    "success": False,
                    "error": "Cannot read image - file may be corrupted or unsupported format",
                    "face_detection": {"detected": False, "reason": "Cannot read image file"}
                }
            
            debug_print(f"✅ Image loaded: {image.shape}")
            
            # Enhanced face detection
            face_result = self.face_detector.detect_face(image)
            debug_print(f"🔍 Face detection result: {face_result.get('detected', False)}")
            
            if face_result.get('detected'):
                debug_print(f"📍 Face found using: {face_result.get('detection_method', 'unknown')}")
            
            # Create cropped image if face detected
            cropped_image_path = None
            if face_result.get("detected") and "coordinates" in face_result:
                try:
                    coords = face_result["coordinates"]
                    x, y, w, h = coords["x"], coords["y"], coords["width"], coords["height"]
                    
                    # Validate and crop
                    if self.face_detector._validate_coordinates(x, y, w, h, image.shape):
                        # Add safe padding
                        padding = min(15, x, y, image.shape[1] - (x + w), image.shape[0] - (y + h))
                        x_pad = max(0, x - padding)
                        y_pad = max(0, y - padding)
                        w_pad = min(image.shape[1] - x_pad, w + 2*padding)
                        h_pad = min(image.shape[0] - y_pad, h + 2*padding)
                        
                        cropped_face = image[y_pad:y_pad+h_pad, x_pad:x_pad+w_pad]
                        
                        if cropped_face is not None and cropped_face.size > 0:
                            cropped_filename = f"{image_path.stem}_cropped{image_path.suffix}"
                            cropped_image_path = image_path.parent / cropped_filename
                            
                            success = cv2.imwrite(str(cropped_image_path), cropped_face)
                            if success:
                                debug_print(f"✅ Cropped face saved: {cropped_image_path}")
                            else:
                                cropped_image_path = None
                        
                except Exception as crop_error:
                    debug_print(f"❌ Cropping failed: {crop_error}")
                    cropped_image_path = None
            
            # Enhanced skin analysis
            skin_analysis = self._enhanced_skin_analysis(image, face_result)
            
            return {
                "success": True,
                "face_detection": face_result,
                "croppedImagePath": str(cropped_image_path) if cropped_image_path else None,
                "total_detections": skin_analysis.get("total_issues", 0),
                "detected_classes": len(skin_analysis.get("detected_issues", [])),
                "detectedIssues": skin_analysis.get("detected_issues", []),
                "detectionCounts": skin_analysis.get("issue_counts", {}),
                "detection_details": skin_analysis.get("details", {}),
                "opencv_analysis": skin_analysis,
                "analysis_method": "Enhanced OpenCV Face Detection + Advanced Skin Analysis",
                "overall_health": skin_analysis.get("overall_health"),
                "image_info": {
                    "original_path": str(image_path),
                    "image_size": {"width": image.shape[1], "height": image.shape[0]},
                    "channels": image.shape[2] if len(image.shape) > 2 else 1
                }
            }
            
        except Exception as e:
            debug_print(f"❌ Analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "face_detection": {"detected": False, "reason": f"Analysis error: {str(e)}"}
            }

    def _enhanced_skin_analysis(self, image: np.ndarray, face_result: Dict) -> Dict:
        """Enhanced skin analysis with better issue detection"""
        try:
            detected_issues = []
            issue_counts = {}
            details = {}
            
            # Use face region if detected, otherwise full image
            if face_result.get("detected") and "coordinates" in face_result:
                coords = face_result["coordinates"]
                x, y, w, h = coords["x"], coords["y"], coords["width"], coords["height"]
                
                if self.face_detector._validate_coordinates(x, y, w, h, image.shape):
                    analysis_region = image[y:y+h, x:x+w]
                    region_type = "face_region"
                else:
                    analysis_region = image
                    region_type = "full_image_fallback"
            else:
                analysis_region = image
                region_type = "full_image"
            
            if analysis_region is None or analysis_region.size == 0:
                return {
                    "detected_issues": [],
                    "issue_counts": {},
                    "total_issues": 0,
                    "details": {"error": "Invalid analysis region"},
                    "analysis_region": "error",
                    "overall_health": {"health_category": "unknown", "health_score": 0}
                }
            
            # Enhanced analysis
            gray = cv2.cvtColor(analysis_region, cv2.COLOR_BGR2GRAY)
            hsv = cv2.cvtColor(analysis_region, cv2.COLOR_BGR2HSV)
            
            issues_detected = 0
            
            # 1. Acne/Pimple detection (red spots)
            acne_count = self._detect_acne_spots(analysis_region)
            if acne_count > 0:
                detected_issues.append("acne")
                issue_counts["acne"] = acne_count
                details["acne"] = {"count": acne_count, "severity": "moderate" if acne_count > 3 else "mild"}
                issues_detected += acne_count
            
            # 2. Texture analysis (roughness)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            if laplacian_var > 150:  # Higher threshold for significant texture issues
                detected_issues.append("texture_variation")
                issue_counts["texture_variation"] = 1
                details["texture"] = {"variance": round(laplacian_var, 2), "level": "high"}
                issues_detected += 1
            elif laplacian_var > 80:
                detected_issues.append("mild_texture_variation")
                issue_counts["mild_texture_variation"] = 1
                details["texture"] = {"variance": round(laplacian_var, 2), "level": "moderate"}
                issues_detected += 1
            
            # 3. Brightness analysis
            brightness = np.mean(gray)
            if brightness < 70:
                detected_issues.append("dark_regions")
                issue_counts["dark_regions"] = 1
                details["brightness"] = {"level": round(brightness, 2), "issue": "too_dark"}
                issues_detected += 1
            elif brightness > 220:
                detected_issues.append("overexposed_regions")
                issue_counts["overexposed_regions"] = 1
                details["brightness"] = {"level": round(brightness, 2), "issue": "overexposed"}
                issues_detected += 1
            
            # 4. Color uniformity (redness, discoloration)
            color_std = np.std(analysis_region, axis=(0, 1))
            avg_color_std = np.mean(color_std)
            
            # Check for redness (high red channel relative to others)
            mean_color = np.mean(analysis_region, axis=(0, 1))
            if mean_color[2] > mean_color[1] + 10 and mean_color[2] > mean_color[0] + 10:
                detected_issues.append("redness")
                issue_counts["redness"] = 1
                details["redness"] = {"red_dominance": round(mean_color[2] - np.mean(mean_color[:2]), 2)}
                issues_detected += 1
            
            if avg_color_std > 40:
                detected_issues.append("color_variation")
                issue_counts["color_variation"] = 1
                details["color"] = {"std_deviation": round(avg_color_std, 2)}
                issues_detected += 1
            
            # 5. Overall health assessment
            if issues_detected == 0:
                health_category = "excellent"
                health_score = 95
            elif issues_detected <= 2:
                health_category = "good"
                health_score = 80
            elif issues_detected <= 4:
                health_category = "fair"
                health_score = 65
            else:
                health_category = "needs_attention"
                health_score = max(30, 80 - issues_detected * 10)
            
            return {
                "detected_issues": detected_issues,
                "issue_counts": issue_counts,
                "total_issues": issues_detected,
                "details": details,
                "analysis_region": region_type,
                "overall_health": {
                    "health_category": health_category,
                    "health_score": health_score
                }
            }
            
        except Exception as e:
            debug_print(f"❌ Enhanced skin analysis failed: {e}")
            return {
                "detected_issues": [],
                "issue_counts": {},
                "total_issues": 0,
                "details": {"error": str(e)},
                "analysis_region": "error",
                "overall_health": {"health_category": "unknown", "health_score": 0}
            }

    def _detect_acne_spots(self, image: np.ndarray) -> int:
        """Detect acne/pimple spots using color and shape analysis"""
        try:
            # Convert to HSV for better color detection
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            
            # Define red color ranges for acne/pimples
            # Range 1: Lower red
            lower_red1 = np.array([0, 50, 50])
            upper_red1 = np.array([10, 255, 255])
            mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
            
            # Range 2: Upper red
            lower_red2 = np.array([170, 50, 50])
            upper_red2 = np.array([180, 255, 255])
            mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
            
            # Combine masks
            red_mask = mask1 + mask2
            
            # Apply morphological operations to clean up
            kernel = np.ones((2,2), np.uint8)
            red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_OPEN, kernel)
            red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_CLOSE, kernel)
            
            # Find contours
            contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            acne_count = 0
            for contour in contours:
                area = cv2.contourArea(contour)
                # Filter by size (typical acne spot size)
                if 10 < area < 500:
                    # Check circularity (acne spots are roughly circular)
                    perimeter = cv2.arcLength(contour, True)
                    if perimeter > 0:
                        circularity = 4 * np.pi * area / (perimeter * perimeter)
                        if circularity > 0.3:  # Reasonably circular
                            acne_count += 1
            
            return acne_count
            
        except Exception as e:
            debug_print(f"❌ Acne detection error: {e}")
            return 0

def main():
    """Main function"""
    try:
        if len(sys.argv) < 2:
            print(json.dumps({
                "success": False,
                "error": "Usage: python opencv_processor.py <image_path>"
            }))
            sys.exit(1)

        image_path = sys.argv[1]
        debug_print(f"🚀 Starting enhanced analysis for: {image_path}")
        
        # Initialize enhanced analyzer
        analyzer = SkinAnalyzer()
        
        # Analyze image
        result = analyzer.analyze_image(image_path)
        
        # Output JSON result
        print(json.dumps(result, ensure_ascii=False, indent=2))

    except Exception as e:
        debug_print(f"❌ Main function error: {e}")
        error_result = {
            "success": False,
            "error": str(e),
            "face_detection": {"detected": False, "reason": f"Script error: {str(e)}"}
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
