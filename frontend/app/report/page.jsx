'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Simple API helper functions
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const getAnalysis = (analysisId) => apiCall(`/api/analysis/${analysisId}`);
const regenerateRecommendations = (analysisId) => apiCall(`/api/analysis/${analysisId}/regenerate`, { method: 'POST' });

export default function ReportPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    return () => {
      console.log('🧹 Report page unmounted - data cleared');
    };
  }, []);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        // ลองโหลดจาก URL parameter ก่อน
        const analysisId = searchParams.get('id');
        
        if (analysisId) {
          console.log('Loading analysis from API:', analysisId);
          const apiData = await getAnalysis(analysisId);
          
          if (apiData.success) {
            setReportData(apiData);
            return;
          }
        }
        setError('No analysis data found');
        
      } catch (err) {
        console.error('Error loading report data:', err);
        setError(err.message || 'Failed to load analysis data');
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [searchParams]);

  // ✅ PDF Download Function
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      const content = document.getElementById('report-content');
      
      if (content) {
        // สร้างหน้าต่างใหม่สำหรับ print
        const printWindow = window.open('', '_blank');
        
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>SkinAI Report - ${new Date().toLocaleDateString('th-TH')}</title>
                <meta charset="utf-8">
                <style>
                  * { box-sizing: border-box; }
                  body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 20px; 
                    line-height: 1.6;
                    color: #333;
                  }
                  .header { text-align: center; margin-bottom: 30px; }
                  .section { margin-bottom: 25px; padding: 15px; border-radius: 8px; }
                  .bg-blue-50 { background-color: #eff6ff; border-left: 4px solid #3b82f6; }
                  .bg-yellow-50 { background-color: #fefce8; border-left: 4px solid #eab308; }
                  .bg-indigo-50 { background-color: #eef2ff; border-left: 4px solid #6366f1; }
                  .bg-green-50 { background-color: #f0fdf4; border-left: 4px solid #22c55e; }
                  .bg-red-50 { background-color: #fef2f2; border-left: 4px solid #ef4444; }
                  .bg-purple-50 { background-color: #faf5ff; border-left: 4px solid #a855f7; }
                  .bg-orange-50 { background-color: #fff7ed; border-left: 4px solid #f97316; }
                  .bg-gray-100 { background-color: #f3f4f6; border-left: 4px solid #6b7280; }
                  h1 { color: #1f2937; font-size: 28px; margin-bottom: 10px; }
                  h2 { color: #374151; font-size: 20px; margin-bottom: 15px; }
                  h3 { color: #4b5563; font-size: 16px; margin-bottom: 10px; }
                  ul, ol { padding-left: 20px; }
                  li { margin-bottom: 8px; }
                  .grid { display: flex; flex-wrap: wrap; gap: 15px; }
                  .grid > div { flex: 1; min-width: 200px; }
                  .font-semibold { font-weight: 600; }
                  .text-center { text-align: center; }
                  .no-print { display: none; }
                  .timeline-item { 
                    display: flex; 
                    margin-bottom: 10px; 
                    padding-bottom: 8px; 
                    border-bottom: 1px solid #e5e7eb; 
                  }
                  .timeline-time { 
                    font-weight: 600; 
                    min-width: 120px; 
                    color: #7c3aed; 
                  }
                  .timeline-desc { flex: 1; }
                  @media print {
                    body { margin: 0; font-size: 12px; }
                    .section { page-break-inside: avoid; }
                    h1 { font-size: 24px; }
                    h2 { font-size: 18px; }
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>📊 รายงานการดูแลผิวเฉพาะบุคคล</h1>
                  <p>SkinAI Analysis Report - ${new Date().toLocaleDateString('th-TH', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                ${content.innerHTML.replace(/class="no-print[^"]*"/g, 'style="display:none"')}
              </body>
            </html>
          `);
          
          printWindow.document.close();
          
          // รอให้โหลดเสร็จแล้วค่อย print
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Regenerate recommendations
  const handleRegenerateRecommendations = async () => {
    if (!reportData?.analysisId) return;

    try {
      setLoading(true);
      const result = await regenerateRecommendations(reportData.analysisId);
      
      if (result.success) {
        // Update report data with new recommendations
        setReportData(prev => ({
          ...prev,
          recommendations: result.recommendations,
          lastRegenerated: new Date().toISOString()
        }));
        
        // Show success message
        alert('คำแนะนำใหม่ถูกสร้างเรียบร้อยแล้ว!');
      }
    } catch (err) {
      console.error('Error regenerating recommendations:', err);
      alert('เกิดข้อผิดพลาดในการสร้างคำแนะนำใหม่: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดรายงาน...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error ? 'เกิดข้อผิดพลาด' : 'ไม่มีรายงานที่ใช้ได้'}
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'กรุณาทำการวิเคราะห์ผิวก่อน'}
            </p>
            <div className="space-x-4">
              <button
                onClick={() => router.push('/analysis')}
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                ไปวิเคราะห์ผิว
              </button>
              <button
                onClick={() => router.push('/')}
                className="inline-block px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { recommendations, skinAnalysis, faceDetection } = reportData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Auto Clear Notice */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400 no-print">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500">⚠️</span>
            <p className="text-yellow-700 text-sm">
              <strong>หมายเหตุ:</strong> รายงานนี้จะถูกลบทันทีเมื่อออกจากระบบหรือปิดหน้าต่าง
            </p>
          </div>
        </div>

        <div id="report-content" className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">📊 รายงานการดูแลผิวเฉพาะบุคคล</h1>
            
            {/* Action Buttons */}
            <div className="no-print flex space-x-3">
              {reportData?.analysisId && (
                <button
                  onClick={handleRegenerateRecommendations}
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>🔄</span>
                  <span>สร้างคำแนะนำใหม่</span>
                </button>
              )}
              
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>กำลังสร้าง PDF...</span>
                  </>
                ) : (
                  <>
                    <span>📄</span>
                    <span>ดาวน์โหลด PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="section bg-blue-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">สรุปผลการวิเคราะห์</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <span className="font-medium text-blue-800">ประเภทผิว:</span>
                <div className="text-blue-700 font-semibold">{skinAnalysis?.skinType || 'ไม่ระบุ'}</div>
              </div>
              <div>
                <span className="font-medium text-blue-800">ระดับความรุนแรง:</span>
                <div className="text-blue-700 font-semibold">{skinAnalysis?.acneSeverity || 'ไม่ระบุ'}</div>
              </div>
              <div>
                <span className="font-medium text-blue-800">ความแม่นยำ:</span>
                <div className="text-blue-700 font-semibold">{skinAnalysis?.confidence || 0}%</div>
              </div>
            </div>
            
            {/* Face Detection Status */}
            {faceDetection && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center space-x-2">
                  <span className={`text-lg ${faceDetection.detected ? 'text-green-500' : 'text-red-500'}`}>
                    {faceDetection.detected ? '✅' : '❌'}
                  </span>
                  <span className="font-medium text-blue-800">
                    การตรวจจับใบหน้า: {faceDetection.detected ? 'สำเร็จ' : 'ไม่สำเร็จ'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Problems Found */}
          {skinAnalysis?.detectedIssues && skinAnalysis.detectedIssues.length > 0 && (
            <div className="section bg-orange-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-orange-900 mb-4">🔍 ปัญหาผิวที่พบ</h2>
              <ul className="list-disc list-inside space-y-2">
                {skinAnalysis.detectedIssues.map((problem, index) => (
                  <li key={index} className="text-orange-700">{problem}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Backend Recommendations */}
          {recommendations && (
            <>
              {/* Skin Type Assessment */}
              {recommendations.skinType && (
                <div className="section bg-indigo-50 p-6 rounded-lg mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🔬</span>
                    การประเมินประเภทผิว
                  </h2>
                  <p className="text-gray-700 leading-relaxed">{recommendations.skinType}</p>
                </div>
              )}

              {/* Condition Assessment */}
              {recommendations.conditionAssessment && (
                <div className="section bg-yellow-50 p-6 rounded-lg mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📋</span>
                    การประเมินสภาพผิว
                  </h2>
                  <p className="text-gray-700 leading-relaxed">{recommendations.conditionAssessment}</p>
                </div>
              )}

              {/* Skincare Recommendations */}
              {recommendations.skincareRecommendations && (
                <div className="section bg-green-50 p-6 rounded-lg mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🧴</span>
                    คำแนะนำการดูแลผิว
                  </h2>
                  <ul className="list-disc list-inside space-y-3">
                    {recommendations.skincareRecommendations.map((recommendation, index) => (
                      <li key={index} className="text-gray-700 leading-relaxed">{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lifestyle Recommendations */}
              {recommendations.lifestyleRecommendations && (
                <div className="section bg-purple-50 p-6 rounded-lg mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🏃‍♀️</span>
                    คำแนะนำการดำเนินชีวิต
                  </h2>
                  <ul className="list-disc list-inside space-y-3">
                    {recommendations.lifestyleRecommendations.map((recommendation, index) => (
                      <li key={index} className="text-gray-700 leading-relaxed">{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dermatologist Advice */}
              {recommendations.dermatologistAdvice && (
                <div className="section bg-red-50 p-6 rounded-lg mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">👩‍⚕️</span>
                    คำแนะนำจากแพทย์ผิวหนัง
                  </h2>
                  <p className="text-gray-700 leading-relaxed">{recommendations.dermatologistAdvice}</p>
                </div>
              )}

              {/* Improvement Timeline */}
              {recommendations.improvementTimeline && (
                <div className="section bg-gray-100 p-6 rounded-lg mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📅</span>
                    ระยะเวลาที่คาดหวัง
                  </h2>
                  <p className="text-gray-700 leading-relaxed">{recommendations.improvementTimeline}</p>
                </div>
              )}
            </>
          )}

          {/* Fallback if no recommendations */}
          {!recommendations && (
            <div className="section bg-yellow-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4">⚠️ คำแนะนำทั่วไป</h2>
              <ul className="list-disc list-inside space-y-2 text-yellow-700">
                <li>ล้างหน้าด้วยผลิตภัณฑ์อ่อนโยน 2 ครั้งต่อวัน</li>
                <li>ทาครีมกันแดดทุกวัน SPF 30 ขึ้นไป</li>
                <li>ใช้ครีมบำรุงที่เหมาะกับประเภทผิว</li>
                <li>ดื่มน้ำให้เพียงพอ อย่างน้อย 8 แก้วต่อวัน</li>
                <li>หลีกเลี่ยงการสัมผัสหน้าด้วยมือที่ไม่สะอาด</li>
              </ul>
            </div>
          )}

          {/* Analysis Details */}
          {skinAnalysis?.analysisDetails && (
            <div className="section bg-gray-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🔍 รายละเอียดการวิเคราะห์</h2>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(skinAnalysis.analysisDetails, null, 2)}
              </pre>
            </div>
          )}

          {/* Disclaimer */}
          <div className="section bg-gray-100 p-6 rounded-lg border-l-4 border-gray-400">
            <h3 className="font-semibold text-gray-800 mb-2">⚠️ ข้อจำกัดความรับผิดชอบ</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              รายงานนี้เป็นเพียงการวิเคราะห์เบื้องต้นด้วยเทคโนโลยี AI และไม่สามารถทดแทนการตรวจวินิจฉัยโดยแพทย์ผิวหนังได้ 
              หากมีปัญหาผิวหนังร้ายแรงหรือไม่ดีขึ้น กรุณาปรึกษาแพทย์ผิวหนังโดยตรง
            </p>
            
            {reportData.timestamp && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-xs text-gray-500">
                  รายงานสร้างเมื่อ: {new Date(reportData.timestamp).toLocaleString('th-TH')}
                  {reportData.lastRegenerated && (
                    <span className="ml-4">
                      อัปเดตล่าสุด: {new Date(reportData.lastRegenerated).toLocaleString('th-TH')}
                    </span>
                  )}
                </p>
                {reportData.analysisId && (
                  <p className="text-xs text-gray-500 mt-1">
                    รหัสการวิเคราะห์: {reportData.analysisId}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center mt-8 no-print">
          <div className="space-x-4">
            <button
              onClick={() => router.push('/analysis')}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              วิเคราะห์ใหม่
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              กลับสู่หน้าหลัก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
