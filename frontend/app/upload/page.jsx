// 'use client';

// import { useState, useRef } from 'react';
// import { useRouter } from 'next/navigation';
// import { Camera, Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

// export default function UploadPage() {
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [uploading, setUploading] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [error, setError] = useState(null);
//   const [dragOver, setDragOver] = useState(false);
  
//   const fileInputRef = useRef(null);
//   const router = useRouter();

//   // 🔧 ตั้งค่า API Base URL
//   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

//   const handleFileSelect = (file) => {
//     if (!file) return;

//     // Validate file type
//     if (!file.type.startsWith('image/')) {
//       setError('Please select an image file');
//       return;
//     }

//     // Validate file size (15MB limit)
//     if (file.size > 15 * 1024 * 1024) {
//       setError('File size must be less than 15MB');
//       return;
//     }

//     setSelectedFile(file);
//     setError(null);

//     // Create preview URL
//     const url = URL.createObjectURL(file);
//     setPreviewUrl(url);
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     handleFileSelect(file);
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     setDragOver(false);
    
//     const file = e.dataTransfer.files[0];
//     handleFileSelect(file);
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//     setDragOver(true);
//   };

//   const handleDragLeave = (e) => {
//     e.preventDefault();
//     setDragOver(false);
//   };

//   const clearSelection = () => {
//     setSelectedFile(null);
//     if (previewUrl) {
//       URL.revokeObjectURL(previewUrl);
//     }
//     setPreviewUrl(null);
//     setError(null);
//     setProgress(0);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!selectedFile) {
//       setError('Please select an image first');
//       return;
//     }

//     setUploading(true);
//     setError(null);
//     setProgress(0);

//     try {
//       const formData = new FormData();
//       // ✅ แก้ไข: ใช้ 'file' ตรงตาม Backend API
//       formData.append('file', selectedFile);
      
//       // ✅ เพิ่ม optional parameters
//       formData.append('enable_advanced', 'true');

//       // Progress simulation
//       const progressInterval = setInterval(() => {
//         setProgress(prev => Math.min(prev + 5, 85));
//       }, 300);

//       console.log('📤 Uploading to:', `${API_BASE_URL}/api/upload`);
//       console.log('📦 File details:', {
//         name: selectedFile.name,
//         size: selectedFile.size,
//         type: selectedFile.type
//       });
      
//       // ✅ API Call with proper error handling
//       const response = await fetch(`${API_BASE_URL}/api/upload`, {
//         method: 'POST',
//         body: formData,
//         // ✅ ไม่ต้องกำหนด Content-Type ให้ browser จัดการ multipart/form-data
//         headers: {
//           'Accept': 'application/json',
//         },
//       });

//       clearInterval(progressInterval);
//       setProgress(95);

//       console.log('📥 Response status:', response.status);
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('❌ Error response:', errorText);
        
//         let errorData;
//         try {
//           errorData = JSON.parse(errorText);
//         } catch {
//           errorData = { error: `HTTP ${response.status}: ${errorText}` };
//         }
        
//         // ✅ จัดการ error message ที่ดีขึ้น
//         let errorMessage = 'Upload failed';
//         if (errorData.detail && Array.isArray(errorData.detail)) {
//           // FastAPI validation error
//           const validationErrors = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`);
//           errorMessage = `Validation Error: ${validationErrors.join(', ')}`;
//         } else if (errorData.error) {
//           errorMessage = errorData.error;
//         } else if (errorData.detail) {
//           errorMessage = errorData.detail;
//         }
        
//         throw new Error(errorMessage);
//       }

//       const result = await response.json();
//       console.log('✅ Upload successful:', result);
//       setProgress(100);

//       // รอให้ progress bar เต็ม
//       await new Promise(resolve => setTimeout(resolve, 500));

//       if (result.success) {
//         // ✅ บันทึกข้อมูลลง sessionStorage พร้อม analysisId
//         const analysisData = {
//           ...result,
//           // ✅ ตรวจสอบว่ามี analysisId หรือไม่
//           analysisId: result.analysisId || result.analysisResults?.analysisId || `analysis_${Date.now()}`,
//           fileInfo: {
//             name: selectedFile.name,
//             size: selectedFile.size,
//             type: selectedFile.type,
//             uploadTime: new Date().toISOString()
//           }
//         };
        
//         try {
//           sessionStorage.setItem('skinai_analysis_result', JSON.stringify(analysisData));
//           console.log('✅ Analysis data saved with ID:', analysisData.analysisId);
          
//           // เก็บ preview URL
//           if (previewUrl) {
//             sessionStorage.setItem('skinai_preview_url', previewUrl);
//           }
          
//         } catch (storageError) {
//           console.warn('⚠️ Storage error:', storageError);
//         }
        
//         // ✅ Redirect to analysis page
//         router.push('/analysis');
        
//       } else {
//         throw new Error(result.error || 'Analysis failed');
//       }

//     } catch (error) {
//       console.error('💥 Upload error:', error);
//       setError(error.message || 'Upload failed. Please try again.');
//       setProgress(0);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
//       <div className="container mx-auto px-4 max-w-2xl">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-gray-800 mb-2">
//             🔬 AI Skin Analysis
//           </h1>
//           <p className="text-gray-600">
//             Upload a clear photo of your face for AI-powered skin analysis
//           </p>
//         </div>

//         {/* Upload Form */}
//         <div className="bg-white rounded-2xl shadow-xl p-8">
//           <form onSubmit={handleSubmit} className="space-y-6">
            
//             {/* File Upload Area */}
//             <div
//               className={`
//                 relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
//                 ${dragOver 
//                   ? 'border-blue-400 bg-blue-50' 
//                   : selectedFile 
//                     ? 'border-green-400 bg-green-50' 
//                     : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
//                 }
//               `}
//               onDrop={handleDrop}
//               onDragOver={handleDragOver}
//               onDragLeave={handleDragLeave}
//             >
//               {previewUrl ? (
//                 // Preview Image
//                 <div className="relative">
//                   <img
//                     src={previewUrl}
//                     alt="Preview"
//                     className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
//                   />
//                   <button
//                     type="button"
//                     onClick={clearSelection}
//                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
//                   >
//                     <X size={16} />
//                   </button>
//                   <div className="mt-4 text-sm text-gray-600">
//                     <p className="font-medium">{selectedFile?.name}</p>
//                     <p>{(selectedFile?.size / 1024 / 1024).toFixed(2)} MB</p>
//                   </div>
//                 </div>
//               ) : (
//                 // Upload Prompt
//                 <div className="space-y-4">
//                   <div className="flex justify-center">
//                     <div className="p-3 bg-blue-100 rounded-full">
//                       <ImageIcon className="w-8 h-8 text-blue-600" />
//                     </div>
//                   </div>
//                   <div>
//                     <p className="text-lg font-medium text-gray-700 mb-2">
//                       Choose or drag your photo here
//                     </p>
//                     <p className="text-sm text-gray-500 mb-4">
//                       Supports JPG, PNG, WebP, GIF, BMP • Max 15MB
//                     </p>
//                     <button
//                       type="button"
//                       onClick={() => fileInputRef.current?.click()}
//                       className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                     >
//                       <Upload className="w-4 h-4 mr-2" />
//                       Browse Files
//                     </button>
//                   </div>
//                 </div>
//               )}

//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/*"
//                 onChange={handleFileChange}
//                 className="hidden"
//               />
//             </div>

//             {/* Error Message */}
//             {error && (
//               <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
//                 <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
//                 <p className="text-red-700 text-sm">{error}</p>
//               </div>
//             )}

//             {/* Progress Bar */}
//             {uploading && (
//               <div className="space-y-2">
//                 <div className="flex justify-between text-sm text-gray-600">
//                   <span>
//                     {progress < 30 ? 'Uploading image...' :
//                      progress < 60 ? 'Detecting face...' :
//                      progress < 90 ? 'Analyzing skin...' :
//                      'Generating recommendations...'}
//                   </span>
//                   <span>{progress}%</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
//                     style={{ width: `${progress}%` }}
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={!selectedFile || uploading}
//               className={`
//                 w-full py-4 px-6 rounded-xl font-medium text-white transition-all duration-300
//                 ${!selectedFile || uploading
//                   ? 'bg-gray-400 cursor-not-allowed'
//                   : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
//                 }
//               `}
//             >
//               {uploading ? (
//                 <div className="flex items-center justify-center space-x-2">
//                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                   <span>Analyzing with AI...</span>
//                 </div>
//               ) : (
//                 <div className="flex items-center justify-center space-x-2">
//                   <Camera className="w-5 h-5" />
//                   <span>🚀 Start AI Analysis</span>
//                 </div>
//               )}
//             </button>
//           </form>

//           {/* Tips */}
//           <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
//             <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
//               <span className="mr-2">📸</span>
//               Photo Tips for Best Results:
//             </h3>
//             <ul className="text-sm text-gray-600 space-y-2">
//               <li className="flex items-start space-x-2">
//                 <span className="text-green-500 mt-0.5">✓</span>
//                 <span>Use natural daylight or bright, even lighting</span>
//               </li>
//               <li className="flex items-start space-x-2">
//                 <span className="text-green-500 mt-0.5">✓</span>
//                 <span>Face the camera directly with your face centered</span>
//               </li>
//               <li className="flex items-start space-x-2">
//                 <span className="text-green-500 mt-0.5">✓</span>
//                 <span>Keep a neutral expression with eyes open</span>
//               </li>
//               <li className="flex items-start space-x-2">
//                 <span className="text-green-500 mt-0.5">✓</span>
//                 <span>Ensure the image is clear and not blurry</span>
//               </li>
//               <li className="flex items-start space-x-2">
//                 <span className="text-green-500 mt-0.5">✓</span>
//                 <span>Remove makeup for more accurate analysis</span>
//               </li>
//             </ul>
//           </div>

//           {/* API Status */}
//           <div className="mt-4 text-center">
//             <p className="text-xs text-gray-500">
//               🤖 Powered by AI • 🔒 Secure Processing • 📊 Advanced Analysis
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, X, AlertCircle, Image as ImageIcon, ArrowLeft } from 'lucide-react';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  
  const fileInputRef = useRef(null);
  const router = useRouter();

  // 🔧 ตั้งค่า API Base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // 🧹 Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 📊 Load upload count
  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`skinai_uploads_${today}`);
    setUploadCount(stored ? parseInt(stored) : 0);
  }, []);

  // 📱 Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP, etc.)');
      return;
    }

    // Validate file size (15MB limit)
    if (file.size > 15 * 1024 * 1024) {
      setError('File size must be less than 15MB');
      return;
    }

    // Clear previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
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

  // 🔄 Update upload count
  const incrementUploadCount = () => {
    const today = new Date().toDateString();
    const newCount = uploadCount + 1;
    setUploadCount(newCount);
    localStorage.setItem(`skinai_uploads_${today}`, newCount.toString());
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

    // Progress simulation
    let progressInterval;
    const startProgress = () => {
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 20) return prev + 2;
          if (prev < 40) return prev + 1;
          if (prev < 80) return prev + 0.5;
          return Math.min(prev + 0.2, 85);
        });
      }, 200);
    };

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('enable_advanced', 'true');
      formData.append('analysis_type', 'comprehensive');

      startProgress();
      
      // ✅ API Call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      setProgress(95);
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        // Handle error messages
        let errorMessage = 'Upload failed';
        
        if (response.status === 413) {
          errorMessage = 'File too large. Please choose a smaller image (max 15MB).';
        } else if (response.status === 415) {
          errorMessage = 'Unsupported file type. Please upload JPG, PNG, or WebP images.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setProgress(100);

      // Wait for progress bar to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      if (result.success || result.analysisResults || result.analysis) {
        // Save analysis data
        const analysisData = {
          success: true,
          analysisId: result.analysisId || result.analysis?.analysisId || `analysis_${Date.now()}`,
          analysisResults: result.analysisResults || result.analysis || result,
          uploadTime: new Date().toISOString(),
          fileInfo: {
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type,
            originalName: selectedFile.name
          },
          previewUrl: previewUrl
        };
        
        try {
          sessionStorage.setItem('skinai_analysis_result', JSON.stringify(analysisData));
          
          // Save to history
          const existingHistory = JSON.parse(localStorage.getItem('skinai_analysis_history') || '[]');
          const updatedHistory = [analysisData, ...existingHistory.slice(0, 9)];
          localStorage.setItem('skinai_analysis_history', JSON.stringify(updatedHistory));
          
        } catch (storageError) {
          console.warn('Storage error:', storageError);
        }
        
        // Update upload count
        incrementUploadCount();
        
        // Redirect to analysis page
        router.push('/analysis');
        
      } else {
        throw new Error(result.error || result.message || 'Analysis failed');
      }

    } catch (error) {
      clearInterval(progressInterval);
      
      let errorMessage = 'Upload failed. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Upload timeout. Please try again with a smaller image.';
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Get progress message
  const getProgressMessage = () => {
    if (progress < 30) return 'Uploading image...';
    if (progress < 60) return 'Analyzing skin...';
    if (progress < 90) return 'Generating results...';
    return 'Almost done...';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            
            <h1 className="text-xl font-semibold text-gray-900">AI Skin Analysis</h1>
            
            <div className="text-sm text-gray-500">
              Uploads: {uploadCount}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Upload Area - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Upload Your Photo
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* File Upload Area */}
                <div
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center transition-all
                    ${dragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : selectedFile 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-blue-400'
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
                        className="max-w-full max-h-48 mx-auto rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                      <div className="mt-3 text-sm text-gray-600">
                        <p className="font-medium">{selectedFile?.name}</p>
                        <p>{(selectedFile?.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                  ) : (
                    // Upload Prompt
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <ImageIcon className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-800 mb-2">
                          Choose or drag your photo here
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          JPG, PNG, WebP • Max 15MB
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-medium text-sm">Error</p>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {uploading && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{getProgressMessage()}</span>
                      <span className="text-blue-600 font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                    w-full py-3 px-4 rounded-lg font-medium transition-all
                    ${!selectedFile || uploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                  `}
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4" />
                      <span>Start Analysis</span>
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar - Tips */}
          <div className="space-y-6">
            
            {/* Photo Tips */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">📸 Photo Tips</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Use good lighting</div>
                <div>• Face the camera directly</div>
                <div>• Keep a neutral expression</div>
                <div>• Remove makeup if possible</div>
                <div>• Ensure image is clear</div>
              </div>
            </div>

            {/* What We Analyze */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">🔬 We Analyze</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  'Skin Type', 'Acne', 'Dark Spots', 'Hydration',
                  'Wrinkles', 'Tone', 'Pigmentation', 'Health'
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded px-2 py-1 text-center">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-green-50 rounded-xl border border-green-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">🔒 Privacy</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>✓ Secure processing</div>
                <div>✓ No permanent storage</div>
                <div>✓ GDPR compliant</div>
                <div>✓ Encrypted transfer</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Features */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-6 px-6 py-3 bg-white rounded-full shadow-sm border">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>🤖</span>
              <span>AI Powered</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>⚡</span>
              <span>Fast</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>🎯</span>
              <span>Accurate</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>🔒</span>
              <span>Private</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
