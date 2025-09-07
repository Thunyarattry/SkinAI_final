'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadDropzone({ 
  onLoaded,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  multiple = false,
  className = "",
  title = "Upload Your Image",
  subtitle = "Drag & drop or click to select",
  showPreview = true,
  onError = null,
  disabled = false
}) {
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 📁 File validation
  const validateFile = (file) => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `รองรับเฉพาะไฟล์ ${acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `ขนาดไฟล์ต้องไม่เกิน ${maxSizeMB} MB`;
    }

    return null;
  };

  // 📤 Handle file drop
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');
    setUploadProgress(0);

    // Handle rejected files
    if (rejectedFiles?.length > 0) {
      const rejection = rejectedFiles[0];
      const errorMessage = rejection.errors[0]?.message || 'ไฟล์ไม่ถูกต้อง';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      return;
    }

    if (!acceptedFiles?.length) return;

    const files = multiple ? acceptedFiles : [acceptedFiles[0]];
    
    // Validate each file
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        if (onError) onError(validationError);
        return;
      }
    }

    setIsUploading(true);
    
    // Process files
    const processFiles = async () => {
      try {
        const results = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Update progress
          setUploadProgress(((i + 1) / files.length) * 100);
          
          // Read file
          const result = await readFileAsDataURL(file);
          results.push({ dataUrl: result, file });
          
          // Set preview for single file
          if (!multiple && showPreview) {
            setPreview(result);
          }
        }
        
        // Call callback
        if (multiple) {
          onLoaded?.(results);
        } else {
          onLoaded?.(results[0].dataUrl, results[0].file);
        }
        
      } catch (err) {
        const errorMsg = 'เกิดข้อผิดพลาดในการอ่านไฟล์';
        setError(errorMsg);
        if (onError) onError(errorMsg);
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    };

    processFiles();
  }, [onLoaded, maxSize, acceptedTypes, multiple, showPreview, onError]);

  // 📖 Read file as data URL
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 🗑️ Clear preview
  const clearPreview = () => {
    setPreview(null);
    setError('');
    setUploadProgress(0);
  };

  // 🎨 Get file type extensions for display
  const getFileExtensions = () => {
    return acceptedTypes.map(type => {
      const ext = type.split('/')[1];
      return ext === 'jpeg' ? 'jpg' : ext;
    }).join(', ').toUpperCase();
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {}),
    maxSize,
    disabled: disabled || isUploading,
    onDropRejected: (rejectedFiles) => {
      const rejection = rejectedFiles[0];
      const errorMessage = rejection.errors[0]?.message || 'ไฟล์ไม่ถูกต้อง';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
  });

  // 🎨 Dynamic styling
  const getDropzoneStyle = () => {
    if (disabled || isUploading) {
      return 'bg-gray-50 border-gray-200 cursor-not-allowed';
    }
    if (isDragReject) {
      return 'bg-red-50 border-red-400 border-solid';
    }
    if (isDragActive) {
      return 'bg-blue-50 border-blue-400 border-solid scale-105';
    }
    return 'bg-white border-slate-300 hover:border-blue-400 hover:bg-blue-50/30';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Dropzone */}
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer 
          transition-all duration-200 ease-in-out
          ${getDropzoneStyle()}
          ${preview ? 'border-green-400 bg-green-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {/* Loading State */}
        {isUploading ? (
          <div className="space-y-4">
            <div className="text-4xl animate-spin">⏳</div>
            <div className="font-medium text-blue-600">กำลังอัปโหลด...</div>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600">{Math.round(uploadProgress)}%</div>
          </div>
        ) : preview && showPreview ? (
          /* Preview State */
          <div className="space-y-4">
            <div className="relative inline-block">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-w-full max-h-48 rounded-lg shadow-md"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearPreview();
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="text-green-600 font-medium">✅ อัปโหลดสำเร็จ</div>
            <div className="text-sm text-gray-600">คลิกเพื่อเปลี่ยนรูปภาพ</div>
          </div>
        ) : (
          /* Default State */
          <div className="space-y-3">
            <div className="text-5xl">
              {isDragActive ? '📥' : isDragReject ? '❌' : '📤'}
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-lg text-gray-800">{title}</div>
              <div className="text-gray-600">{subtitle}</div>
              <div className="text-sm text-gray-500">
                รองรับไฟล์ {getFileExtensions()} • ขนาดไม่เกิน {(maxSize / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
            
            {/* Drag State Messages */}
            {isDragActive && (
              <div className="text-blue-600 font-medium animate-pulse">
                🎯 วางไฟล์ที่นี่
              </div>
            )}
            
            {isDragReject && (
              <div className="text-red-600 font-medium">
                ❌ ไฟล์ไม่ถูกต้อง
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <span className="text-red-500">⚠️</span>
          <span className="text-red-700 text-sm font-medium">{error}</span>
        </div>
      )}

      {/* File Info */}
      {!error && !isUploading && (
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <span>📁</span>
              <span>{getFileExtensions()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>📏</span>
              <span>Max {(maxSize / (1024 * 1024)).toFixed(1)}MB</span>
            </div>
            {multiple && (
              <div className="flex items-center space-x-1">
                <span>📊</span>
                <span>Multiple files</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
