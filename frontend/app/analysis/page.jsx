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
        // ✅ เปลี่ยนจาก localStorage เป็น sessionStorage
        const uploadStr = sessionStorage.getItem('skinai_last_upload');
        const storedPreviewUrl = sessionStorage.getItem('skinai_preview_url');
        
        if (!uploadStr) {
          setError('No analysis data found');
          setLoading(false);
          return;
        }

        const uploadData = JSON.parse(uploadStr);
        
        // ตรวจสอบว่ามีข้อมูลการวิเคราะห์หรือไม่
        if (!uploadData.analysisId && !uploadData.analysisResults) {
          setError('Invalid analysis data');
          setLoading(false);
          return;
        }

        // ✅ จัดการข้อมูลที่อาจมีโครงสร้างต่างกัน
        let finalAnalysisData;
        if (uploadData.analysisResults) {
          // ข้อมูลจาก API response ใหม่
          finalAnalysisData = uploadData;
        } else {
          // ข้อมูลรูปแบบเก่า
          finalAnalysisData = {
            analysisResults: uploadData,
            preview: storedPreviewUrl,
            name: uploadData.name || uploadData.originalFileName || 'Unknown',
            uploadTime: uploadData.uploadTime
          };
        }

        setAnalysisData(finalAnalysisData);
        
        // ตั้งค่า preview URL
        if (storedPreviewUrl) {
          setPreviewUrl(storedPreviewUrl);
        } else if (finalAnalysisData.preview) {
          setPreviewUrl(finalAnalysisData.preview);
        }
        
        setLoading(false);
        
      } catch (e) {
        console.error('Failed to load analysis data:', e);
        setError('Failed to load analysis data');
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, []);

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
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Analysis Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Please upload an image first'}</p>
          <button 
            onClick={() => router.push('/upload')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  // ✅ จัดการข้อมูลที่อาจมีโครงสร้างต่างกัน
  const analysisResults = analysisData.analysisResults || analysisData;
  const displayName = analysisData.name || analysisResults.originalFileName || 'Analysis';
  const displayTime = analysisData.uploadTime || analysisResults.uploadTime;
  const displayPreview = previewUrl || analysisData.preview || analysisResults.originalImage;

  // Get status color based on analysis results
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
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(analysisResults.analysisStatus)}`}>
                {analysisResults.analysisStatus || 'Analysis Complete'}
              </span>
              {analysisResults.faceDetected && (
                <span className="px-3 py-1 rounded-full text-sm font-medium text-green-600 bg-green-100">
                  Face Detected
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Image not available</p>
                  </div>
                </div>

                {/* Processed Image */}
                {analysisResults.croppedImage && analysisResults.croppedImage !== displayPreview && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Processed Image</h4>
                    <img 
                      src={analysisResults.croppedImage} 
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
                  <span className="font-medium">{analysisResults.skinCondition || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Severity</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getSeverityColor(analysisResults.severity)}`}>
                    {analysisResults.severity || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence</span>
                  <span className="font-medium">{analysisResults.confidence || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skin Type</span>
                  <span className="font-medium">{analysisResults.skinType || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skin Tone</span>
                  <span className="font-medium">{analysisResults.skinTone || 'Unknown'}</span>
                </div>
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
                          {analysisResults.faceDetected ? (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          ) : (
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          )}
                          <span className="font-medium">
                            {analysisResults.faceDetected ? 'Face Successfully Detected' : 'No Face Detected'}
                          </span>
                        </div>
                        {analysisResults.detectionMessage && (
                          <p className="text-sm text-gray-600 ml-6">{analysisResults.detectionMessage}</p>
                        )}
                        {analysisResults.detectionMethod && (
                          <p className="text-sm text-gray-500 ml-6">Method: {analysisResults.detectionMethod}</p>
                        )}
                      </div>
                    </div>

                    {/* Affected Areas */}
                    {analysisResults.affectedAreas && analysisResults.affectedAreas.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Analysis Areas</h4>
                        <div className="space-y-3">
                          {analysisResults.affectedAreas.map((area, index) => (
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
                    
                    {analysisResults.metrics && Object.keys(analysisResults.metrics).length > 0 ? (
                      <div className="grid md:grid-cols-3 gap-4">
                        {Object.entries(analysisResults.metrics).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600 mb-1">{value}%</div>
                            <div className="text-sm text-gray-600 capitalize">{key}</div>
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
                        <p>• Texture Assessment: {analysisResults.texture || 'Unknown'}</p>
                        <p>• Overall Condition: {analysisResults.skinCondition || 'Unknown'}</p>
                        <p>• Confidence Level: {analysisResults.confidence || 0}%</p>
                        {analysisResults.geminiSuccess !== undefined && (
                          <p>• AI Processing: {analysisResults.geminiSuccess ? 'Successful' : 'Limited'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === 'recommendations' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">AI Recommendations</h4>
                    
                    {analysisResults.recommendations && analysisResults.recommendations.length > 0 ? (
                      <div className="space-y-3">
                        {analysisResults.recommendations.map((rec, index) => (
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
                    {analysisResults.photoGuidance && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h5 className="font-medium text-yellow-900 mb-3">📸 Photo Guidelines</h5>
                        <div className="space-y-2 text-sm text-yellow-800">
                          {Object.entries(analysisResults.photoGuidance).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium capitalize">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product Suggestions */}
                    {analysisResults.productSuggestions && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h5 className="font-medium text-green-900 mb-3">🛍️ Product Suggestions</h5>
                        <div className="space-y-2 text-sm text-green-800">
                          {Object.entries(analysisResults.productSuggestions).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium capitalize">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lifestyle Tips */}
                    {analysisResults.lifestyleTips && analysisResults.lifestyleTips.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h5 className="font-medium text-purple-900 mb-3">💡 Lifestyle Tips</h5>
                        <div className="space-y-1 text-sm text-purple-800">
                          {analysisResults.lifestyleTips.map((tip, index) => (
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
                    
                    {analysisResults.treatmentPlan && Object.keys(analysisResults.treatmentPlan).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(analysisResults.treatmentPlan).map(([phase, description], index) => (
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
                
                <button
                  onClick={() => {
                    const analysisReport = {
                      ...analysisResults,
                      generatedAt: new Date().toISOString()
                    };
                    // ✅ ใช้ sessionStorage แทน localStorage
                    sessionStorage.setItem('skinai_report_data', JSON.stringify(analysisReport));
                    router.push('/report');
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  disabled={!analysisResults.faceDetected}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
