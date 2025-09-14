'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [previewUrl, setPreviewUrl] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const loadAnalysisData = () => {
      try {
        // ✅ อ่านข้อมูลจาก sessionStorage
        const storedData = sessionStorage.getItem('skinai_analysis_result');
        const storedPreviewUrl = sessionStorage.getItem('skinai_preview_url');
        
        if (!storedData) {
          setError('No analysis data found. Please upload an image first.');
          setLoading(false);
          return;
        }

        const analysisResponse = JSON.parse(storedData);
        console.log('📊 Loaded analysis data:', analysisResponse);
        
        // ✅ จัดการโครงสร้างข้อมูลที่หลากหลาย
        let finalData = null;
        
        if (analysisResponse.success) {
          if (analysisResponse.analysisResults) {
            // โครงสร้างใหม่: { success: true, analysisResults: {...} }
            finalData = {
              ...analysisResponse.analysisResults,
              analysisId: analysisResponse.analysisId || analysisResponse.analysisResults.analysisId
            };
          } else {
            // โครงสร้างเก่า: { success: true, ...data }
            finalData = analysisResponse;
          }
        } else {
          // กรณี error
          setError(analysisResponse.error || 'Analysis failed');
          setLoading(false);
          return;
        }
        
        // ✅ ตรวจสอบว่ามี analysisId หรือไม่
        if (!finalData.analysisId) {
          finalData.analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log('⚠️ Generated missing analysisId:', finalData.analysisId);
        }
        
        setAnalysisData(finalData);
        
        // ตั้งค่า preview URL
        if (storedPreviewUrl) {
          setPreviewUrl(storedPreviewUrl);
        } else if (finalData.originalImage) {
          setPreviewUrl(finalData.originalImage);
        }
        
        setLoading(false);
        
      } catch (e) {
        console.error('❌ Failed to load analysis data:', e);
        setError('Failed to load analysis data');
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, []);

  // ✅ ฟังก์ชันสร้าง Report ที่ปรับปรุงแล้ว
  const generateReport = () => {
    try {
      if (!analysisData) {
        alert('No analysis data available');
        return;
      }
      
      const analysisId = analysisData.analysisId;
      
      if (!analysisId) {
        alert('Missing analysis ID');
        return;
      }
      
      // เตรียมข้อมูลสำหรับ Report
      const reportData = {
        analysisId: analysisId,
        created_at: analysisData.timestamp || new Date().toISOString(),
        skin_analysis: {
          skin_type: analysisData.skinType || 'Unknown',
          primary_condition: analysisData.skinCondition || 'Unknown',
          severity_level: analysisData.severity || 'Unknown',
          confidence_score: (analysisData.confidence || 0) / 100,
          confidence: analysisData.confidence || 0,
          conditions: analysisData.affectedAreas ? 
            analysisData.affectedAreas.reduce((acc, area) => {
              acc[area.area.toLowerCase()] = area.severity.toLowerCase();
              return acc;
            }, {}) : {},
          details: analysisData.detectionMessage || 'Analysis completed successfully',
          analysis_method: analysisData.detectionMethod || 'Standard Analysis'
        },
        recommendations: {
          skincare_routine: analysisData.recommendations || [
            'ทำความสะอาดผิวหน้าด้วยผลิตภัณฑ์อ่อนโยน',
            'ใช้ครีมบำรุงที่เหมาะกับประเภทผิว',
            'ทาครีมกันแดดทุกวัน',
            'ดื่มน้ำให้เพียงพอ'
          ],
          products: analysisData.productSuggestions ? 
            Object.entries(analysisData.productSuggestions).map(([type, product]) => ({
              name: product,
              type: type,
              reason: `เหมาะสำหรับ${analysisData.skinType || 'ผิวทั่วไป'}`
            })) : [
              { name: 'Gentle Cleanser', type: 'cleanser', reason: 'ทำความสะอาดอ่อนโยน' },
              { name: 'Moisturizer', type: 'moisturizer', reason: 'บำรุงผิวให้ชุมชื้น' },
              { name: 'Sunscreen SPF 30+', type: 'sunscreen', reason: 'ป้องกันแสงแดด' }
            ],
          tips: analysisData.lifestyleTips || [
            'หลีกเลี่ยงการสัมผัสหน้าด้วยมือที่ไม่สะอาด',
            'นอนหลับให้เพียงพอ 7-8 ชั่วโมงต่อวัน',
            'รับประทานอาหารที่มีวิตามินและแร่ธาตุ',
            'ออกกำลังกายสม่ำเสมอ'
          ]
        },
        image_url: previewUrl || analysisData.originalImage,
        face_detected: analysisData.faceDetected || false,
        processing_time: analysisData.processing_time,
        gemini_recommendations: analysisData.geminiSuccess || false
      };

      // บันทึกข้อมูลลง sessionStorage
      sessionStorage.setItem('current_analysis_report', JSON.stringify(reportData));
      
      console.log('✅ Report data prepared:', reportData);
      
      // ไปหน้า Report พร้อม ID
      router.push(`/report?id=${analysisId}`);
      
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Analysis Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Please upload an image first'}</p>
          <button 
            onClick={() => router.push('/upload')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Upload New Image
          </button>
        </div>
      </div>
    );
  }

  // ✅ จัดการข้อมูลที่แสดงผล
  const displayName = analysisData.originalFileName || analysisData.fileInfo?.name || 'Analysis';
  const displayTime = analysisData.timestamp;
  const displayPreview = previewUrl || analysisData.originalImage || analysisData.croppedImage;

  // Status color functions
  const getStatusColor = (status) => {
    if (status?.includes('Complete')) return 'text-green-600 bg-green-100';
    if (status?.includes('Partial')) return 'text-yellow-600 bg-yellow-100';
    if (status?.includes('Failed') || status?.includes('Error')) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'mild': return 'text-yellow-600 bg-yellow-100';
      case 'moderate': return 'text-orange-600 bg-orange-100';
      case 'severe': return 'text-red-600 bg-red-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'retake needed': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analysis Results</h1>
              <p className="text-gray-600">
                {displayName} • {displayTime ? `Analyzed on ${new Date(displayTime).toLocaleString()}` : 'Recent analysis'}
              </p>
              {/* ✅ แสดง Analysis ID */}
              <p className="text-sm text-gray-500">
                ID: {analysisData.analysisId}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor('Complete')}`}>
                Analysis Complete
              </span>
              {analysisData.faceDetected && (
                <span className="px-3 py-1 rounded-full text-sm font-medium text-green-600 bg-green-100">
                  Face Detected
                </span>
              )}
              {analysisData.geminiSuccess && (
                <span className="px-3 py-1 rounded-full text-sm font-medium text-purple-600 bg-purple-100">
                  AI Enhanced
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column - Image and Basic Info */}
          <div className="lg:col-span-1">
            
            {/* Image Display */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Image</h3>
              <div className="relative">
                {displayPreview ? (
                  <img 
                    src={displayPreview} 
                    alt="Analysis subject" 
                    className="w-full rounded-lg shadow-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                
                {/* Fallback when no image */}
                <div 
                  className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"
                  style={{ display: displayPreview ? 'none' : 'flex' }}
                >
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Image not available</p>
                  </div>
                </div>

                {/* Processed Image */}
                {analysisData.croppedImage && analysisData.croppedImage !== displayPreview && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Processed Image</h4>
                    <img 
                      src={analysisData.croppedImage} 
                      alt="Processed" 
                      className="w-full rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Skin Condition</span>
                  <span className="font-medium">{analysisData.skinCondition || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Severity</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getSeverityColor(analysisData.severity)}`}>
                    {analysisData.severity || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence</span>
                  <span className="font-medium">{analysisData.confidence || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skin Type</span>
                  <span className="font-medium">{analysisData.skinType || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skin Tone</span>
                  <span className="font-medium">{analysisData.skinTone || 'Unknown'}</span>
                </div>
                {analysisData.processing_time && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Time</span>
                    <span className="font-medium">{analysisData.processing_time}s</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Analysis */}
          <div className="lg:col-span-2">
            
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {['overview', 'metrics', 'recommendations', 'treatment'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    
                    {/* Face Detection Status */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Detection Status</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          {analysisData.faceDetected ? (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          ) : (
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          )}
                          <span className="font-medium">
                            {analysisData.faceDetected ? 'Face Successfully Detected' : 'No Face Detected'}
                          </span>
                        </div>
                        {analysisData.detectionMessage && (
                          <p className="text-sm text-gray-600 ml-6">{analysisData.detectionMessage}</p>
                        )}
                        {analysisData.detectionMethod && (
                          <p className="text-sm text-gray-500 ml-6">Method: {analysisData.detectionMethod}</p>
                        )}
                      </div>
                    </div>

                    {/* Affected Areas */}
                    {analysisData.affectedAreas && analysisData.affectedAreas.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Analysis Areas</h4>
                        <div className="space-y-3">
                          {analysisData.affectedAreas.map((area, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{area.area}</span>
                                <span className={`px-2 py-1 rounded-full text-sm ${getSeverityColor(area.severity)}`}>
                                  {area.severity}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${area.percentage || 0}%` }}
                                ></div>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {area.percentage || 0}% coverage
                                {area.description && (
                                  <span className="ml-2">• {area.description}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Metrics Tab */}
                {activeTab === 'metrics' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">Skin Analysis Metrics</h4>
                    
                    {analysisData.metrics && Object.keys(analysisData.metrics).length > 0 ? (
                      <div className="grid md:grid-cols-3 gap-4">
                        {Object.entries(analysisData.metrics).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600 mb-1">{value}%</div>
                            <div className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${value}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No detailed metrics available</p>
                        <p className="text-sm mt-2">This may occur when face detection fails</p>
                      </div>
                    )}

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-2">Analysis Details</h5>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• Texture Assessment: {analysisData.texture || 'Unknown'}</p>
                        <p>• Overall Condition: {analysisData.skinCondition || 'Unknown'}</p>
                        <p>• Confidence Level: {analysisData.confidence || 0}%</p>
                        {analysisData.geminiSuccess !== undefined && (
                          <p>• AI Processing: {analysisData.geminiSuccess ? 'Successful' : 'Limited'}</p>
                        )}
                        {analysisData.processing_time && (
                          <p>• Processing Time: {analysisData.processing_time} seconds</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === 'recommendations' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">AI Recommendations</h4>
                    
                    {analysisData.recommendations && analysisData.recommendations.length > 0 ? (
                      <div className="space-y-3">
                        {analysisData.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                            </div>
                            <p className="text-gray-700">{rec}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No specific recommendations available</p>
                      </div>
                    )}

                    {/* Photo Guidance for failed detections */}
                    {analysisData.photoGuidance && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h5 className="font-medium text-yellow-900 mb-3">📸 Photo Guidelines</h5>
                        <div className="space-y-2 text-sm text-yellow-800">
                          {Object.entries(analysisData.photoGuidance).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product Suggestions */}
                    {analysisData.productSuggestions && Object.keys(analysisData.productSuggestions).length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h5 className="font-medium text-green-900 mb-3">🛍️ Product Suggestions</h5>
                        <div className="space-y-2 text-sm text-green-800">
                          {Object.entries(analysisData.productSuggestions).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lifestyle Tips */}
                    {analysisData.lifestyleTips && analysisData.lifestyleTips.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h5 className="font-medium text-purple-900 mb-3">💡 Lifestyle Tips</h5>
                        <div className="space-y-1 text-sm text-purple-800">
                          {analysisData.lifestyleTips.map((tip, index) => (
                            <div key={index}>• {tip}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Treatment Tab */}
                {activeTab === 'treatment' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">Treatment Plan</h4>
                    
                    {analysisData.treatmentPlan && Object.keys(analysisData.treatmentPlan).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(analysisData.treatmentPlan).map(([phase, description], index) => (
                          <div key={phase} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">{index + 1}</span>
                              </div>
                              <h5 className="font-medium text-gray-900 capitalize">
                                {phase.replace(/([A-Z])/g, ' $1').trim()}
                              </h5>
                            </div>
                            <p className="text-gray-700 ml-11">{description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No treatment plan available</p>
                        <p className="text-sm mt-2">Complete analysis required for treatment recommendations</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/upload')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  New Analysis
                </button>
                
                {/* ✅ ปุ่ม Generate Report */}
                <button
                  onClick={generateReport}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Report
                </button>

                <button
                  onClick={() => router.push('/history')}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View History
                </button>

                {/* Debug Info (แสดงในโหมด Development) */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="w-full mt-4">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      🔍 Debug Info
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(analysisData, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
