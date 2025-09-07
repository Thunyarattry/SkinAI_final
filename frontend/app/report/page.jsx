'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ API Error: ${endpoint}`, error);
    throw error;
  }
};

const getAnalysisReport = (analysisId) => {
  return apiCall(`/api/analysis/${analysisId}/report`);
};

const getGeminiRecommendations = (skinAnalysis, prompt = '', language = 'th') => {
  const requestBody = {
    skinAnalysis,
    prompt,
    language,
  };
  return apiCall('/api/gemini/recommendations', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
};

const getGeminiStatus = () => {
  return apiCall('/api/gemini/status');
};

export default function ReportPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [geminiRecommendations, setGeminiRecommendations] = useState(null);
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const [isGettingGemini, setIsGettingGemini] = useState(false);

  const searchParams = useSearchParams();
  const analysisId = searchParams.get('id');

  // 🔄 Load Data
  useEffect(() => {
    const loadData = async () => {
      if (!analysisId) {
        setError('ไม่พบ Analysis ID - กรุณาระบุ ID ในพารามิเตอร์ ?id=your_analysis_id');
        setLoading(false);
        return;
      }

      try {
        // Load report data
        const reportResult = await getAnalysisReport(analysisId);
        if (reportResult.success) {
          setReportData(reportResult.report);
          if (reportResult.report.gemini_recommendations) {
            setGeminiRecommendations(reportResult.report.gemini_recommendations);
          }
        } else {
          throw new Error(reportResult.error || 'Failed to load report');
        }

        // Check Gemini status
        try {
          const geminiResult = await getGeminiStatus();
          setGeminiAvailable(geminiResult.available || false);
        } catch {
          setGeminiAvailable(false);
        }
      } catch (err) {
        setError(`ไม่สามารถโหลดรายงานได้: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [analysisId]);

  // 🤖 Get Gemini Recommendations
  const handleGetGeminiRecommendations = async () => {
    if (!reportData?.skin_analysis || !geminiAvailable) return;

    try {
      setIsGettingGemini(true);

      const result = await getGeminiRecommendations(
        { ...reportData.skin_analysis },
        '',
        'th'
      );

      if (result.success) {
        setGeminiRecommendations(result.recommendations);
      } else {
        throw new Error(result.error || 'Failed to get recommendations');
      }
    } catch (err) {
      setError(`ไม่สามารถสร้างคำแนะนำ AI ได้: ${err.message}`);
    } finally {
      setIsGettingGemini(false);
    }
  };

  // 🔄 Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-700">กำลังโหลดรายงาน...</h2>
          {analysisId && (
            <p className="text-sm text-gray-500 mt-2">Analysis ID: {analysisId}</p>
          )}
        </div>
      </div>
    );
  }

  // ❌ Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-6">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h2>
          <div className="text-gray-600 mb-6 text-left bg-white p-4 rounded border">
            <pre className="whitespace-pre-wrap text-sm">{error}</pre>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              ลองใหม่
            </button>
            <Link
              href="/analysis"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 inline-block"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 📊 Main Content
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <Link href="/analysis" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← กลับไปวิเคราะห์ใหม่
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">รายงานการวิเคราะห์ผิว</h1>
              <p className="text-gray-600">
                สร้างเมื่อ: {new Date(reportData?.created_at).toLocaleDateString('th-TH', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
              <p className="text-sm text-gray-500">Analysis ID: {analysisId}</p>
            </div>
            
            {geminiAvailable && !geminiRecommendations && (
              <button
                onClick={handleGetGeminiRecommendations}
                disabled={isGettingGemini}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {isGettingGemini ? '🤖 กำลังสร้าง...' : '✨ สร้างคำแนะนำ AI'}
              </button>
            )}
          </div>
          
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <span className={`flex items-center space-x-1 ${
              geminiAvailable ? 'text-green-600' : 'text-yellow-600'
            }`}>
              <span>{geminiAvailable ? '🤖' : '⚠️'}</span>
              <span>Gemini AI: {geminiAvailable ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'}</span>
            </span>
          </div>
        </div>

        {/* Skin Analysis */}
        {reportData?.skin_analysis && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🔍 ผลการวิเคราะห์ผิว</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skin Type */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">ประเภทผิว</h3>
                {reportData.skin_analysis.skin_type && (
                  <SkinTypeBadge 
                    type={reportData.skin_analysis.skin_type}
                    confidence={reportData.skin_analysis.confidence}
                  />
                )}
              </div>

              {/* Skin Conditions */}
              {reportData.skin_analysis.conditions && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">สภาพผิว</h3>
                  <div className="space-y-2">
                    {Object.entries(reportData.skin_analysis.conditions).map(([condition, severity]) => (
                      <div key={condition} className="flex justify-between">
                        <span className="text-sm text-gray-600 capitalize">{condition}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          severity === 'high' ? 'bg-red-100 text-red-800' :
                          severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Details */}
            {reportData.skin_analysis.details && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium text-gray-700 mb-2">รายละเอียด</h3>
                <p className="text-gray-600 text-sm">{reportData.skin_analysis.details}</p>
              </div>
            )}
          </div>
        )}

        {/* Standard Recommendations */}
        {reportData?.recommendations && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">💡 คำแนะนำทั่วไป</h2>
            
            {/* Skincare Routine */}
            {reportData.recommendations.skincare_routine && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-3">ขั้นตอนการดูแลผิว</h3>
                <ol className="space-y-2">
                  {reportData.recommendations.skincare_routine.map((step, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Products */}
            {reportData.recommendations.products && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-3">ผลิตภัณฑ์ที่แนะนำ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportData.recommendations.products.map((product, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="font-medium text-gray-800">{product.name}</div>
                      <div className="text-sm text-gray-600">{product.type}</div>
                      {product.reason && (
                        <div className="text-xs text-gray-500 mt-1">{product.reason}</div>
                      )}
                      {product.price_range && (
                        <div className="text-xs text-green-600 mt-1 font-medium">{product.price_range}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {reportData.recommendations.tips && (
              <div>
                <h3 className="font-medium text-gray-700 mb-3">เคล็ดลับการดูแล</h3>
                <ul className="space-y-1">
                  {reportData.recommendations.tips.map((tip, index) => (
                    <li key={index} className="text-gray-700 text-sm flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ✅ Gemini AI Recommendations - รองรับ Response Structure ใหม่ */}
        {geminiRecommendations && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🤖 คำแนะนำจาก AI</h2>

            {/* Immediate Care */}
            {geminiRecommendations.immediate_care && geminiRecommendations.immediate_care.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-red-700 mb-3 flex items-center">
                  🚨 การดูแลเร่งด่วน
                </h3>
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <ul className="space-y-2">
                    {geminiRecommendations.immediate_care.map((item, i) => (
                      <li key={i} className="text-red-800 text-sm flex items-start space-x-2">
                        <span className="text-red-500 mt-1">⚠️</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Daily Skincare */}
            {geminiRecommendations.daily_skincare && geminiRecommendations.daily_skincare.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-blue-700 mb-3 flex items-center">
                  🌅 การดูแลประจำวัน
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <ul className="space-y-2">
                    {geminiRecommendations.daily_skincare.map((item, i) => (
                      <li key={i} className="text-blue-800 text-sm flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">💧</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Products Suggested */}
            {geminiRecommendations.products_suggested && geminiRecommendations.products_suggested.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-green-700 mb-3 flex items-center">
                  🛍️ ผลิตภัณฑ์ที่แนะนำ
                </h3>
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <ul className="space-y-2">
                    {geminiRecommendations.products_suggested.map((item, i) => (
                      <li key={i} className="text-green-800 text-sm flex items-start space-x-2">
                        <span className="text-green-500 mt-1">✨</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Lifestyle Tips */}
            {geminiRecommendations.lifestyle_tips && geminiRecommendations.lifestyle_tips.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-purple-700 mb-3 flex items-center">
                  🌿 การดูแลสุขภาพ
                </h3>
                <div className="bg-purple-50 border border-purple-200 rounded p-4">
                  <ul className="space-y-2">
                    {geminiRecommendations.lifestyle_tips.map((item, i) => (
                      <li key={i} className="text-purple-800 text-sm flex items-start space-x-2">
                        <span className="text-purple-500 mt-1">🏃‍♀️</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Things to Avoid */}
            {geminiRecommendations.avoid && geminiRecommendations.avoid.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-orange-700 mb-3 flex items-center">
                  ⚠️ สิ่งที่ควรหลีกเลี่ยง
                </h3>
                <div className="bg-orange-50 border border-orange-200 rounded p-4">
                  <ul className="space-y-2">
                    {geminiRecommendations.avoid.map((item, i) => (
                      <li key={i} className="text-orange-800 text-sm flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">🚫</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-xs text-gray-500 border-t pt-4">
              <div className="flex justify-between items-center">
                <p>สร้างโดย Google Gemini AI | คำแนะนำเบื้องต้น ควรปรึกษาผู้เชี่ยวชาญ</p>
                <p className="text-gray-400">
                  {new Date().toLocaleDateString('th-TH')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            รายงานนี้สร้างขึ้นโดย SkinAI Analysis System
          </p>
          <p className="text-xs text-gray-500">
            คำแนะนำในรายงานนี้เป็นเพียงข้อมูลเบื้องต้น ควรปรึกษาผู้เชี่ยวชาญด้านผิวหนัง
          </p>
          <div className="mt-3 text-xs text-gray-400">
            {new Date().toLocaleDateString('th-TH')} • ข้อมูลเฉพาะบุคคล
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎨 Skin Type Badge Component
const SkinTypeBadge = ({ type, confidence }) => {
  const getTypeInfo = (type) => {
    const typeMap = {
      'dry': { color: 'bg-yellow-100 text-yellow-800', icon: '🏜️', label: 'ผิวแห้ง' },
      'oily': { color: 'bg-blue-100 text-blue-800', icon: '💧', label: 'ผิวมัน' },
      'combination': { color: 'bg-purple-100 text-purple-800', icon: '🌓', label: 'ผิวผสม' },
      'sensitive': { color: 'bg-red-100 text-red-800', icon: '🌸', label: 'ผิวแพ้ง่าย' },
      'normal': { color: 'bg-green-100 text-green-800', icon: '✨', label: 'ผิวปกติ' }
    };
    return typeMap[type?.toLowerCase()] || { color: 'bg-gray-100 text-gray-800', icon: '❓', label: type };
  };

  const typeInfo = getTypeInfo(type);

  return (
    <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${typeInfo.color}`}>
      <span className="mr-2">{typeInfo.icon}</span>
      {typeInfo.label}
      {confidence && (
        <span className="ml-2 text-xs opacity-75">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </span>
  );
};
