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

class AdvancedFaceDetector:
    """Advanced face detection optimized for skin analysis"""
    
    def __init__(self):
        """Initialize face detection cascades"""
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        self.face_alt_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_alt.xml"
        )
        self.profile_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_profileface.xml"
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_eye.xml"
        )
        
        debug_print("✅ Face Detector initialized")

    def detect_face_comprehensive(self, image: np.ndarray) -> Dict:
        """Comprehensive face detection with multiple methods"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            enhanced_gray = cv2.equalizeHist(gray)
            
            # Method 1: Standard frontal detection
            faces = self.face_cascade.detectMultiScale(
                enhanced_gray, scaleFactor=1.1, minNeighbors=5, 
                minSize=(30, 30), maxSize=(300, 300)
            )
            
            if len(faces) > 0:
                best_face = self._select_best_face(faces, image.shape)
                return self._create_success_result(best_face, "frontal_standard", len(faces))
            
            # Method 2: Alternative frontal detection
            faces_alt = self.face_alt_cascade.detectMultiScale(
                enhanced_gray, scaleFactor=1.05, minNeighbors=4, minSize=(25, 25)
            )
            
            if len(faces_alt) > 0:
                best_face = self._select_best_face(faces_alt, image.shape)
                return self._create_success_result(best_face, "frontal_alt", len(faces_alt))
            
            # Method 3: Profile detection
            profiles = self.profile_cascade.detectMultiScale(
                enhanced_gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30)
            )
            
            if len(profiles) > 0:
                best_face = self._select_best_face(profiles, image.shape)
                return self._create_success_result(best_face, "profile", len(profiles))
            
            # Method 4: Eye-based face estimation
            eyes = self.eye_cascade.detectMultiScale(
                enhanced_gray, scaleFactor=1.1, minNeighbors=3, minSize=(10, 10)
            )
            
            if len(eyes) >= 2:
                estimated_face = self._estimate_face_from_eyes(eyes, image.shape)
                if estimated_face is not None:
                    return self._create_success_result(estimated_face, "eye_based", 1)
            
            # Method 5: Skin-based detection
            skin_face = self._detect_face_by_skin(image)
            if skin_face is not None:
                return self._create_success_result(skin_face, "skin_based", 1)
            
            return {"success": False, "error": "No face detected"}
            
        except Exception as e:
            return {"success": False, "error": f"Face detection failed: {str(e)}"}

    def _select_best_face(self, faces: np.ndarray, image_shape: Tuple) -> np.ndarray:
        """Select best face based on size and position"""
        if len(faces) == 1:
            return faces[0]
        
        scores = []
        for face in faces:
            x, y, w, h = face
            
            # Size score
            size_score = (w * h) / (image_shape[0] * image_shape[1])
            
            # Center position score
            center_x = x + w // 2
            center_y = y + h // 2
            img_center_x = image_shape[1] // 2
            img_center_y = image_shape[0] // 2
            
            distance = math.sqrt((center_x - img_center_x)**2 + (center_y - img_center_y)**2)
            max_distance = math.sqrt(img_center_x**2 + img_center_y**2)
            position_score = 1 - (distance / max_distance)
            
            # Aspect ratio score
            aspect_ratio = w / h
            aspect_score = 1 - abs(aspect_ratio - 0.8)
            
            total_score = size_score * 0.5 + position_score * 0.3 + aspect_score * 0.2
            scores.append(total_score)
        
        return faces[np.argmax(scores)]

    def _estimate_face_from_eyes(self, eyes: np.ndarray, image_shape: Tuple) -> Optional[np.ndarray]:
        """Estimate face region from detected eyes"""
        if len(eyes) < 2:
            return None
        
        # Find best eye pair
        eye_pairs = []
        for i in range(len(eyes)):
            for j in range(i + 1, len(eyes)):
                eye1, eye2 = eyes[i], eyes[j]
                center1 = (eye1[0] + eye1[2]//2, eye1[1] + eye1[3]//2)
                center2 = (eye2[0] + eye2[2]//2, eye2[1] + eye2[3]//2)
                distance = math.sqrt((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)
                
                if 20 < distance < 150:  # Reasonable eye distance
                    eye_pairs.append((eye1, eye2, distance))
        
        if not eye_pairs:
            return None
        
        # Select best pair
        eye_pairs.sort(key=lambda x: abs(x[2] - 60))
        eye1, eye2, _ = eye_pairs[0]
        
        # Calculate face region
        left_eye = eye1 if eye1[0] < eye2[0] else eye2
        right_eye = eye2 if eye1[0] < eye2[0] else eye1
        
        eye_distance = right_eye[0] - (left_eye[0] + left_eye[2])
        face_width = int(eye_distance * 2.5)
        face_height = int(face_width * 1.2)
        
        eyes_center_x = (left_eye[0] + left_eye[2] + right_eye[0]) // 2
        eyes_center_y = (left_eye[1] + left_eye[3] + right_eye[1] + right_eye[3]) // 4
        
        face_x = max(0, eyes_center_x - face_width // 2)
        face_y = max(0, eyes_center_y - int(face_height * 0.4))
        
        face_width = min(face_width, image_shape[1] - face_x)
        face_height = min(face_height, image_shape[0] - face_y)
        
        return np.array([face_x, face_y, face_width, face_height])

    def _detect_face_by_skin(self, image: np.ndarray) -> Optional[np.ndarray]:
        """Detect face region using skin color"""
        try:
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            
            # Skin color range
            skin_lower = np.array([0, 20, 70])
            skin_upper = np.array([20, 255, 255])
            skin_mask = cv2.inRange(hsv, skin_lower, skin_upper)
            
            # Clean mask
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel)
            skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel)
            
            # Find largest skin region
            contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                largest_contour = max(contours, key=cv2.contourArea)
                x, y, w, h = cv2.boundingRect(largest_contour)
                
                # Check if it looks like a face
                aspect_ratio = w / h
                if 0.6 <= aspect_ratio <= 1.4 and w > 50 and h > 50:
                    return np.array([x, y, w, h])
            
            return None
            
        except Exception:
            return None

    def _create_success_result(self, face_coords: np.ndarray, method: str, total_faces: int) -> Dict:
        """Create success result with face analysis"""
        x, y, w, h = face_coords
        
        return {
            "success": True,
            "coordinates": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
            "detection_method": method,
            "confidence": 0.85,
            "total_faces": total_faces
        }

class SkinAnalyzer:
    """Comprehensive skin analysis system"""
    
    def __init__(self):
        """Initialize skin analyzer"""
        self.face_detector = AdvancedFaceDetector()
        
        # Skin color ranges for different tones
        self.skin_ranges = {
            "light": {"lower": np.array([0, 20, 70]), "upper": np.array([20, 255, 255])},
            "medium": {"lower": np.array([0, 15, 60]), "upper": np.array([25, 255, 255])},
            "dark": {"lower": np.array([0, 10, 50]), "upper": np.array([30, 255, 255])}
        }
        
        debug_print("✅ Skin Analyzer initialized")

    def analyze_image(self, image_path: str) -> Dict:
        """Main analysis function"""
        try:
            if not Path(image_path).exists():
                return {"success": False, "error": f"Image not found: {image_path}"}
            
            image = cv2.imread(str(image_path))
            if image is None:
                return {"success": False, "error": "Cannot read image"}
            
            debug_print(f"Analyzing: {image_path}")
            
            # Face detection
            face_result = self.face_detector.detect_face_comprehensive(image)
            
            # Determine analysis region
            if face_result["success"]:
                coords = face_result["coordinates"]
                x, y, w, h = coords["x"], coords["y"], coords["width"], coords["height"]
                
                # Add padding
                padding = 20
                x_pad = max(0, x - padding)
                y_pad = max(0, y - padding)
                w_pad = min(image.shape[1] - x_pad, w + 2*padding)
                h_pad = min(image.shape[0] - y_pad, h + 2*padding)
                
                analysis_region = image[y_pad:y_pad+h_pad, x_pad:x_pad+w_pad]
                region_info = {
                    "type": "face_detected",
                    "original": coords,
                    "padded": {"x": x_pad, "y": y_pad, "width": w_pad, "height": h_pad}
                }
            else:
                analysis_region = image
                region_info = {"type": "full_image", "reason": face_result.get("error")}
            
            # Comprehensive skin analysis
            skin_analysis = self._analyze_skin_comprehensive(analysis_region)
            
            return {
                "success": True,
                "face_detection": face_result,
                "analysis_region": region_info,
                "skin_analysis": skin_analysis,
                "total_detections": self._count_total_issues(skin_analysis),
                "overall_assessment": self._calculate_overall_score(skin_analysis)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _analyze_skin_comprehensive(self, image: np.ndarray) -> Dict:
        """Comprehensive skin analysis"""
        # Create enhanced skin mask
        skin_mask = self._create_advanced_skin_mask(image)
        
        return {
            "acne": self._detect_acne_advanced(image, skin_mask),
            "pores": self._analyze_pores(image, skin_mask),
            "redness": self._analyze_redness(image, skin_mask),
            "texture": self._analyze_texture(image, skin_mask),
            "oiliness": self._analyze_oiliness(image, skin_mask),
            "pigmentation": self._analyze_pigmentation(image, skin_mask),
            "dark_spots": self._detect_dark_spots(image, skin_mask),
            "wrinkles": self._detect_wrinkles(image, skin_mask),
            "skin_coverage": round((np.sum(skin_mask > 0) / skin_mask.size) * 100, 2)
        }

    def _create_advanced_skin_mask(self, image: np.ndarray) -> np.ndarray:
        """Create advanced skin mask using multiple color spaces"""
        # HSV method
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        hsv_masks = []
        for ranges in self.skin_ranges.values():
            mask = cv2.inRange(hsv, ranges["lower"], ranges["upper"])
            hsv_masks.append(mask)
        hsv_combined = np.zeros_like(hsv_masks[0])
        for mask in hsv_masks:
            hsv_combined = cv2.bitwise_or(hsv_combined, mask)
        
        # YCrCb method
        ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
        ycrcb_mask = cv2.inRange(ycrcb, np.array([0, 133, 77]), np.array([255, 173, 127]))
        
        # RGB rules method
        b, g, r = cv2.split(image)
        rgb_mask = ((r > 95) & (g > 40) & (b > 20) & 
                   ((np.maximum(r, np.maximum(g, b)) - np.minimum(r, np.minimum(g, b))) > 15) &
                   (np.abs(r.astype(int) - g.astype(int)) > 15) & (r > g) & (r > b)).astype(np.uint8) * 255
        
        # Combine methods
        combined = cv2.bitwise_or(hsv_combined, ycrcb_mask)
        combined = cv2.bitwise_or(combined, rgb_mask)
        
        # Morphological operations
        kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        kernel_medium = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        
        combined = cv2.morphologyEx(combined, cv2.MORPH_OPEN, kernel_small)
        combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel_medium)
        
        return combined

    def _detect_acne_advanced(self, image: np.ndarray, skin_mask: np.ndarray) -> Dict:
        """Advanced acne detection"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        all_spots = []
        
        # Method 1: HoughCircles for round spots
        circles = cv2.HoughCircles(
            gray, cv2.HOUGH_GRADIENT, 1, 15,
            param1=50, param2=25, minRadius=1, maxRadius=12
        )
        
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            for (x, y, r) in circles:
                if (y < skin_mask.shape[0] and x < skin_mask.shape[1] and skin_mask[y, x] > 0):
                    all_spots.append({
                        "x": int(x), "y": int(y), "radius": int(r), 
                        "type": "circular", "area": int(math.pi * r * r)
                    })
        
        # Method 2: Dark spot detection
        _, dark_thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        dark_spots_mask = cv2.bitwise_not(dark_thresh)
        dark_spots_mask = cv2.bitwise_and(dark_spots_mask, skin_mask)
        
        contours, _ = cv2.findContours(dark_spots_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if 5 < area < 200:
                x, y, w, h = cv2.boundingRect(contour)
                if 0.5 <= w/h <= 2.0:  # Aspect ratio filter
                    all_spots.append({
                        "x": int(x + w//2), "y": int(y + h//2),
                        "width": int(w), "height": int(h), 
                        "area": int(area), "type": "dark_spot"
                    })
        
        # Method 3: Red/inflamed spot detection
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        red_mask1 = cv2.inRange(hsv, np.array([0, 50, 50]), np.array([10, 255, 255]))
        red_mask2 = cv2.inRange(hsv, np.array([170, 50, 50]), np.array([180, 255, 255]))
        red_mask = cv2.bitwise_or(red_mask1, red_mask2)
        red_mask = cv2.bitwise_and(red_mask, skin_mask)
        
        red_contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in red_contours:
            area = cv2.contourArea(contour)
            if 3 < area < 150:
                x, y, w, h = cv2.boundingRect(contour)
                all_spots.append({
                    "x": int(x + w//2), "y": int(y + h//2),
                    "width": int(w), "height": int(h),
                    "area": int(area), "type": "inflamed"
                })
        
        # Remove duplicates
        filtered_spots = self._remove_duplicate_spots(all_spots)
        
        # Classify severity
        total = len(filtered_spots)
        inflamed = len([s for s in filtered_spots if s.get("type") == "inflamed"])
        
        if total < 3:
            severity = "clear"
        elif total < 8:
            severity = "mild"
        elif total < 20:
            severity = "moderate"
        else:
            severity = "severe"
        
        if inflamed > total * 0.3:
            severity_levels = ["clear", "mild", "moderate", "severe", "very_severe"]
            idx = severity_levels.index(severity)
            if idx < len(severity_levels) - 1:
                severity = severity_levels[idx + 1]
        
        return {
            "count": total,
            "inflamed_count": inflamed,
            "severity": severity,
            "spots": filtered_spots,
            "confidence": min(95, 60 + total * 2 + inflamed * 3)
        }

    def _remove_duplicate_spots(self, spots: List[Dict]) -> List[Dict]:
        """Remove duplicate spot detections"""
        if not spots:
            return spots
        
        filtered = []
        for spot in spots:
            is_duplicate = False
            for existing in filtered:
                distance = math.sqrt((spot["x"] - existing["x"])**2 + (spot["y"] - existing["y"])**2)
                if distance < 10:
                    is_duplicate = True
                    if spot.get("area", 0) > existing.get("area", 0):
                        filtered[filtered.index(existing)] = spot
                    break
            
            if not is_duplicate:
                filtered.append(spot)
        
        return filtered

    def _analyze_pores(self, image: np.ndarray, skin_mask: np.ndarray) -> Dict:
        """Analyze pore visibility"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Top-hat operation for pore detection
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel)
        
        # Threshold and find contours
        _, thresh = cv2.threshold(tophat, 15, 255, cv2.THRESH_BINARY)
        thresh = cv2.bitwise_and(thresh, skin_mask)
        
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter pore-like contours
        pore_count = 0
        total_area = 0
        for contour in contours:
            area = cv2.contourArea(contour)
            if 2 < area < 80:
                perimeter = cv2.arcLength(contour, True)
                if perimeter > 0:
                    circularity = 4 * math.pi * area / (perimeter * perimeter)
                    if circularity > 0.3:
                        pore_count += 1
                        total_area += area
        
        # Calculate density
        skin_area = np.sum(skin_mask > 0)
        density = pore_count / (skin_area / 1000) if skin_area > 0 else 0
        avg_size = total_area / pore_count if pore_count > 0 else 0
        
        # Classify visibility
        if density < 0.5:
            visibility = "minimal"
        elif density < 1.5:
            visibility = "low"
        elif density < 3.0:
            visibility = "moderate"
        else:
            visibility = "high"
        
        return {
            "count": pore_count,
            "density": round(density, 2),
            "average_size": round(avg_size, 2),
            "visibility": visibility,
            "confidence": min(90, 40 + pore_count * 2)
        }

    def _analyze_redness(self, image: np.ndarray, skin_mask: np.ndarray) -> Dict:
        """Analyze skin redness"""
        # RGB analysis
        b, g, r = cv2.split(image)
        red_dominant = ((r > g + 10) & (r > b + 10)) & (skin_mask > 0)
        
        # HSV analysis
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        h = hsv[:, :, 2]
        red_hue = ((h <= 10) | (h >= 170)) & (skin_mask > 0)
        
        # Combine methods
        combined_red = red_dominant | red_hue
        
        total_skin = np.sum(skin_mask > 0)
        red_pixels = np.sum(combined_red)
        percentage = (red_pixels / total_skin) * 100 if total_skin > 0 else 0
        
        # Classify level
        if percentage < 3:
            level = "minimal"
        elif percentage < 8:
            level = "low"
        elif percentage < 15:
            level = "moderate"
        else:
            level = "high"
        
        return {
            "percentage": round(percentage, 2),
            "level": level,
            "affected_pixels": int(red_pixels),
            "confidence": min(85, 50 + percentage * 1.5)
        }

    def _analyze_texture(self, image: np.ndarray, skin_mask: np.ndarray) -> Dict:
        """Analyze skin texture"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Laplacian variance for sharpness
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = np.var(laplacian[skin_mask > 0]) if np.sum(skin_mask > 0) > 0 else 0
        
        # Local variance
        kernel = np.ones((9, 9), np.float32) / 81
        mean_filtered = cv2.filter2D(gray.astype(np.float32), -1, kernel)
        sqr_mean = cv2.filter2D((gray.astype(np.float32))**2, -1, kernel)
        local_var = sqr_mean - mean_filtered**2
        avg_local_var = np.mean(local_var[skin_mask > 0]) if np.sum(skin_mask > 0) > 0 else 0
        
        texture_score = variance * 0.6 + avg_local_var * 0.4
        
        # Classify smoothness
        if texture_score < 100:
            smoothness = "very_smooth"
        elif texture_score < 300:
            smoothness = "smooth"
        elif texture_score < 600:
            smoothness = "moderate"
        else:
            smoothness = "rough"
        
        return {
            "texture_score": round(texture_score, 2),
            "smoothness": smoothness,
            "laplacian_variance": round(variance, 2),
            "confidence": 80
        }

    def _analyze_oiliness(self, image: np.ndarray, skin_mask: np.ndarray) -> Dict:
        """Analyze skin oiliness"""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        v = hsv[:, :, 2]
        s = hsv[:, :, 1]
        
        # High brightness + low saturation indicates oily areas
        oily_mask = (v > 180) & (s < 80) & (skin_mask > 0)
        
        total_skin = np.sum(skin_mask > 0)
        oily_pixels = np.sum(oily_mask)
        percentage = (oily_pixels / total_skin) * 100 if total_skin > 0 else 0
        
        # Classify oil level
        if percentage < 5:
            level = "dry"
        elif percentage < 15:
            level = "normal"
        elif percentage < 30:
            level = "combination"
        else:
            level = "oily"
        
        return {
            "percentage": round(percentage, 2),
            "level": level,
            "confidence": min(90, 50 + percentage * 1.2)
        }

    def _analyze_pigmentation(self, image: np.ndarray, skin_mask: np.ndarray) -> Dict:
        """Analyze pigmentation uniformity"""
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel = lab[:, :, 0]
        
        if np.sum(skin_mask > 0) > 0:
            skin_lightness = l_channel[skin_mask > 0]
            std_dev = np.std(skin_lightness)
            mean_val = np.mean(skin_lightness)
        else:
            std_dev = 0
            mean_val = 0
        
        # Classify uniformity
        if std_dev < 15:
            uniformity = "very_uniform"
        elif std_dev < 25:
            uniformity = "uniform"
        elif std_dev < 40:
            uniformity = "moderate"
        else:
            uniformity = "irregular"
        
        return {
            "std_deviation": round(std_dev, 2),
            "mean_lightness": round(mean_val, 2),
            "uniformity": uniformity,
            "confidence": min(85, 60 + std_dev)
        }

    def _detect_dark_spots(self, image: np.ndarray, skin_mask: np.ndarray) -> Dict:
        """Detect dark spots"""
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel = lab[:, :, 0]
        
        if np.sum(skin_mask > 0) > 0:
            mean_lightness = np.mean(l_channel[skin_mask > 0])
            std_lightness = np.std(l_channel[skin_mask > 0])
            threshold = mean_lightness - std_lightness * 1.5
        else:
            threshold = 100
        
        dark_mask = (l_channel < threshold) & (skin_mask > 0)
        
        # Clean mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        dark_mask = cv2.morphologyEx(dark_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
        
        contours, _ = cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        valid_spots = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if 5 < area < 500:
                perimeter = cv2.arcLength(contour, True)
                if perimeter > 0:
                    circularity = 4 * math.pi * area / (perimeter * perimeter)
                    if circularity > 0.3:
                        x, y, w, h = cv2.boundingRect(contour)
                        valid_spots.append({
                            "x": int(x + w//2),
                            "y": int(y + h//2),
                            "area": int(area)
                        })
        
        # Calculate coverage
        total_area = sum([spot["area"] for spot in valid_spots])
        total_skin = np.sum(skin_mask > 0)
        coverage = (total_area / total_skin) * 100 if total_skin > 0 else 0
        
        # Classify severity
        count = len(valid_spots)
        if count < 3 and coverage < 2:
            severity = "minimal"
        elif count < 8 and coverage < 5:
            severity = "mild"
        elif count < 15 and coverage < 10:
            severity = "moderate"
        else:
            severity = "severe"
        
        return {
            "count": count,
            "coverage_percentage": round(coverage, 2),
            "severity": severity,
            "spots": valid_spots,
            "confidence": min(85, 50 + count * 3)
        }

    def _detect_wrinkles(self, image: np.ndarray, skin_mask: np.ndarray) -> Dict:
        """Detect wrinkles and fine lines"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Edge detection for lines
        edges = cv2.Canny(gray, 50, 150)
        edges = cv2.bitwise_and(edges, skin_mask)
        
        # Hough line detection
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=20, 
                               minLineLength=10, maxLineGap=5)
        
        line_count = len(lines) if lines is not None else 0
        
        # Ridge detection using second derivatives
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        sobelx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
        sobelxx = cv2.Sobel(sobelx, cv2.CV_64F, 1, 0, ksize=3)
        sobelyy = cv2.Sobel(sobely, cv2.CV_64F, 0, 1, ksize=3)
        sobelxy = cv2.Sobel(sobelx, cv2.CV_64F, 0, 1, ksize=3)
        
        # Hessian determinant for ridge detection
        det_hessian = sobelxx * sobelyy - sobelxy * sobelxy
        ridge_mask = (det_hessian < -100) & (skin_mask > 0)
        ridge_pixels = np.sum(ridge_mask)
        
        total_skin = np.sum(skin_mask > 0)
        ridge_percentage = (ridge_pixels / total_skin) * 100 if total_skin > 0 else 0
        
        # Calculate wrinkle score
        wrinkle_score = line_count * 2 + ridge_percentage
        
        # Classify severity
        if wrinkle_score < 5:
            severity = "none"
        elif wrinkle_score < 15:
            severity = "minimal"
        elif wrinkle_score < 30:
            severity = "mild"
        elif wrinkle_score < 50:
            severity = "moderate"
        else:
            severity = "severe"
        
        return {
            "line_count": line_count,
            "ridge_percentage": round(ridge_percentage, 2),
            "wrinkle_score": round(wrinkle_score, 2),
            "severity": severity,
            "confidence": min(80, 40 + wrinkle_score)
        }

    def _count_total_issues(self, skin_analysis: Dict) -> int:
        """Count total detected issues"""
        total = 0
        
        # Count acne
        if skin_analysis.get("acne", {}).get("count", 0) > 0:
            total += skin_analysis["acne"]["count"]
        
        # Count pores (if visible)
        if skin_analysis.get("pores", {}).get("visibility") not in ["minimal", "low"]:
            total += 1
        
        # Count redness (if significant)
        if skin_analysis.get("redness", {}).get("level") not in ["minimal", "low"]:
            total += 1
        
        # Count texture issues
        if skin_analysis.get("texture", {}).get("smoothness") in ["rough", "very_rough"]:
            total += 1
        
        # Count oiliness issues
        if skin_analysis.get("oiliness", {}).get("level") in ["oily", "very_oily"]:
            total += 1
        
        # Count pigmentation issues
        if skin_analysis.get("pigmentation", {}).get("uniformity") in ["irregular", "very_irregular"]:
            total += 1
        
        # Count dark spots
        if skin_analysis.get("dark_spots", {}).get("count", 0) > 0:
            total += skin_analysis["dark_spots"]["count"]
        
        # Count wrinkles
        if skin_analysis.get("wrinkles", {}).get("severity") not in ["none", "minimal"]:
            total += 1
        
        return total

    def _calculate_overall_score(self, skin_analysis: Dict) -> Dict:
        """Calculate overall skin health score"""
        scores = []
        
        # Acne score (0-100)
        acne_severity = skin_analysis.get("acne", {}).get("severity", "clear")
        acne_scores = {"clear": 100, "mild": 80, "moderate": 60, "severe": 40, "very_severe": 20}
        scores.append(acne_scores.get(acne_severity, 70))
        
        # Pore score
        pore_visibility = skin_analysis.get("pores", {}).get("visibility", "low")
        pore_scores = {"minimal": 100, "low": 85, "moderate": 70, "high": 50, "very_high": 30}
        scores.append(pore_scores.get(pore_visibility, 70))
        
        # Redness score
        redness_level = skin_analysis.get("redness", {}).get("level", "minimal")
        redness_scores = {"minimal": 100, "low": 80, "moderate": 60, "high": 40, "severe": 20}
        scores.append(redness_scores.get(redness_level, 70))
        
        # Texture score
        smoothness = skin_analysis.get("texture", {}).get("smoothness", "moderate")
        texture_scores = {"very_smooth": 100, "smooth": 85, "moderate": 70, "rough": 50, "very_rough": 30}
        scores.append(texture_scores.get(smoothness, 70))
        
        # Oiliness score
        oil_level = skin_analysis.get("oiliness", {}).get("level", "normal")
        oil_scores = {"normal": 100, "dry": 85, "combination": 80, "oily": 60, "very_oily": 40}
        scores.append(oil_scores.get(oil_level, 70))
        
        # Pigmentation score
        uniformity = skin_analysis.get("pigmentation", {}).get("uniformity", "uniform")
        pigment_scores = {"very_uniform": 100, "uniform": 85, "moderate": 70, "irregular": 50, "very_irregular": 30}
        scores.append(pigment_scores.get(uniformity, 70))
        
        # Dark spots score
        spots_severity = skin_analysis.get("dark_spots", {}).get("severity", "minimal")
        spots_scores = {"minimal": 100, "mild": 80, "moderate": 60, "severe": 40}
        scores.append(spots_scores.get(spots_severity, 70))
        
        # Wrinkles score
        wrinkle_severity = skin_analysis.get("wrinkles", {}).get("severity", "none")
        wrinkle_scores = {"none": 100, "minimal": 90, "mild": 75, "moderate": 55, "severe": 35}
        scores.append(wrinkle_scores.get(wrinkle_severity, 70))
        
        # Calculate weighted average
        weights = [0.2, 0.15, 0.15, 0.15, 0.1, 0.1, 0.1, 0.05]  # Acne has highest weight
        overall_score = np.average(scores, weights=weights)
        
        # Classify health category
        if overall_score >= 90:
            category = "excellent"
        elif overall_score >= 80:
            category = "good"
        elif overall_score >= 70:
            category = "fair"
        elif overall_score >= 60:
            category = "poor"
        else:
            category = "very_poor"
        
        return {
            "overall_score": round(overall_score, 1),
            "health_category": category,
            "component_scores": {
                "acne": scores[0],
                "pores": scores[1],
                "redness": scores[2],
                "texture": scores[3],
                "oiliness": scores[4],
                "pigmentation": scores[5],
                "dark_spots": scores[6],
                "wrinkles": scores[7]
            }
        }

def main():
    """Main function for skin analysis"""
    try:
        if len(sys.argv) < 2:
            raise ValueError("Usage: python skin_analyzer.py <image_path>")

        image_path = sys.argv[1]
        
        # Initialize analyzer
        analyzer = SkinAnalyzer()
        
        # Analyze image
        result = analyzer.analyze_image(image_path)
        
        # Output JSON result
        print(json.dumps(result, ensure_ascii=False, indent=2))

    except Exception as e:
        error_result = {"success": False, "error": str(e)}
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
