'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef(null);
  const router = useRouter();

  // 🔧 ตั้งค่า API Base URL
  //   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const API_BASE_URL = '';

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (15MB limit)
    if (file.size > 15 * 1024 * 1024) {
      setError('File size must be less than 15MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      // ✅ แก้ไข: ใช้ 'file' ตรงตาม Backend API
      formData.append('file', selectedFile);
      
      // ✅ เพิ่ม optional parameters
      formData.append('enable_advanced', 'true');
      formData.append('enable_gemini', 'true');

      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 85));
      }, 300);

      console.log('📤 Uploading to:', `${API_BASE_URL}/api/upload`);
      console.log('📦 File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
      
      // ✅ API Call with proper error handling
      const response = await fetch(`/api/upload`, {
        method: 'POST',
        body: formData,
        // ✅ ไม่ต้องกำหนด Content-Type ให้ browser จัดการ multipart/form-data
        headers: {
          'Accept': 'application/json',
        },
      });

      clearInterval(progressInterval);
      setProgress(95);

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${errorText}` };
        }
        
        // ✅ จัดการ error message ที่ดีขึ้น
        let errorMessage = 'Upload failed';
        if (errorData.detail && Array.isArray(errorData.detail)) {
          // FastAPI validation error
          const validationErrors = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`);
          errorMessage = `Validation Error: ${validationErrors.join(', ')}`;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Upload successful:', result);
      setProgress(100);

      // รอให้ progress bar เต็ม
      await new Promise(resolve => setTimeout(resolve, 500));

      if (result.success) {
        
        const ar = result.analysisResults || {};
        const analysisData = {
          ...result,
          analysisId: result.analysisId || ar.analysisId || `analysis_${Date.now()}`,

          // 🔑 ดึง key ที่หน้า analysis ต้องใช้ขึ้นมาไว้ชั้นบน
          originalImage: result.originalImage ?? ar.originalImage ?? null,
          croppedImage:  result.croppedImage  ?? ar.croppedImage  ?? null,
          timestamp:     result.timestamp     ?? ar.uploadTime    ?? new Date().toISOString(),

          // ถ้า BE ให้ faceDetection มาแล้ว ใช้อันนั้น; ถ้าไม่ ให้สรุปจาก ar.faceDetected
          faceDetection: result.faceDetection ?? (
            ar.faceDetected
              ? { detected: true, confidence: (ar.confidence ?? 0) / 100 }
              : { detected: false }
          ),

          // โครงพื้นฐานของผลวิเคราะห์ ถ้า BE ยังไม่ได้ส่งแบบจัดรูปมา
          skinAnalysis: result.skinAnalysis ?? {
            overall_health: { health_score: 0, health_category: 'unknown' },
            total_detections: 0,
            detectedIssues: [],
            detectionCounts: {},
          },

          // คำแนะนำ (ถ้ามีใน analysisResults ก็ยกมาด้วย)
          recommendations: result.recommendations ?? ar.recommendations ?? [],
          
          fileInfo: {
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type,
            uploadTime: new Date().toISOString()
          }
        };
        
        try {
          sessionStorage.setItem('skinai_analysis_result', JSON.stringify(analysisData));
          console.log('✅ Analysis data saved with ID:', analysisData.analysisId);
          
          // เก็บ preview URL
          if (previewUrl) sessionStorage.setItem('skinai_preview_url', previewUrl);
          
          
          
        } catch (storageError) {
          console.warn('⚠️ Storage error:', storageError);
        }
        
        // ✅ Redirect to analysis page
        router.push(`/analysis?analysisId=${encodeURIComponent(analysisData.analysisId)}`);
        
      } else {
        throw new Error(result.error || 'Analysis failed');
      }

    } catch (error) {
      console.error('💥 Upload error:', error);
      setError(error.message || 'Upload failed. Please try again.');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔬 AI Skin Analysis
          </h1>
          <p className="text-gray-600">
            Upload a clear photo of your face for AI-powered skin analysis
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* File Upload Area */}
            <div
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                ${dragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : selectedFile 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {previewUrl ? (
                // Preview Image
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div className="mt-4 text-sm text-gray-600">
                    <p className="font-medium">{selectedFile?.name}</p>
                    <p>{(selectedFile?.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                // Upload Prompt
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <ImageIcon className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Choose or drag your photo here
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Supports JPG, PNG, WebP, GIF, BMP • Max 15MB
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Browse Files
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    {progress < 30 ? 'Uploading image...' :
                     progress < 60 ? 'Detecting face...' :
                     progress < 90 ? 'Analyzing skin...' :
                     'Generating recommendations...'}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className={`
                w-full py-4 px-6 rounded-xl font-medium text-white transition-all duration-300
                ${!selectedFile || uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {uploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing with AI...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>🚀 Start AI Analysis</span>
                </div>
              )}
            </button>
          </form>

          {/* Tips */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">📸</span>
              Photo Tips for Best Results:
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Use natural daylight or bright, even lighting</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Face the camera directly with your face centered</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Keep a neutral expression with eyes open</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Ensure the image is clear and not blurry</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Remove makeup for more accurate analysis</span>
              </li>
            </ul>
          </div>

          {/* API Status */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              🤖 Powered by AI • 🔒 Secure Processing • 📊 Advanced Analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
