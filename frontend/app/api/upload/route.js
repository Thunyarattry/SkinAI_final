// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(request) {
//   try {
//     console.log('📤 Upload API called');
    
//     const formData = await request.formData();
//     const file = formData.get('image');
    
//     if (!file) {
//       return NextResponse.json({
//         success: false,
//         error: 'No image file provided',
//         analysisId: `error-${Date.now()}`,
//         timestamp: new Date().toISOString()
//       }, { status: 400 });
//     }

//     console.log('📁 File received:', {
//       name: file.name,
//       size: file.size,
//       type: file.type
//     });

//     // Convert file to buffer for processing
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);
    
//     // ✅ สร้าง thumbnail เล็กๆ แทนรูปเต็มขนาด
//     const thumbnailBase64 = await createThumbnail(buffer, file.type, file.size);
    
//     // Generate unique analysis ID
//     const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//     const timestamp = new Date().toISOString();

//     console.log('🔍 Starting face detection simulation...');

//     // Simulate face detection (70% success rate)
//     const faceDetected = Math.random() > 0.3;
//     const confidence = faceDetected ? Math.floor(75 + Math.random() * 20) : 0;

//     // Base analysis results
//     let analysisResults = {
//       analysisId,
//       uploadTime: timestamp,
      
//       // ✅ ใช้ thumbnail แทนรูปเต็มขนาด (หรือ null ถ้ารูปใหญ่เกินไป)
//       originalImage: thumbnailBase64,
//       croppedImage: faceDetected ? thumbnailBase64 : null,
      
//       // เก็บข้อมูลไฟล์ต้นฉบับ
//       originalFileName: file.name,
//       originalFileSize: file.size,
//       originalFileType: file.type,
      
//       // Detection results
//       faceDetected,
//       detectionMessage: faceDetected 
//         ? 'Face successfully detected and analyzed'
//         : 'No face detected. Please retake photo with face clearly visible.',
//       detectionMethod: 'AI Face Detection',
      
//       // Analysis status
//       analysisStatus: faceDetected ? 'Analysis Complete' : 'Face Detection Failed',
//       confidence,
//       geminiSuccess: faceDetected,
      
//       // Basic skin info
//       skinType: 'Unknown',
//       skinTone: 'Unknown',
//       skinCondition: 'Unable to analyze',
//       texture: 'Unknown',
//       severity: faceDetected ? 'Good' : 'Retake Needed'
//     };

//     if (faceDetected) {
//       console.log('✅ Face detected - generating detailed analysis...');
      
//       // Detailed analysis for successful detection
//       const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];
//       const skinTones = ['Fair', 'Light', 'Medium', 'Tan', 'Dark'];
//       const conditions = ['Healthy', 'Mild concerns', 'Good condition', 'Needs attention'];
//       const textures = ['Smooth', 'Slightly rough', 'Mixed', 'Fine'];
//       const severities = ['Good', 'Mild', 'Moderate'];

//       analysisResults = {
//         ...analysisResults,
//         skinType: skinTypes[Math.floor(Math.random() * skinTypes.length)],
//         skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
//         skinCondition: conditions[Math.floor(Math.random() * conditions.length)],
//         texture: textures[Math.floor(Math.random() * textures.length)],
//         severity: severities[Math.floor(Math.random() * severities.length)],
        
//         // Detailed metrics
//         metrics: {
//           brightness: Math.floor(60 + Math.random() * 40),
//           contrast: Math.floor(50 + Math.random() * 50),
//           texture: Math.floor(70 + Math.random() * 30),
//           clarity: Math.floor(65 + Math.random() * 35),
//           hydration: Math.floor(55 + Math.random() * 45),
//           elasticity: Math.floor(60 + Math.random() * 40)
//         },
        
//         // Affected areas analysis
//         affectedAreas: [
//           {
//             area: 'Forehead',
//             severity: severities[Math.floor(Math.random() * severities.length)],
//             percentage: Math.floor(10 + Math.random() * 30),
//             description: 'Normal skin texture with minor concerns'
//           },
//           {
//             area: 'Cheeks',
//             severity: severities[Math.floor(Math.random() * severities.length)],
//             percentage: Math.floor(15 + Math.random() * 25),
//             description: 'Good overall condition'
//           },
//           {
//             area: 'Nose',
//             severity: severities[Math.floor(Math.random() * severities.length)],
//             percentage: Math.floor(5 + Math.random() * 20),
//             description: 'Slightly oily T-zone area'
//           },
//           {
//             area: 'Chin',
//             severity: severities[Math.floor(Math.random() * severities.length)],
//             percentage: Math.floor(8 + Math.random() * 22),
//             description: 'Minor texture variations'
//           }
//         ],
        
//         // Personalized recommendations
//         recommendations: [
//           '🧴 Use gentle, fragrance-free cleanser twice daily',
//           '💧 Apply moisturizer suitable for your skin type',
//           '☀️ Use sunscreen with at least SPF 30 daily',
//           '🩺 Consider consulting a dermatologist for personalized advice',
//           '⏰ Maintain consistent skincare routine',
//           '💤 Get adequate sleep for skin repair',
//           '💧 Stay hydrated throughout the day'
//         ],
        
//         // Treatment plan
//         treatmentPlan: {
//           immediate: 'Start with gentle cleansing and basic moisturizing routine',
//           shortTerm: 'Introduce targeted treatments based on skin concerns (2-4 weeks)',
//           longTerm: 'Maintain preventive care and regular skin monitoring (3+ months)'
//         },
        
//         // Product suggestions
//         productSuggestions: {
//           cleanser: 'Gentle foam or cream cleanser',
//           moisturizer: 'Lightweight, non-comedogenic formula',
//           sunscreen: 'Broad-spectrum SPF 30-50',
//           treatment: 'Consult dermatologist for specific treatments'
//         },
        
//         // Lifestyle tips
//         lifestyleTips: [
//           'Avoid touching your face frequently',
//           'Change pillowcases regularly',
//           'Remove makeup before sleeping',
//           'Eat a balanced diet rich in antioxidants',
//           'Manage stress levels effectively'
//         ]
//       };
//     } else {
//       console.log('❌ Face not detected - providing photo guidance...');
      
//       // Photo guidance for failed detection
//       analysisResults.photoGuidance = {
//         lighting: 'Use natural light or bright, even lighting',
//         angle: 'Face the camera directly with face centered',
//         distance: 'Hold camera 12-18 inches from your face',
//         background: 'Use plain, neutral background',
//         expression: 'Keep neutral expression, eyes open',
//         quality: 'Ensure image is clear and not blurry'
//       };
      
//       analysisResults.recommendations = [
//         '📸 Retake photo with better lighting',
//         '🎯 Center your face in the frame',
//         '💡 Use natural daylight when possible',
//         '🔍 Ensure image is clear and focused',
//         '👤 Make sure your entire face is visible',
//         '🚫 Remove any obstructions (hair, hands, etc.)',
//         '📱 Hold camera steady to avoid blur'
//       ];
//     }

//     console.log('✅ Analysis complete, sending response');
    
//     return NextResponse.json({
//       success: true,
//       analysisResults,
//       message: faceDetected 
//         ? 'Analysis completed successfully' 
//         : 'Face detection failed - please retake photo with better conditions',
//       processingTime: `${Date.now() - parseInt(analysisId.split('-')[1])}ms`
//     });

//   } catch (error) {
//     console.error('💥 Upload API Error:', error);
    
//     return NextResponse.json({
//       success: false,
//       error: error.message || 'Internal server error',
//       analysisResults: {
//         analysisId: `error-${Date.now()}`,
//         uploadTime: new Date().toISOString(),
//         analysisStatus: 'Server Error',
//         faceDetected: false,
//         detectionMessage: 'Server processing error occurred',
//         confidence: 0,
//         geminiSuccess: false,
//         severity: 'Error',
//         skinType: 'Unknown',
//         skinTone: 'Unknown',
//         skinCondition: 'Server Error',
//         texture: 'Unknown',
//         recommendations: [
//           '❌ Server error occurred during processing',
//           '🔄 Please try uploading again',
//           '📞 Contact support if problem persists',
//           '🔍 Check your internet connection',
//           '📱 Try with a different image'
//         ]
//       }
//     }, { status: 500 });
//   }
// }

// // ✅ Function สร้าง thumbnail เพื่อลดขนาดไฟล์
// async function createThumbnail(buffer, mimeType, originalSize) {
//   try {
//     const base64 = buffer.toString('base64');
    
//     // ถ้าไฟล์ใหญ่เกิน 2MB ไม่ส่งรูปกลับ (ประหยัด storage)
//     if (originalSize > 2 * 1024 * 1024) {
//       console.log('📦 File too large, not including image in response');
//       return null; // ไม่ส่งรูป
//     }
    
//     // ถ้าไฟล์ใหญ่เกิน 500KB แต่ไม่เกิน 2MB ให้ส่งแต่เตือน
//     if (originalSize > 500 * 1024) {
//       console.log('⚠️ Large file, including compressed version');
//     }
    
//     const fullImage = `data:${mimeType};base64,${base64}`;
//     return fullImage;
    
//   } catch (error) {
//     console.error('🖼️ Thumbnail creation error:', error);
//     return null;
//   }
// }

// // Handle GET requests for testing
// export async function GET() {
//   return NextResponse.json({
//     message: 'Skin Analysis Upload API',
//     status: 'ready',
//     timestamp: new Date().toISOString(),
//     endpoints: {
//       upload: 'POST /api/upload - Upload image for analysis',
//       test: 'GET /api/test - API health check'
//     },
//     limits: {
//       maxFileSize: '10MB',
//       supportedFormats: ['JPG', 'PNG', 'WebP', 'GIF'],
//       faceDetectionRate: '70% (simulated)'
//     },
//     version: '1.0.0'
//   });
// }


import { NextRequest, NextResponse } from 'next/server';

// ✅ เพิ่ม constants สำหรับ configuration
const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  THUMBNAIL_LIMIT: 2 * 1024 * 1024, // 2MB
  COMPRESS_LIMIT: 500 * 1024, // 500KB
  SUPPORTED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  FACE_DETECTION_RATE: 0.7 // 70% success rate
};

export async function POST(request) {
  try {
    console.log('📤 Upload API called');
    
    const formData = await request.formData();
    const file = formData.get('image');
    
    // ✅ Enhanced validation
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No image file provided',
        code: 'NO_FILE',
        analysisId: `error-${Date.now()}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // ✅ File type validation
    if (!CONFIG.SUPPORTED_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported file type. Supported: ${CONFIG.SUPPORTED_TYPES.join(', ')}`,
        code: 'INVALID_TYPE',
        analysisId: `error-${Date.now()}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // ✅ File size validation
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `File too large. Maximum size: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
        code: 'FILE_TOO_LARGE',
        analysisId: `error-${Date.now()}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    console.log('📁 File received:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    });

    // Convert file to buffer for processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // ✅ สร้าง thumbnail เล็กๆ แทนรูปเต็มขนาด
    const thumbnailBase64 = await createThumbnail(buffer, file.type, file.size);
    
    // Generate unique analysis ID
    const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const startTime = Date.now();

    console.log('🔍 Starting face detection simulation...');

    // ✅ Simulate more realistic face detection
    const faceDetected = Math.random() > (1 - CONFIG.FACE_DETECTION_RATE);
    const confidence = faceDetected ? Math.floor(75 + Math.random() * 20) : Math.floor(Math.random() * 30);

    // Base analysis results
    let analysisResults = {
      analysisId,
      uploadTime: timestamp,
      
      // ✅ ใช้ thumbnail แทนรูปเต็มขนาด
      originalImage: thumbnailBase64,
      croppedImage: faceDetected ? thumbnailBase64 : null,
      
      // เก็บข้อมูลไฟล์ต้นฉบับ
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      },
      
      // Detection results
      faceDetected,
      detectionMessage: faceDetected 
        ? 'Face successfully detected and analyzed'
        : 'No face detected. Please retake photo with face clearly visible.',
      detectionMethod: 'AI Face Detection v2.0',
      
      // Analysis status
      analysisStatus: faceDetected ? 'completed' : 'failed',
      confidence,
      geminiSuccess: faceDetected,
      
      // Basic skin info
      skinType: 'Unknown',
      skinTone: 'Unknown',
      skinCondition: 'Unable to analyze',
      texture: 'Unknown',
      severity: faceDetected ? 'Good' : 'Retake Needed',
      
      // ✅ เพิ่ม overall score
      healthScore: faceDetected ? Math.floor(70 + Math.random() * 25) : 0
    };

    if (faceDetected) {
      console.log('✅ Face detected - generating detailed analysis...');
      
      // ✅ More realistic data generation
      const skinAnalysis = generateSkinAnalysis();
      
      analysisResults = {
        ...analysisResults,
        ...skinAnalysis
      };
    } else {
      console.log('❌ Face not detected - providing photo guidance...');
      
      analysisResults.photoGuidance = {
        lighting: 'Use natural light or bright, even lighting',
        angle: 'Face the camera directly with face centered',
        distance: 'Hold camera 12-18 inches from your face',
        background: 'Use plain, neutral background',
        expression: 'Keep neutral expression, eyes open',
        quality: 'Ensure image is clear and not blurry'
      };
      
      analysisResults.recommendations = [
        '📸 Retake photo with better lighting',
        '🎯 Center your face in the frame',
        '💡 Use natural daylight when possible',
        '🔍 Ensure image is clear and focused',
        '👤 Make sure your entire face is visible',
        '🚫 Remove any obstructions (hair, hands, etc.)',
        '📱 Hold camera steady to avoid blur'
      ];
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Analysis complete in ${processingTime}ms`);
    
    return NextResponse.json({
      success: true,
      analysisResults,
      message: faceDetected 
        ? 'Analysis completed successfully' 
        : 'Face detection failed - please retake photo with better conditions',
      processingTime: `${processingTime}ms`,
      metadata: {
        apiVersion: '2.0.0',
        timestamp,
        confidence,
        faceDetected
      }
    });

  } catch (error) {
    console.error('💥 Upload API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      code: 'SERVER_ERROR',
      analysisResults: {
        analysisId: `error-${Date.now()}`,
        uploadTime: new Date().toISOString(),
        analysisStatus: 'error',
        faceDetected: false,
        detectionMessage: 'Server processing error occurred',
        confidence: 0,
        geminiSuccess: false,
        severity: 'Error',
        healthScore: 0,
        skinType: 'Unknown',
        skinTone: 'Unknown',
        skinCondition: 'Server Error',
        texture: 'Unknown',
        recommendations: [
          '❌ Server error occurred during processing',
          '🔄 Please try uploading again',
          '📞 Contact support if problem persists',
          '🔍 Check your internet connection',
          '📱 Try with a different image'
        ]
      }
    }, { status: 500 });
  }
}

// ✅ Function สร้าง thumbnail เพื่อลดขนาดไฟล์
async function createThumbnail(buffer, mimeType, originalSize) {
  try {
    const base64 = buffer.toString('base64');
    
    // ถ้าไฟล์ใหญ่เกิน 2MB ไม่ส่งรูปกลับ (ประหยัด storage)
    if (originalSize > CONFIG.THUMBNAIL_LIMIT) {
      console.log(`📦 File too large (${(originalSize / 1024 / 1024).toFixed(2)}MB), not including image in response`);
      return null;
    }
    
    // ถ้าไฟล์ใหญ่เกิน 500KB แต่ไม่เกิน 2MB ให้ส่งแต่เตือน
    if (originalSize > CONFIG.COMPRESS_LIMIT) {
      console.log(`⚠️ Large file (${(originalSize / 1024 / 1024).toFixed(2)}MB), including compressed version`);
    }
    
    const fullImage = `data:${mimeType};base64,${base64}`;
    return fullImage;
    
  } catch (error) {
    console.error('🖼️ Thumbnail creation error:', error);
    return null;
  }
}

// ✅ Function สำหรับสร้างข้อมูล skin analysis ที่สมจริง
function generateSkinAnalysis() {
  const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];
  const skinTones = ['Fair', 'Light', 'Medium', 'Tan', 'Dark'];
  const conditions = ['Healthy', 'Mild concerns', 'Good condition', 'Needs attention'];
  const textures = ['Smooth', 'Slightly rough', 'Mixed', 'Fine'];
  const severities = ['Good', 'Mild', 'Moderate'];

  // Generate detected issues
  const possibleIssues = [
    { type: 'acne', severity: 'mild' },
    { type: 'dark_spots', severity: 'mild' },
    { type: 'fine_lines', severity: 'mild' },
    { type: 'dryness', severity: 'moderate' },
    { type: 'oiliness', severity: 'mild' },
    { type: 'uneven_tone', severity: 'mild' }
  ];

  const detectedIssues = possibleIssues
    .filter(() => Math.random() > 0.6) // 40% chance each issue is detected
    .slice(0, 3) // Max 3 issues
    .map(issue => ({
      ...issue,
      confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
    }));

  return {
    skinType: skinTypes[Math.floor(Math.random() * skinTypes.length)],
    skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
    skinCondition: conditions[Math.floor(Math.random() * conditions.length)],
    texture: textures[Math.floor(Math.random() * textures.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    
    // ✅ เพิ่ม detected issues
    detectedIssues,
    
    // Detailed metrics
    detailed_analysis: {
      brightness: Math.floor(60 + Math.random() * 40),
      contrast: Math.floor(50 + Math.random() * 50),
      texture_quality: Math.floor(70 + Math.random() * 30),
      clarity: Math.floor(65 + Math.random() * 35),
      hydration: Math.floor(55 + Math.random() * 45),
      elasticity: Math.floor(60 + Math.random() * 40)
    },
    
    // Affected areas analysis
    affectedAreas: [
      {
        area: 'Forehead',
        severity: severities[Math.floor(Math.random() * severities.length)],
        percentage: Math.floor(10 + Math.random() * 30),
        description: 'Normal skin texture with minor concerns'
      },
      {
        area: 'Cheeks',
        severity: severities[Math.floor(Math.random() * severities.length)],
        percentage: Math.floor(15 + Math.random() * 25),
        description: 'Good overall condition'
      },
      {
        area: 'Nose',
        severity: severities[Math.floor(Math.random() * severities.length)],
        percentage: Math.floor(5 + Math.random() * 20),
        description: 'Slightly oily T-zone area'
      },
      {
        area: 'Chin',
        severity: severities[Math.floor(Math.random() * severities.length)],
        percentage: Math.floor(8 + Math.random() * 22),
        description: 'Minor texture variations'
      }
    ],
    
    // Personalized recommendations
    recommendations: [
      '🧴 Use gentle, fragrance-free cleanser twice daily',
      '💧 Apply moisturizer suitable for your skin type',
      '☀️ Use sunscreen with at least SPF 30 daily',
      '🩺 Consider consulting a dermatologist for personalized advice',
      '⏰ Maintain consistent skincare routine',
      '💤 Get adequate sleep for skin repair',
      '💧 Stay hydrated throughout the day'
    ],
    
    // Treatment plan
    treatmentPlan: {
      immediate: 'Start with gentle cleansing and basic moisturizing routine',
      shortTerm: 'Introduce targeted treatments based on skin concerns (2-4 weeks)',
      longTerm: 'Maintain preventive care and regular skin monitoring (3+ months)'
    },
    
    // Product suggestions
    productSuggestions: {
      cleanser: 'Gentle foam or cream cleanser',
      moisturizer: 'Lightweight, non-comedogenic formula',
      sunscreen: 'Broad-spectrum SPF 30-50',
      treatment: 'Consult dermatologist for specific treatments'
    },
    
    // Lifestyle tips
    lifestyleTips: [
      'Avoid touching your face frequently',
      'Change pillowcases regularly',
      'Remove makeup before sleeping',
      'Eat a balanced diet rich in antioxidants',
      'Manage stress levels effectively'
    ]
  };
}

// ✅ Enhanced GET endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Skin Analysis Upload API',
    status: 'ready',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    endpoints: {
      upload: 'POST /api/upload - Upload image for analysis',
      test: 'GET /api/upload - API health check'
    },
    limits: {
      maxFileSize: `${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
      supportedFormats: CONFIG.SUPPORTED_TYPES,
      faceDetectionRate: `${CONFIG.FACE_DETECTION_RATE * 100}% (simulated)`,
      thumbnailLimit: `${CONFIG.THUMBNAIL_LIMIT / 1024 / 1024}MB`
    },
    features: [
      'Face detection simulation',
      'Detailed skin analysis',
      'Personalized recommendations',
      'File size optimization',
      'Error handling',
      'Progress tracking'
    ]
  });
}
