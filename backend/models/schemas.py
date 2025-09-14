from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, str]
    version: str
    advanced_features: Dict[str, bool]

class FaceDetectionInfo(BaseModel):
    detected: bool
    coordinates: Optional[Dict[str, int]] = None
    confidence: Optional[float] = None
    detection_method: Optional[str] = None
    face_analysis: Optional[Dict[str, Any]] = None
    total_faces: Optional[int] = None
    message: Optional[str] = None

class SkinAnalysisResult(BaseModel):
    success: bool
    total_detections: int
    detected_classes: int
    detectedIssues: List[str]
    detectionCounts: Dict[str, int]
    detection_details: Dict[str, Any]
    opencv_analysis: Dict[str, Any]
    face_detection: FaceDetectionInfo
    analysis_method: str
    overall_health: Optional[Dict[str, Any]] = None

class AnalysisResponse(BaseModel):
    success: bool
    analysisId: Optional[str] = None
    timestamp: str
    originalImage: Optional[str] = None
    croppedImage: Optional[str] = None
    faceDetection: Optional[FaceDetectionInfo] = None
    skinAnalysis: Optional[SkinAnalysisResult] = None
    recommendations: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    geminiSuccess: bool = False
    processing_time: Optional[float] = None

class TopicRequest(BaseModel):
    skinAnalysis: Dict[str, Any]
    topic: str
    prompt: str
    language: str = "th"

class BulkTopicsRequest(BaseModel):
    skinAnalysis: Dict[str, Any]
    topics: List[Dict[str, str]]
    language: str = "th"

class GeminiRequest(BaseModel):
    skinAnalysis: Dict[str, Any]
    prompt: str = ""
    language: str = "th"

class AdvancedAnalysisRequest(BaseModel):
    enable_advanced_detection: bool = True
    enable_face_analysis: bool = True
    enable_skin_regions: bool = True
    debug_mode: bool = False
    language: str = "th"

class FaceAnalysisRequest(BaseModel):
    analysis_id: str
    focus_areas: List[str] = ["acne", "pores", "redness", "texture"]
    language: str = "th"

class HistoryEntry(BaseModel):
    analysisId: str
    timestamp: str
    originalImage: Optional[str] = None
    croppedImage: Optional[str] = None
    faceDetected: bool
    detectionMethod: Optional[str] = None
    detectionConfidence: Optional[float] = None
    totalDetections: int
    detectedIssues: List[str]
    analysisMethod: str
    overallHealth: Optional[str] = None
    geminiSuccess: bool
    processingTime: Optional[float] = None
    hasAdvancedFeatures: bool
    version: str

class HistoryResponse(BaseModel):
    success: bool
    count: int
    history: List[HistoryEntry]
    metadata: Dict[str, Any]
