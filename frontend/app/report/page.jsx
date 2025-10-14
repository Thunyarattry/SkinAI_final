// "use client";

// import { useState, useEffect } from "react";
// import { useSearchParams } from "next/navigation";
// import Link from "next/link";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// const apiCall = async (endpoint, options = {}) => {
//   const url = `${API_BASE_URL}${endpoint}`;

//   const defaultOptions = {
//     method: "GET",
//     headers: {
//       Accept: "application/json",
//       "Content-Type": "application/json",
//       ...options.headers,
//     },
//     ...options,
//   };

//   try {
//     const response = await fetch(url, defaultOptions);

//     if (!response.ok) {
//       let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
//       try {
//         const errorData = await response.json();
//         errorMessage =
//           errorData.error ||
//           errorData.message ||
//           errorData.detail ||
//           errorMessage;
//       } catch {}
//       throw new Error(errorMessage);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error(`❌ API Error: ${endpoint}`, error);
//     throw error;
//   }
// };

// const getAnalysisReport = (analysisId) => {
//   return apiCall(`/api/analysis/${analysisId}/report`);
// };

// const getGeminiRecommendations = (
//   skinAnalysis,
//   prompt = "",
//   language = "th"
// ) => {
//   const requestBody = {
//     skinAnalysis,
//     prompt,
//     language,
//   };
//   return apiCall("/api/gemini/recommendations", {
//     method: "POST",
//     body: JSON.stringify(requestBody),
//   });
// };

// const getGeminiStatus = () => {
//   return apiCall("/api/gemini/status");
// };

// // 🎨 Helper Functions
// const getIssueLabel = (issue) => {
//   const issueMap = {
//     acne: "สิว",
//     blemishes: "สิว",
//     texture_variation: "ผิวขรุขระ",
//     redness: "ผิวแดง",
//     dark_spots: "จุดด่างดำ",
//     wrinkles: "ริ้วรอย",
//     dryness: "ผิวแห้ง",
//     oiliness: "ผิวมัน",
//     pores: "รูขุมขน",
//     blackheads: "หัวดำ",
//     whiteheads: "หัวขาว",
//   };
//   return issueMap[issue?.toLowerCase()] || issue;
// };

// const getHealthCategoryLabel = (category) => {
//   const categoryMap = {
//     excellent: "ดีเยี่ยม",
//     good: "ดี",
//     fair: "พอใช้",
//     needs_attention: "ต้องดูแล",
//     poor: "แย่",
//     mild: "เล็กน้อย",
//     moderate: "ปานกลาง",
//     severe: "รุนแรง",
//   };
//   return categoryMap[category?.toLowerCase()] || category;
// };

// // ✅ Helper function to normalize data structure - แก้ไขใหม่
// const normalizeReportData = (rawData) => {
//   // ถ้าเป็น structure ใหม่ (จาก upload API)
//   if (rawData.skinAnalysis && rawData.recommendations) {
//     const skinAnalysis = rawData.skinAnalysis;
//     const recommendations = rawData.recommendations;

//     // ✅ แก้ไขการดึงข้อมูล skin_type
//     const getSkinType = () => {
//       // ลองหาจากหลายที่
//       if (recommendations?.clinicalDiagnosis?.skinType) {
//         return recommendations.clinicalDiagnosis.skinType;
//       }
//       if (skinAnalysis?.detection_details?.skin_type) {
//         return skinAnalysis.detection_details.skin_type;
//       }
//       if (recommendations?.skinType) {
//         return recommendations.skinType;
//       }
//       if (skinAnalysis?.skin_type) {
//         return skinAnalysis.skin_type;
//       }
//       return "ไม่ระบุ";
//     };

//     // ✅ แก้ไขการดึงข้อมูล severity
//     const getSeverity = () => {
//       if (recommendations?.clinicalDiagnosis?.severityLevel) {
//         return recommendations.clinicalDiagnosis.severityLevel;
//       }
//       if (skinAnalysis?.overall_health?.health_category) {
//         return skinAnalysis.overall_health.health_category;
//       }
//       if (recommendations?.severity) {
//         return recommendations.severity;
//       }
//       if (skinAnalysis?.severity_level) {
//         return skinAnalysis.severity_level;
//       }
//       return "ไม่ทราบ";
//     };

//     // ✅ แก้ไขการดึงข้อมูล primary_condition
//     const getPrimaryCondition = () => {
//       if (recommendations?.clinicalDiagnosis?.primaryConditions?.length > 0) {
//         return recommendations.clinicalDiagnosis.primaryConditions[0];
//       }
//       if (skinAnalysis?.detectedIssues?.length > 0) {
//         return getIssueLabel(skinAnalysis.detectedIssues[0]);
//       }
//       if (recommendations?.conditionAssessment) {
//         return recommendations.conditionAssessment;
//       }
//       return "ผิวปกติ";
//     };

//     // ✅ แก้ไขการคำนวณ confidence
//     const getConfidence = () => {
//       if (skinAnalysis?.overall_health?.health_score) {
//         return skinAnalysis.overall_health.health_score;
//       }
//       if (skinAnalysis?.total_detections && skinAnalysis.total_detections <= 100) {
//         return skinAnalysis.total_detections;
//       }
//       if (skinAnalysis?.confidence_score) {
//         return skinAnalysis.confidence_score * 100;
//       }
//       return 75; // default confidence
//     };

//     return {
//       analysisId: rawData.analysisId,
//       created_at: rawData.timestamp,

//       // ✅ Normalize skin analysis - แก้ไขใหม่
//       skin_analysis: {
//         skin_type: getSkinType(),
//         primary_condition: getPrimaryCondition(),
//         severity_level: getSeverity(),
//         confidence_score: getConfidence() / 100,
//         confidence: getConfidence(),
//         conditions: skinAnalysis.detectionCounts || {},
//         details: `ตรวจพบปัญหา ${
//           skinAnalysis.detectedIssues?.length || 0
//         } ประเภท: ${skinAnalysis.detectedIssues?.join(", ") || "ไม่มี"}`,
//         analysis_method: skinAnalysis.analysis_method || "Enhanced Analysis",
//         detected_issues: skinAnalysis.detectedIssues || [],
//         detection_counts: skinAnalysis.detectionCounts || {},
//         overall_health: skinAnalysis.overall_health || {
//           health_score: getConfidence(),
//           health_category: getSeverity()
//         },
//       },

//       // ✅ Normalize recommendations
//       recommendations: {
//         skincare_routine: recommendations.skincareRecommendations || 
//           recommendations.treatmentPlan?.immediateAction || [],
//         products: recommendations.productRecommendations
//           ? [
//               {
//                 name: recommendations.productRecommendations.cleanser || "ผลิตภัณฑ์ทำความสะอาด",
//                 type: "Cleanser",
//                 reason: "สำหรับทำความสะอาดผิว",
//               },
//               {
//                 name: recommendations.productRecommendations.treatment || "ผลิตภัณฑ์รักษา",
//                 type: "Treatment",
//                 reason: "สำหรับรักษาปัญหาผิว",
//               },
//               {
//                 name: recommendations.productRecommendations.moisturizer || "ครีมบำรุง",
//                 type: "Moisturizer",
//                 reason: "สำหรับบำรุงผิว",
//               },
//             ]
//           : [],
//         tips: recommendations.lifestyleRecommendations || 
//           recommendations.lifestyleModifications?.dietary || [],
//       },

//       // ✅ Images
//       image_url: rawData.originalImage
//         ? `${API_BASE_URL}${rawData.originalImage}`
//         : null,
//       cropped_image_url: rawData.croppedImage
//         ? `${API_BASE_URL}${rawData.croppedImage}`
//         : null,
//       face_detected: rawData.faceDetection?.detected || false,

//       // ✅ Gemini recommendations
//       gemini_recommendations: rawData.geminiSuccess ? recommendations : null,
//       gemini_success: rawData.geminiSuccess || false,
//       gemini_error: rawData.geminiError || null,
//     };
//   }

//   // ถ้าเป็น structure เก่า (จาก report API)
//   return rawData;
// };

// // 🎨 Skin Type Badge Component - แก้ไขใหม่
// const SkinTypeBadge = ({ type, confidence }) => {
//   const getTypeInfo = (type) => {
//     // ✅ แก้ไขการ mapping ให้ครอบคลุมมากขึ้น
//     const typeMap = {
//       dry: {
//         color: "bg-yellow-100 text-yellow-800",
//         icon: "🏜️",
//         label: "ผิวแห้ง",
//       },
//       oily: { 
//         color: "bg-blue-100 text-blue-800", 
//         icon: "💧", 
//         label: "ผิวมัน" 
//       },
//       combination: {
//         color: "bg-purple-100 text-purple-800",
//         icon: "🌓",
//         label: "ผิวผสม",
//       },
//       sensitive: {
//         color: "bg-red-100 text-red-800",
//         icon: "🌸",
//         label: "ผิวแพ้ง่าย",
//       },
//       normal: {
//         color: "bg-green-100 text-green-800",
//         icon: "✨",
//         label: "ผิวปกติ",
//       },
//       // ✅ เพิ่ม mapping สำหรับค่าจาก backend
//       "normal to combination": {
//         color: "bg-purple-100 text-purple-800",
//         icon: "🌓",
//         label: "ผิวปกติถึงผสม",
//       },
//       "normal_to_dry": {
//         color: "bg-yellow-100 text-yellow-800",
//         icon: "🏜️",
//         label: "ผิวปกติถึงแห้ง",
//       },
//       "combination_oily": {
//         color: "bg-blue-100 text-blue-800",
//         icon: "💧",
//         label: "ผิวผสมมัน",
//       },
//       unknown: {
//         color: "bg-gray-100 text-gray-800",
//         icon: "❓",
//         label: "ไม่ระบุ",
//       }
//     };
    
//     // ✅ ตรวจสอบค่าที่ได้รับ
//     const normalizedType = type?.toString().toLowerCase().trim();
//     return typeMap[normalizedType] || {
//       color: "bg-gray-100 text-gray-800",
//       icon: "❓",
//       label: type || "ไม่ระบุ",
//     };
//   };

//   const typeInfo = getTypeInfo(type);
  
//   // ✅ แก้ไขการแสดง confidence
//   const displayConfidence = () => {
//     if (typeof confidence === 'number' && confidence > 0 && confidence <= 100) {
//       return `(${Math.round(confidence)}%)`;
//     }
//     if (typeof confidence === 'number' && confidence > 100) {
//       // ถ้าค่ามากกว่า 100 อาจเป็น raw score ให้หารด้วย 100
//       return `(${Math.round(confidence / 100)}%)`;
//     }
//     return ''; // ไม่แสดงถ้าไม่มีค่าที่เหมาะสม
//   };

//   return (
//     <span
//       className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${typeInfo.color}`}
//     >
//       <span className="mr-2">{typeInfo.icon}</span>
//       {typeInfo.label}
//       <span className="ml-2 text-xs opacity-75">
//         {displayConfidence()}
//       </span>
//     </span>
//   );
// };

// // 🎨 Severity Badge Component - แก้ไขใหม่
// const SeverityBadge = ({ severity }) => {
//   const getSeverityInfo = (severity) => {
//     const severityMap = {
//       good: { color: "bg-green-100 text-green-800", icon: "✅", label: "ดี" },
//       excellent: { color: "bg-green-100 text-green-800", icon: "✅", label: "ดีเยี่ยม" },
//       mild: {
//         color: "bg-yellow-100 text-yellow-800",
//         icon: "⚠️",
//         label: "เล็กน้อย",
//       },
//       moderate: {
//         color: "bg-orange-100 text-orange-800",
//         icon: "🔶",
//         label: "ปานกลาง",
//       },
//       severe: { 
//         color: "bg-red-100 text-red-800", 
//         icon: "🔴", 
//         label: "รุนแรง" 
//       },
//       // ✅ เพิ่ม mapping สำหรับค่าจาก backend
//       "needs_attention": {
//         color: "bg-orange-100 text-orange-800",
//         icon: "🔶",
//         label: "ต้องดูแล",
//       },
//       fair: {
//         color: "bg-yellow-100 text-yellow-800",
//         icon: "⚠️",
//         label: "พอใช้",
//       },
//       poor: {
//         color: "bg-red-100 text-red-800",
//         icon: "🔴",
//         label: "แย่",
//       },
//       unknown: {
//         color: "bg-gray-100 text-gray-800",
//         icon: "❓",
//         label: "ไม่ทราบ",
//       },
//     };
    
//     // ✅ ตรวจสอบค่าที่ได้รับ
//     const normalizedSeverity = severity?.toString().toLowerCase().trim();
//     return severityMap[normalizedSeverity] || {
//       color: "bg-gray-100 text-gray-800",
//       icon: "❓",
//       label: severity || "ไม่ระบุ",
//     };
//   };

//   const severityInfo = getSeverityInfo(severity);

//   return (
//     <span
//       className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${severityInfo.color}`}
//     >
//       <span className="mr-2">{severityInfo.icon}</span>
//       {severityInfo.label}
//     </span>
//   );
// };

// export default function ReportPage() {
//   const [reportData, setReportData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [geminiRecommendations, setGeminiRecommendations] = useState(null);
//   const [geminiAvailable, setGeminiAvailable] = useState(false);
//   const [isGettingGemini, setIsGettingGemini] = useState(false);

//   const searchParams = useSearchParams();
//   const analysisId = searchParams.get("id");

//   // 🔄 Load Data
//   useEffect(() => {
//     const loadData = async () => {
//       if (!analysisId) {
//         setError(
//           "ไม่พบ Analysis ID - กรุณาระบุ ID ในพารามิเตอร์ ?id=your_analysis_id"
//         );
//         setLoading(false);
//         return;
//       }

//       try {
//         // ✅ ลองโหลดจาก sessionStorage ก่อน (จากหน้า Analysis)
//         const sessionReportData = sessionStorage.getItem(
//           "current_analysis_report"
//         );

//         if (sessionReportData) {
//           const parsedData = JSON.parse(sessionReportData);

//           if (parsedData.analysisId === analysisId) {
//             // ✅ Normalize data structure
//             const normalizedData = normalizeReportData(parsedData);
//             setReportData(normalizedData);

//             // ✅ Set Gemini recommendations if available
//             if (normalizedData.gemini_recommendations) {
//               setGeminiRecommendations(normalizedData.gemini_recommendations);
//             }

//             // Check Gemini status
//             try {
//               const geminiResult = await getGeminiStatus();
//               setGeminiAvailable(geminiResult.available || false);
//             } catch {
//               setGeminiAvailable(false);
//             }

//             setLoading(false);
//             return;
//           }
//         }

//         // ถ้าไม่มีใน sessionStorage หรือ ID ไม่ตรง ให้ลองเรียก API
//         try {
//           const reportResult = await getAnalysisReport(analysisId);
//           if (reportResult.success) {
//             const normalizedData = normalizeReportData(reportResult.report);
//             setReportData(normalizedData);

//             if (normalizedData.gemini_recommendations) {
//               setGeminiRecommendations(normalizedData.gemini_recommendations);
//             }
//           } else {
//             throw new Error(reportResult.error || "Failed to load report");
//           }
//         } catch (apiError) {
//           // ถ้า API ล้มเหลว ให้ลองหาจาก localStorage history
//           try {
//             const historyStr = localStorage.getItem("skinai_history");
//             if (historyStr) {
//               const history = JSON.parse(historyStr);
//               const foundAnalysis = history.find(
//                 (item) => item.id === analysisId
//               );

//               if (foundAnalysis) {
//                 const convertedReport = {
//                   analysisId: foundAnalysis.id,
//                   created_at: foundAnalysis.ts,
//                   skin_analysis: {
//                     skin_type: foundAnalysis.skinType || "Unknown",
//                     primary_condition: foundAnalysis.skinCondition || "Unknown",
//                     severity_level: foundAnalysis.severity || "Unknown",
//                     confidence_score: (foundAnalysis.severityScore || 0) / 100,
//                     confidence: foundAnalysis.severityScore || 0,
//                     conditions: {},
//                     details: "Analysis from history",
//                     analysis_method:
//                       foundAnalysis.analysisMethod || "Standard Analysis",
//                   },
//                   recommendations: {
//                     skincare_routine: foundAnalysis.recommendations || [
//                       "ทำความสะอาดผิวหน้าด้วยผลิตภัณฑ์อ่อนโยน",
//                       "ใช้ครีมบำรุงที่เหมาะกับประเภทผิว",
//                       "ทาครีมกันแดดทุกวัน",
//                     ],
//                     products: [],
//                     tips: [],
//                   },
//                   image_url: foundAnalysis.image,
//                   face_detected: foundAnalysis.faceDetected || false,
//                 };

//                 setReportData(convertedReport);
//                 setLoading(false);
//                 return;
//               }
//             }

//             throw new Error(`ไม่พบข้อมูลการวิเคราะห์สำหรับ ID: ${analysisId}`);
//           } catch (historyError) {
//             throw apiError;
//           }
//         }

//         // Check Gemini status
//         try {
//           const geminiResult = await getGeminiStatus();
//           setGeminiAvailable(geminiResult.available || false);
//         } catch {
//           setGeminiAvailable(false);
//         }
//       } catch (err) {
//         console.error("Error loading report:", err);
//         setError(`ไม่สามารถโหลดรายงานได้: ${err.message}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, [analysisId]);

//   // 🤖 Get Gemini Recommendations
//   const handleGetGeminiRecommendations = async () => {
//     if (!reportData?.skin_analysis || !geminiAvailable) return;

//     try {
//       setIsGettingGemini(true);

//       const result = await getGeminiRecommendations(
//         { ...reportData.skin_analysis },
//         "",
//         "th"
//       );

//       if (result.success) {
//         setGeminiRecommendations(result.recommendations);

//         const updatedReportData = {
//           ...reportData,
//           gemini_recommendations: result.recommendations,
//         };
//         sessionStorage.setItem(
//           "current_analysis_report",
//           JSON.stringify(updatedReportData)
//         );
//       } else {
//         throw new Error(result.error || "Failed to get recommendations");
//       }
//     } catch (err) {
//       setError(`ไม่สามารถสร้างคำแนะนำ AI ได้: ${err.message}`);
//     } finally {
//       setIsGettingGemini(false);
//     }
//   };

//   // 🔄 Loading State
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <h2 className="text-lg font-medium text-gray-700">
//             กำลังโหลดรายงาน...
//           </h2>
//           {analysisId && (
//             <p className="text-sm text-gray-500 mt-2">
//               Analysis ID: {analysisId}
//             </p>
//           )}
//         </div>
//       </div>
//     );
//   }

//   // ❌ Error State
//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center max-w-2xl mx-auto p-6">
//           <div className="text-4xl mb-4">❌</div>
//           <h2 className="text-xl font-bold text-red-600 mb-4">
//             เกิดข้อผิดพลาด
//           </h2>
//           <div className="text-gray-600 mb-6 text-left bg-white p-4 rounded border">
//             <pre className="whitespace-pre-wrap text-sm">{error}</pre>
//           </div>
//           <div className="space-x-4">
//             <button
//               onClick={() => window.location.reload()}
//               className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//             >
//               ลองใหม่
//             </button>
//             <Link
//               href="/analysis"
//               className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 inline-block"
//             >
//               กลับหน้าหลัก
//             </Link>
//             <Link
//               href="/history"
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
//             >
//               ดูประวัติ
//             </Link>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // 📊 Main Content
//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="container mx-auto px-4 py-8 max-w-4xl">
//         {/* Header */}
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <div className="flex items-center gap-4 mb-4">
//             <Link
//               href="/analysis"
//               className="text-blue-600 hover:text-blue-800"
//             >
//               ← กลับไปวิเคราะห์ใหม่
//             </Link>
//             <span className="text-gray-300">|</span>
//             <Link href="/history" className="text-blue-600 hover:text-blue-800">
//               ดูประวัติทั้งหมด
//             </Link>
//           </div>

//           <div className="flex justify-between items-start">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900 mb-2">
//                 รายงานการวิเคราะห์ผิว
//               </h1>
//               <p className="text-gray-600">
//                 สร้างเมื่อ:{" "}
//                 {new Date(reportData?.created_at).toLocaleDateString("th-TH", {
//                   year: "numeric",
//                   month: "long",
//                   day: "numeric",
//                   hour: "2-digit",
//                   minute: "2-digit",
//                 })}
//               </p>
//               <p className="text-sm text-gray-500">Analysis ID: {analysisId}</p>
//             </div>

//             {geminiAvailable && !geminiRecommendations && (
//               <button
//                 onClick={handleGetGeminiRecommendations}
//                 disabled={isGettingGemini}
//                 className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
//               >
//                 {isGettingGemini ? "🤖 กำลังสร้าง..." : "✨ สร้างคำแนะนำ AI"}
//               </button>
//             )}
//           </div>

//           <div className="mt-4 flex items-center space-x-4 text-sm">
//             <span
//               className={`flex items-center space-x-1 ${
//                 geminiAvailable ? "text-green-600" : "text-yellow-600"
//               }`}
//             >
//               <span>{geminiAvailable ? "🤖" : "⚠️"}</span>
//               <span>
//                 Gemini AI: {geminiAvailable ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน"}
//               </span>
//             </span>

//             {reportData?.face_detected && (
//               <span className="flex items-center space-x-1 text-green-600">
//                 <span>✅</span>
//                 <span>Face Detected</span>
//               </span>
//             )}

//             {reportData?.gemini_success && (
//               <span className="flex items-center space-x-1 text-purple-600">
//                 <span>🤖</span>
//                 <span>AI Enhanced</span>
//               </span>
//             )}
//           </div>
//         </div>

//             {/* ✅ Health Score (ใหม่)
//             {reportData.skin_analysis.overall_health && (
//               <div className="mt-6 p-4 bg-gray-50 rounded">
//                 <h3 className="font-medium text-gray-700 mb-2">
//                   คะแนนสุขภาพผิว
//                 </h3>
//                 <div className="flex items-center space-x-4">
//                   <div className="flex-1 bg-gray-200 rounded-full h-3">
//                     <div
//                       className={`h-3 rounded-full ${
//                         reportData.skin_analysis.overall_health.health_score >=
//                         70
//                           ? "bg-green-500"
//                           : reportData.skin_analysis.overall_health
//                               .health_score >= 40
//                           ? "bg-yellow-500"
//                           : "bg-red-500"
//                       }`}
//                       style={{
//                         width: `${
//                           reportData.skin_analysis.overall_health
//                             .health_score || 0
//                         }%`,
//                       }}
//                     ></div>
//                   </div>
//                   <span className="text-sm font-medium text-gray-700">
//                     {reportData.skin_analysis.overall_health.health_score || 0}
//                     /100
//                   </span>
//                 </div>
//                 <p className="text-sm text-gray-600 mt-2">
//                   สถานะ:{" "}
//                   {getHealthCategoryLabel(
//                     reportData.skin_analysis.overall_health.health_category
//                   )}
//                 </p>
//               </div>
//             )} */}

//             {/* Analysis Details
//             {reportData.skin_analysis.details && (
//               <div className="mt-4 p-4 bg-gray-50 rounded">
//                 <h3 className="font-medium text-gray-700 mb-2">รายละเอียด</h3>
//                 <p className="text-gray-600 text-sm">
//                   {reportData.skin_analysis.details}
//                 </p>
//               </div>
//             )}
//           </div> */}
//         {/* )} */}

//         {/* ✅ Gemini AI Recommendations - รองรับ Structure ใหม่ */}
//         {(geminiRecommendations || reportData?.gemini_recommendations) && (
//           <div className="bg-white rounded-lg shadow p-6 mb-6">
//             <h2 className="text-xl font-semibold text-gray-900 mb-4">
//               🤖 คำแนะนำจาก AI
//             </h2>

//             {(() => {
//               const recommendations =
//                 geminiRecommendations || reportData.gemini_recommendations;

//               // ✅ รองรับ structure ใหม่จาก Backend
//               if (recommendations.skincareRecommendations) {
//                 return (
//                   <div className="space-y-6">
//                     {/* Skin Type & Assessment */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div className="p-4 bg-blue-50 border border-blue-200 rounded">
//                         <h3 className="font-medium text-blue-700 mb-2">
//                           ประเภทผิว
//                         </h3>
//                         <p className="text-blue-800 text-sm">
//                           {recommendations.skinType}
//                         </p>
//                       </div>
//                       <div className="p-4 bg-purple-50 border border-purple-200 rounded">
//                         <h3 className="font-medium text-purple-700 mb-2">
//                           ระดับความรุนแรง
//                         </h3>
//                         <SeverityBadge severity={recommendations.severity} />
//                       </div>
//                     </div>

//                     {/* Condition Assessment */}
//                     <div className="p-4 bg-gray-50 border border-gray-200 rounded">
//                       <h3 className="font-medium text-gray-700 mb-2">
//                         การประเมินสภาพผิว
//                       </h3>
//                       <p className="text-gray-700 text-sm leading-relaxed">
//                         {recommendations.conditionAssessment}
//                       </p>
//                     </div>

//                     {/* Skincare Recommendations */}
//                     {recommendations.skincareRecommendations &&
//                       recommendations.skincareRecommendations.length > 0 && (
//                         <div>
//                           <h3 className="font-medium text-green-700 mb-3 flex items-center">
//                             🌿 คำแนะนำการดูแลผิว
//                           </h3>
//                           <div className="bg-green-50 border border-green-200 rounded p-4">
//                             <ol className="space-y-3">
//                               {recommendations.skincareRecommendations.map(
//                                 (item, i) => (
//                                   <li
//                                     key={i}
//                                     className="text-green-800 text-sm flex items-start space-x-3"
//                                   >
//                                     <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
//                                       {i + 1}
//                                     </span>
//                                     <span className="leading-relaxed">
//                                       {item}
//                                     </span>
//                                   </li>
//                                 )
//                               )}
//                             </ol>
//                           </div>
//                         </div>
//                       )}

//                     {/* Product Recommendations */}
//                     {recommendations.productRecommendations && (
//                       <div>
//                         <h3 className="font-medium text-blue-700 mb-3 flex items-center">
//                           🛍️ ผลิตภัณฑ์ที่แนะนำ
//                         </h3>
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                           {recommendations.productRecommendations.cleanser && (
//                             <div className="p-4 bg-blue-50 border border-blue-200 rounded">
//                               <h4 className="font-medium text-blue-700 mb-2">
//                                 🧼 ทำความสะอาด
//                               </h4>
//                               <p className="text-blue-800 text-xs leading-relaxed">
//                                 {
//                                   recommendations.productRecommendations
//                                     .cleanser
//                                 }
//                               </p>
//                             </div>
//                           )}
//                           {recommendations.productRecommendations.treatment && (
//                             <div className="p-4 bg-purple-50 border border-purple-200 rounded">
//                               <h4 className="font-medium text-purple-700 mb-2">
//                                 💊 รักษา
//                               </h4>
//                               <p className="text-purple-800 text-xs leading-relaxed">
//                                 {
//                                   recommendations.productRecommendations
//                                     .treatment
//                                 }
//                               </p>
//                             </div>
//                           )}
//                           {recommendations.productRecommendations
//                             .moisturizer && (
//                             <div className="p-4 bg-green-50 border border-green-200 rounded">
//                               <h4 className="font-medium text-green-700 mb-2">
//                                 💧 บำรุง
//                               </h4>
//                               <p className="text-green-800 text-xs leading-relaxed">
//                                 {
//                                   recommendations.productRecommendations
//                                     .moisturizer
//                                 }
//                               </p>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     )}

//                     {/* Lifestyle Recommendations */}
//                     {recommendations.lifestyleRecommendations &&
//                       recommendations.lifestyleRecommendations.length > 0 && (
//                         <div>
//                           <h3 className="font-medium text-orange-700 mb-3 flex items-center">
//                             🏃‍♀️ คำแนะนำการดูแลสุขภาพ
//                           </h3>
//                           <div className="bg-orange-50 border border-orange-200 rounded p-4">
//                             <ul className="space-y-2">
//                               {recommendations.lifestyleRecommendations.map(
//                                 (item, i) => (
//                                   <li
//                                     key={i}
//                                     className="text-orange-800 text-sm flex items-start space-x-2"
//                                   >
//                                     <span className="text-orange-500 mt-1">
//                                       🏃‍♀️
//                                     </span>
//                                     <span>{item}</span>
//                                   </li>
//                                 )
//                               )}
//                             </ul>
//                           </div>
//                         </div>
//                       )}
//                   </div>
//                 );
//               }

//               // ✅ รองรับ structure เก่า (ถ้ามี)
//               return (
//                 <div className="space-y-6">
//                   {/* Immediate Care */}
//                   {recommendations.immediate_care &&
//                     recommendations.immediate_care.length > 0 && (
//                       <div>
//                         <h3 className="font-medium text-red-700 mb-3 flex items-center">
//                           🚨 การดูแลเร่งด่วน
//                         </h3>
//                         <div className="bg-red-50 border border-red-200 rounded p-4">
//                           <ul className="space-y-2">
//                             {recommendations.immediate_care.map((item, i) => (
//                               <li
//                                 key={i}
//                                 className="text-red-800 text-sm flex items-start space-x-2"
//                               >
//                                 <span className="text-red-500 mt-1">⚠️</span>
//                                 <span>{item}</span>
//                               </li>
//                             ))}
//                           </ul>
//                         </div>
//                       </div>
//                     )}

//                   {/* Daily Skincare */}
//                   {recommendations.daily_skincare &&
//                     recommendations.daily_skincare.length > 0 && (
//                       <div>
//                         <h3 className="font-medium text-blue-700 mb-3 flex items-center">
//                           🌅 การดูแลประจำวัน
//                         </h3>
//                         <div className="bg-blue-50 border border-blue-200 rounded p-4">
//                           <ul className="space-y-2">
//                             {recommendations.daily_skincare.map((item, i) => (
//                               <li
//                                 key={i}
//                                 className="text-blue-800 text-sm flex items-start space-x-2"
//                               >
//                                 <span className="text-blue-500 mt-1">💧</span>
//                                 <span>{item}</span>
//                               </li>
//                             ))}
//                           </ul>
//                         </div>
//                       </div>
//                     )}

//                   {/* Products Suggested */}
//                   {recommendations.products_suggested &&
//                     recommendations.products_suggested.length > 0 && (
//                       <div>
//                         <h3 className="font-medium text-green-700 mb-3 flex items-center">
//                           🛍️ ผลิตภัณฑ์ที่แนะนำ
//                         </h3>
//                         <div className="bg-green-50 border border-green-200 rounded p-4">
//                           <ul className="space-y-2">
//                             {recommendations.products_suggested.map(
//                               (item, i) => (
//                                 <li
//                                   key={i}
//                                   className="text-green-800 text-sm flex items-start space-x-2"
//                                 >
//                                   <span className="text-green-500 mt-1">
//                                     ✨
//                                   </span>
//                                   <span>{item}</span>
//                                 </li>
//                               )
//                             )}
//                           </ul>
//                         </div>
//                       </div>
//                     )}

//                   {/* Lifestyle Tips */}
//                   {recommendations.lifestyle_tips &&
//                     recommendations.lifestyle_tips.length > 0 && (
//                       <div>
//                         <h3 className="font-medium text-purple-700 mb-3 flex items-center">
//                           🌿 การดูแลสุขภาพ
//                         </h3>
//                         <div className="bg-purple-50 border border-purple-200 rounded p-4">
//                           <ul className="space-y-2">
//                             {recommendations.lifestyle_tips.map((item, i) => (
//                               <li
//                                 key={i}
//                                 className="text-purple-800 text-sm flex items-start space-x-2"
//                               >
//                                 <span className="text-purple-500 mt-1">🏃‍♀️</span>
//                                 <span>{item}</span>
//                               </li>
//                             ))}
//                           </ul>
//                         </div>
//                       </div>
//                     )}

//                   {/* Things to Avoid */}
//                   {recommendations.avoid &&
//                     recommendations.avoid.length > 0 && (
//                       <div>
//                         <h3 className="font-medium text-orange-700 mb-3 flex items-center">
//                           ⚠️ สิ่งที่ควรหลีกเลี่ยง
//                         </h3>
//                         <div className="bg-orange-50 border border-orange-200 rounded p-4">
//                           <ul className="space-y-2">
//                             {recommendations.avoid.map((item, i) => (
//                               <li
//                                 key={i}
//                                 className="text-orange-800 text-sm flex items-start space-x-2"
//                               >
//                                 <span className="text-orange-500 mt-1">🚫</span>
//                                 <span>{item}</span>
//                               </li>
//                             ))}
//                           </ul>
//                         </div>
//                       </div>
//                     )}
//                 </div>
//               );
//             })()}

//             {/* Footer */}
//             <div className="mt-6 text-xs text-gray-500 border-t pt-4">
//               <div className="flex justify-between items-center">
//                 <p>
//                   สร้างโดย Google Gemini AI | คำแนะนำเบื้องต้น
//                   ควรปรึกษาผู้เชี่ยวชาญ
//                 </p>
//                 <p className="text-gray-400">
//                   {new Date().toLocaleDateString("th-TH")}
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Standard Recommendations */}
//         {reportData?.recommendations && (
//           <div className="bg-white rounded-lg shadow p-6 mb-6">
//             <h2 className="text-xl font-semibold text-gray-900 mb-4">
//               💡 คำแนะนำทั่วไป
//             </h2>

//             {/* Skincare Routine */}
//             {reportData.recommendations.skincare_routine &&
//               reportData.recommendations.skincare_routine.length > 0 && (
//                 <div className="mb-6">
//                   <h3 className="font-medium text-gray-700 mb-3">
//                     ขั้นตอนการดูแลผิว
//                   </h3>
//                   <ol className="space-y-2">
//                     {reportData.recommendations.skincare_routine.map(
//                       (step, index) => (
//                         <li key={index} className="flex items-start space-x-3">
//                           <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
//                             {index + 1}
//                           </span>
//                           <span className="text-gray-700">{step}</span>
//                         </li>
//                       )
//                     )}
//                   </ol>
//                 </div>
//               )}

//             {/* Products */}
//             {reportData.recommendations.products &&
//               reportData.recommendations.products.length > 0 && (
//                 <div className="mb-6">
//                   <h3 className="font-medium text-gray-700 mb-3">
//                     ผลิตภัณฑ์ที่แนะนำ
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {reportData.recommendations.products.map(
//                       (product, index) => (
//                         <div key={index} className="p-3 border rounded">
//                           <div className="font-medium text-gray-800">
//                             {product.name}
//                           </div>
//                           <div className="text-sm text-gray-600">
//                             {product.type}
//                           </div>
//                           {product.reason && (
//                             <div className="text-xs text-gray-500 mt-1">
//                               {product.reason}
//                             </div>
//                           )}
//                           {product.price_range && (
//                             <div className="text-xs text-green-600 mt-1 font-medium">
//                               {product.price_range}
//                             </div>
//                           )}
//                         </div>
//                       )
//                     )}
//                   </div>
//                 </div>
//               )}

//             {/* Tips */}
//             {reportData.recommendations.tips &&
//               reportData.recommendations.tips.length > 0 && (
//                 <div>
//                   <h3 className="font-medium text-gray-700 mb-3">
//                     เคล็ดลับการดูแล
//                   </h3>
//                   <ul className="space-y-1">
//                     {reportData.recommendations.tips.map((tip, index) => (
//                       <li
//                         key={index}
//                         className="text-gray-700 text-sm flex items-start space-x-2"
//                       >
//                         <span className="text-blue-500 mt-1">•</span>
//                         <span>{tip}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//           </div>
//         )}

//         {/* Footer */}
//         <div className="bg-white rounded-lg shadow p-6 text-center">
//           <p className="text-sm text-gray-600 mb-2">
//             รายงานนี้สร้างขึ้นโดย SkinAI Analysis System
//           </p>
//           <p className="text-xs text-gray-500">
//             คำแนะนำในรายงานนี้เป็นเพียงข้อมูลเบื้องต้น
//             ควรปรึกษาผู้เชี่ยวชaญด้านผิวหนัง
//           </p>
//           <div className="mt-3 text-xs text-gray-400">
//             {new Date().toLocaleDateString("th-TH")} • ข้อมูลเฉพาะบุคคล
//           </div>
//         </div>
//       </div>
//     </div>
//   )}



"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Calendar, 
  TrendingUp, 
  Eye, 
  BarChart3, 
  Camera, 
  Clock,
  Download,
  Share2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 🔧 API Functions
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
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

const getGeminiRecommendations = (skinAnalysis, prompt = "", language = "th") => {
  const requestBody = { skinAnalysis, prompt, language };
  return apiCall("/api/gemini/recommendations", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
};

const getGeminiStatus = () => {
  return apiCall("/api/gemini/status");
};

// 🎨 Helper Functions
const getIssueLabel = (issue) => {
  const issueMap = {
    acne: "สิว", blemishes: "สิว", texture_variation: "ผิวขรุขระ",
    redness: "ผิวแดง", dark_spots: "จุดด่างดำ", wrinkles: "ริ้วรอย",
    dryness: "ผิวแห้ง", oiliness: "ผิวมัน", pores: "รูขุมขน",
    blackheads: "หัวดำ", whiteheads: "หัวขาว",
  };
  return issueMap[issue?.toLowerCase()] || issue;
};

const getHealthCategoryLabel = (category) => {
  const categoryMap = {
    excellent: "ดีเยี่ยม", good: "ดี", fair: "พอใช้",
    needs_attention: "ต้องดูแล", poor: "แย่",
    mild: "เล็กน้อย", moderate: "ปานกลาง", severe: "รุนแรง",
  };
  return categoryMap[category?.toLowerCase()] || category;
};

// ✅ Data Normalization Function
const normalizeReportData = (rawData) => {
  if (rawData.skinAnalysis && rawData.recommendations) {
    const skinAnalysis = rawData.skinAnalysis;
    const recommendations = rawData.recommendations;

    const getSkinType = () => {
      return recommendations?.clinicalDiagnosis?.skinType ||
             skinAnalysis?.detection_details?.skin_type ||
             recommendations?.skinType ||
             skinAnalysis?.skin_type || "ไม่ระบุ";
    };

    const getSeverity = () => {
      return recommendations?.clinicalDiagnosis?.severityLevel ||
             skinAnalysis?.overall_health?.health_category ||
             recommendations?.severity ||
             skinAnalysis?.severity_level || "ไม่ทราบ";
    };

    const getPrimaryCondition = () => {
      if (recommendations?.clinicalDiagnosis?.primaryConditions?.length > 0) {
        return recommendations.clinicalDiagnosis.primaryConditions[0];
      }
      if (skinAnalysis?.detectedIssues?.length > 0) {
        return getIssueLabel(skinAnalysis.detectedIssues[0]);
      }
      return recommendations?.conditionAssessment || "ผิวปกติ";
    };

    const getConfidence = () => {
      return skinAnalysis?.overall_health?.health_score ||
             (skinAnalysis?.total_detections <= 100 ? skinAnalysis.total_detections : null) ||
             (skinAnalysis?.confidence_score * 100) || 75;
    };

    return {
      analysisId: rawData.analysisId,
      created_at: rawData.timestamp,
      skin_analysis: {
        skin_type: getSkinType(),
        primary_condition: getPrimaryCondition(),
        severity_level: getSeverity(),
        confidence_score: getConfidence() / 100,
        confidence: getConfidence(),
        conditions: skinAnalysis.detectionCounts || {},
        details: `ตรวจพบปัญหา ${skinAnalysis.detectedIssues?.length || 0} ประเภท: ${skinAnalysis.detectedIssues?.join(", ") || "ไม่มี"}`,
        analysis_method: skinAnalysis.analysis_method || "Enhanced Analysis",
        detected_issues: skinAnalysis.detectedIssues || [],
        detection_counts: skinAnalysis.detectionCounts || {},
        overall_health: skinAnalysis.overall_health || {
          health_score: getConfidence(),
          health_category: getSeverity()
        },
      },
      recommendations: {
        skincare_routine: recommendations.skincareRecommendations || 
          recommendations.treatmentPlan?.immediateAction || [],
        products: recommendations.productRecommendations ? [
          { name: recommendations.productRecommendations.cleanser || "ผลิตภัณฑ์ทำความสะอาด", type: "Cleanser", reason: "สำหรับทำความสะอาดผิว" },
          { name: recommendations.productRecommendations.treatment || "ผลิตภัณฑ์รักษา", type: "Treatment", reason: "สำหรับรักษาปัญหาผิว" },
          { name: recommendations.productRecommendations.moisturizer || "ครีมบำรุง", type: "Moisturizer", reason: "สำหรับบำรุงผิว" },
        ] : [],
        tips: recommendations.lifestyleRecommendations || 
          recommendations.lifestyleModifications?.dietary || [],
      },
      image_url: rawData.originalImage ? `${API_BASE_URL}${rawData.originalImage}` : null,
      cropped_image_url: rawData.croppedImage ? `${API_BASE_URL}${rawData.croppedImage}` : null,
      face_detected: rawData.faceDetection?.detected || false,
      gemini_recommendations: rawData.geminiSuccess ? recommendations : null,
      gemini_success: rawData.geminiSuccess || false,
      gemini_error: rawData.geminiError || null,
    };
  }
  return rawData;
};

// 🎨 UI Components
const SkinTypeBadge = ({ type, confidence }) => {
  const getTypeInfo = (type) => {
    const typeMap = {
      dry: { color: "bg-yellow-100 text-yellow-800", icon: "🏜️", label: "ผิวแห้ง" },
      oily: { color: "bg-blue-100 text-blue-800", icon: "💧", label: "ผิวมัน" },
      combination: { color: "bg-purple-100 text-purple-800", icon: "🌓", label: "ผิวผสม" },
      sensitive: { color: "bg-red-100 text-red-800", icon: "🌸", label: "ผิวแพ้ง่าย" },
      normal: { color: "bg-green-100 text-green-800", icon: "✨", label: "ผิวปกติ" },
      "normal to combination": { color: "bg-purple-100 text-purple-800", icon: "🌓", label: "ผิวปกติถึงผสม" },
      "normal_to_dry": { color: "bg-yellow-100 text-yellow-800", icon: "🏜️", label: "ผิวปกติถึงแห้ง" },
      "combination_oily": { color: "bg-blue-100 text-blue-800", icon: "💧", label: "ผิวผสมมัน" },
      unknown: { color: "bg-gray-100 text-gray-800", icon: "❓", label: "ไม่ระบุ" }
    };
    
    const normalizedType = type?.toString().toLowerCase().trim();
    return typeMap[normalizedType] || {
      color: "bg-gray-100 text-gray-800", icon: "❓", label: type || "ไม่ระบุ"
    };
  };

  const typeInfo = getTypeInfo(type);
  
  const displayConfidence = () => {
    if (typeof confidence === 'number' && confidence > 0 && confidence <= 100) {
      return `(${Math.round(confidence)}%)`;
    }
    if (typeof confidence === 'number' && confidence > 100) {
      return `(${Math.round(confidence / 100)}%)`;
    }
    return '';
  };

  return (
    <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${typeInfo.color}`}>
      <span className="mr-2">{typeInfo.icon}</span>
      {typeInfo.label}
      <span className="ml-2 text-xs opacity-75">{displayConfidence()}</span>
    </span>
  );
};

const SeverityBadge = ({ severity }) => {
  const getSeverityInfo = (severity) => {
    const severityMap = {
      good: { color: "bg-green-100 text-green-800", icon: "✅", label: "ดี" },
      excellent: { color: "bg-green-100 text-green-800", icon: "✅", label: "ดีเยี่ยม" },
      mild: { color: "bg-yellow-100 text-yellow-800", icon: "⚠️", label: "เล็กน้อย" },
      moderate: { color: "bg-orange-100 text-orange-800", icon: "🔶", label: "ปานกลาง" },
      severe: { color: "bg-red-100 text-red-800", icon: "🔴", label: "รุนแรง" },
      "needs_attention": { color: "bg-orange-100 text-orange-800", icon: "🔶", label: "ต้องดูแล" },
      fair: { color: "bg-yellow-100 text-yellow-800", icon: "⚠️", label: "พอใช้" },
      poor: { color: "bg-red-100 text-red-800", icon: "🔴", label: "แย่" },
      unknown: { color: "bg-gray-100 text-gray-800", icon: "❓", label: "ไม่ทราบ" },
    };
    
    const normalizedSeverity = severity?.toString().toLowerCase().trim();
    return severityMap[normalizedSeverity] || {
      color: "bg-gray-100 text-gray-800", icon: "❓", label: severity || "ไม่ระบุ"
    };
  };

  const severityInfo = getSeverityInfo(severity);

  return (
    <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${severityInfo.color}`}>
      <span className="mr-2">{severityInfo.icon}</span>
      {severityInfo.label}
    </span>
  );
};

// 📊 Main Report Component
export default function ReportPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [geminiRecommendations, setGeminiRecommendations] = useState(null);
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const [isGettingGemini, setIsGettingGemini] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const analysisId = searchParams.get("id");

  // 🔄 Load Data
  useEffect(() => {
    const loadData = async () => {
      if (!analysisId) {
        setError("ไม่พบ Analysis ID - กรุณาระบุ ID ในพารามิเตอร์ ?id=your_analysis_id");
        setLoading(false);
        return;
      }

      try {
        // Try loading from sessionStorage first
        const sessionReportData = sessionStorage.getItem("current_analysis_report");

        if (sessionReportData) {
          const parsedData = JSON.parse(sessionReportData);
          if (parsedData.analysisId === analysisId) {
            const normalizedData = normalizeReportData(parsedData);
            setReportData(normalizedData);
            if (normalizedData.gemini_recommendations) {
              setGeminiRecommendations(normalizedData.gemini_recommendations);
            }
            try {
              const geminiResult = await getGeminiStatus();
              setGeminiAvailable(geminiResult.available || false);
            } catch { setGeminiAvailable(false); }
            setLoading(false);
            return;
          }
        }

        // Try API call
        try {
          const reportResult = await getAnalysisReport(analysisId);
          if (reportResult.success) {
            const normalizedData = normalizeReportData(reportResult.report);
            setReportData(normalizedData);
            if (normalizedData.gemini_recommendations) {
              setGeminiRecommendations(normalizedData.gemini_recommendations);
            }
          } else {
            throw new Error(reportResult.error || "Failed to load report");
          }
        } catch (apiError) {
          // Try localStorage history as fallback
          try {
            const historyStr = localStorage.getItem("skinai_history");
            if (historyStr) {
              const history = JSON.parse(historyStr);
              const foundAnalysis = history.find(item => item.id === analysisId);

              if (foundAnalysis) {
                const convertedReport = {
                  analysisId: foundAnalysis.id,
                  created_at: foundAnalysis.ts,
                  skin_analysis: {
                    skin_type: foundAnalysis.skinType || "Unknown",
                    primary_condition: foundAnalysis.skinCondition || "Unknown",
                    severity_level: foundAnalysis.severity || "Unknown",
                    confidence_score: (foundAnalysis.severityScore || 0) / 100,
                    confidence: foundAnalysis.severityScore || 0,
                    conditions: {},
                    details: "Analysis from history",
                    analysis_method: foundAnalysis.analysisMethod || "Standard Analysis",
                    overall_health: {
                      health_score: foundAnalysis.severityScore || 0,
                      health_category: foundAnalysis.severity || "Unknown"
                    }
                  },
                  recommendations: {
                    skincare_routine: foundAnalysis.recommendations || [
                      "ทำความสะอาดผิวหน้าด้วยผลิตภัณฑ์อ่อนโยน",
                      "ใช้ครีมบำรุงที่เหมาะกับประเภทผิว",
                      "ทาครีมกันแดดทุกวัน",
                    ],
                    products: [],
                    tips: [],
                  },
                  image_url: foundAnalysis.image,
                  face_detected: foundAnalysis.faceDetected || false,
                };

                setReportData(convertedReport);
                setLoading(false);
                return;
              }
            }
            throw new Error(`ไม่พบข้อมูลการวิเคราะห์สำหรับ ID: ${analysisId}`);
          } catch (historyError) {
            throw apiError;
          }
        }

        // Check Gemini status
        try {
          const geminiResult = await getGeminiStatus();
          setGeminiAvailable(geminiResult.available || false);
        } catch { setGeminiAvailable(false); }

      } catch (err) {
        console.error("Error loading report:", err);
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
      const result = await getGeminiRecommendations({ ...reportData.skin_analysis }, "", "th");

      if (result.success) {
        setGeminiRecommendations(result.recommendations);
        const updatedReportData = {
          ...reportData,
          gemini_recommendations: result.recommendations,
        };
        sessionStorage.setItem("current_analysis_report", JSON.stringify(updatedReportData));
      } else {
        throw new Error(result.error || "Failed to get recommendations");
      }
    } catch (err) {
      setError(`ไม่สามารถสร้างคำแนะนำ AI ได้: ${err.message}`);
    } finally {
      setIsGettingGemini(false);
    }
  };

  // 📤 Export Functions
  const exportToPDF = () => {
    window.print();
  };

  const shareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'รายงานการวิเคราะห์ผิว',
          text: `ผลการวิเคราะห์ผิว - ${reportData?.skin_analysis?.skin_type}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('ลิงก์ถูกคัดลอกแล้ว!');
    }
  };

  // 🔄 Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-700">กำลังโหลดรายงาน...</h2>
          {analysisId && <p className="text-sm text-gray-500 mt-2">Analysis ID: {analysisId}</p>}
        </div>
      </div>
    );
  }

  // ❌ Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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
            <Link href="/analysis" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 inline-block">
              กลับหน้าหลัก
            </Link>
            <Link href="/history" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block">
              ดูประวัติ
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
          <div className="flex items-center gap-4 mb-4">
            <Link href="/analysis" className="text-blue-600 hover:text-blue-800">
              ← กลับไปวิเคราะห์ใหม่
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/history" className="text-blue-600 hover:text-blue-800">
              ดูประวัติทั้งหมด
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                รายงานการวิเคราะห์ผิว
              </h1>
              <p className="text-gray-600">
                สร้างเมื่อ: {new Date(reportData?.created_at).toLocaleDateString("th-TH", {
                  year: "numeric", month: "long", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-gray-500">Analysis ID: {analysisId}</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={shareReport}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1"
              >
                <Share2 className="w-4 h-4" />
                แชร์
              </button>
              
              <button
                onClick={exportToPDF}
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>

              {geminiAvailable && !geminiRecommendations && (
                <button
                  onClick={handleGetGeminiRecommendations}
                  disabled={isGettingGemini}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 flex items-center gap-1"
                >
                  {isGettingGemini ? "🤖 กำลังสร้าง..." : "✨ สร้างคำแนะนำ AI"}
                </button>
              )}
            </div>
          </div>

          {/* Status Indicators */}
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <span className={`flex items-center space-x-1 ${geminiAvailable ? "text-green-600" : "text-yellow-600"}`}>
              <span>{geminiAvailable ? "🤖" : "⚠️"}</span>
              <span>Gemini AI: {geminiAvailable ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน"}</span>
            </span>

            {reportData?.face_detected && (
              <span className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Face Detected</span>
              </span>
            )}

            {reportData?.gemini_success && (
              <span className="flex items-center space-x-1 text-purple-600">
                <span>🤖</span>
                <span>AI Enhanced</span>
              </span>
            )}
          </div>
        </div>

        {/* Image Display */}
        {(reportData?.image_url || reportData?.cropped_image_url) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              ภาพที่วิเคราะห์
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.image_url && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">ภาพต้นฉบับ</h3>
                  <img
                    src={reportData.image_url}
                    alt="Original"
                    className="w-full h-64 object-cover rounded border"
                  />
                </div>
              )}
              {reportData.cropped_image_url && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">ภาพที่ตัดแล้ว</h3>
                  <img
                    src={reportData.cropped_image_url}
                    alt="Cropped"
                    className="w-full h-64 object-cover rounded border"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis Summary */}
        {reportData?.skin_analysis && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              ผลการวิเคราะห์ผิว
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Skin Type */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-medium text-blue-700 mb-2">ประเภทผิว</h3>
                <SkinTypeBadge 
                  type={reportData.skin_analysis.skin_type} 
                  confidence={reportData.skin_analysis.confidence} 
                />
              </div>

              {/* Primary Condition */}
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="font-medium text-green-700 mb-2">สภาพผิวหลัก</h3>
                <p className="text-green-800 font-medium">
                  {reportData.skin_analysis.primary_condition}
                </p>
              </div>

              {/* Severity */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                <h3 className="font-medium text-purple-700 mb-2">ระดับความรุนแรง</h3>
                <SeverityBadge severity={reportData.skin_analysis.severity_level} />
              </div>
            </div>

            {/* Health Score */}
            {reportData.skin_analysis.overall_health && (
              <div className="mt-6 p-4 bg-gray-50 rounded">
                <h3 className="font-medium text-gray-700 mb-2">คะแนนสุขภาพผิว</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        reportData.skin_analysis.overall_health.health_score >= 70
                          ? "bg-green-500"
                          : reportData.skin_analysis.overall_health.health_score >= 40
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${reportData.skin_analysis.overall_health.health_score || 0}%`,
                      }}
                    ></div>
                  </div>
                
                  <span className="text-sm font-medium text-gray-700">
                    {reportData.skin_analysis.overall_health.health_score || 0}/100
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  สถานะ: {getHealthCategoryLabel(
                    reportData.skin_analysis.overall_health.health_category
                  )}
                </p>
              </div>
            )}

            {/* Detected Issues */}
            {reportData.skin_analysis.detected_issues && reportData.skin_analysis.detected_issues.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-medium text-yellow-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  ปัญหาที่ตรวจพบ
                </h3>
                <div className="flex flex-wrap gap-2">
                  {reportData.skin_analysis.detected_issues.map((issue, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                    >
                      {getIssueLabel(issue)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Details */}
            {reportData.skin_analysis.details && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium text-gray-700 mb-2">รายละเอียดการวิเคราะห์</h3>
                <p className="text-gray-600 text-sm">
                  {reportData.skin_analysis.details}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  วิธีการวิเคราะห์: {reportData.skin_analysis.analysis_method}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Standard Recommendations */}
        {reportData?.recommendations && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              คำแนะนำการดูแลผิว
            </h2>

            {/* Skincare Routine */}
            {reportData.recommendations.skincare_routine && reportData.recommendations.skincare_routine.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-3">ขั้นตอนการดูแลผิว</h3>
                <div className="space-y-2">
                  {reportData.recommendations.skincare_routine.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <p className="text-green-800">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Recommendations */}
            {reportData.recommendations.products && reportData.recommendations.products.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-3">ผลิตภัณฑ์ที่แนะนำ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportData.recommendations.products.map((product, index) => (
                    <div key={index} className="p-4 border border-blue-200 rounded bg-blue-50">
                      <h4 className="font-medium text-blue-800">{product.name}</h4>
                      <p className="text-sm text-blue-600 mb-1">ประเภท: {product.type}</p>
                      <p className="text-sm text-blue-700">{product.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle Tips */}
            {reportData.recommendations.tips && reportData.recommendations.tips.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-700 mb-3">คำแนะนำเพิ่มเติม</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportData.recommendations.tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-purple-50 rounded">
                      <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-purple-800 text-sm">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gemini AI Recommendations */}
        {geminiRecommendations && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow p-6 mb-6 border border-purple-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              คำแนะนำจาก Gemini AI
            </h2>

            {/* Clinical Diagnosis */}
            {geminiRecommendations.clinicalDiagnosis && (
              <div className="mb-6 p-4 bg-white rounded border">
                <h3 className="font-medium text-purple-700 mb-3">การวินิจฉัยทางคลินิก</h3>
                
                {geminiRecommendations.clinicalDiagnosis.primaryConditions && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">สภาพผิวหลัก:</h4>
                    <div className="flex flex-wrap gap-2">
                      {geminiRecommendations.clinicalDiagnosis.primaryConditions.map((condition, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {geminiRecommendations.clinicalDiagnosis.secondaryConditions && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">สภาพผิวรอง:</h4>
                    <div className="flex flex-wrap gap-2">
                      {geminiRecommendations.clinicalDiagnosis.secondaryConditions.map((condition, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {geminiRecommendations.clinicalDiagnosis.riskFactors && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">ปัจจัยเสี่ยง:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {geminiRecommendations.clinicalDiagnosis.riskFactors.map((factor, index) => (
                        <li key={index}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Treatment Plan */}
            {geminiRecommendations.treatmentPlan && (
              <div className="mb-6 p-4 bg-white rounded border">
                <h3 className="font-medium text-purple-700 mb-3">แผนการรักษา</h3>
                
                {geminiRecommendations.treatmentPlan.immediateAction && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-red-700 mb-2">🚨 การดูแลเร่งด่วน:</h4>
                    <div className="space-y-2">
                      {geminiRecommendations.treatmentPlan.immediateAction.map((action, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-red-800 text-sm">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {geminiRecommendations.treatmentPlan.shortTerm && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-orange-700 mb-2">📅 แผนระยะสั้น (1-4 สัปดาห์):</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-orange-800">
                      {geminiRecommendations.treatmentPlan.shortTerm.map((plan, index) => (
                        <li key={index}>{plan}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {geminiRecommendations.treatmentPlan.longTerm && (
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-2">🎯 แผนระยะยาว (1-3 เดือน):</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                      {geminiRecommendations.treatmentPlan.longTerm.map((plan, index) => (
                        <li key={index}>{plan}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Product Recommendations */}
            {geminiRecommendations.productRecommendations && (
              <div className="mb-6 p-4 bg-white rounded border">
                <h3 className="font-medium text-purple-700 mb-3">ผลิตภัณฑ์ที่แนะนำ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(geminiRecommendations.productRecommendations).map(([type, product], index) => (
                    <div key={index} className="p-3 bg-purple-50 rounded border border-purple-200">
                      <h4 className="font-medium text-purple-800 capitalize mb-1">
                        {type === 'cleanser' ? 'ผลิตภัณฑ์ทำความสะอาด' :
                         type === 'treatment' ? 'ผลิตภัณฑ์รักษา' :
                         type === 'moisturizer' ? 'ครีมบำรุง' :
                         type === 'sunscreen' ? 'ครีมกันแดด' : type}
                      </h4>
                      <p className="text-sm text-purple-700">{product}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle Modifications */}
            {geminiRecommendations.lifestyleModifications && (
              <div className="mb-6 p-4 bg-white rounded border">
                <h3 className="font-medium text-purple-700 mb-3">การปรับเปลี่ยนวิถีชีวิต</h3>
                
                {geminiRecommendations.lifestyleModifications.dietary && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-green-700 mb-2">🥗 อาหารและโภชนาการ:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                      {geminiRecommendations.lifestyleModifications.dietary.map((diet, index) => (
                        <li key={index}>{diet}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {geminiRecommendations.lifestyleModifications.environmental && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-blue-700 mb-2">🌍 สิ่งแวดล้อม:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                      {geminiRecommendations.lifestyleModifications.environmental.map((env, index) => (
                        <li key={index}>{env}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {geminiRecommendations.lifestyleModifications.habits && (
                  <div>
                    <h4 className="text-sm font-medium text-purple-700 mb-2">💫 นิสัยการดูแลตนเอง:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-purple-800">
                      {geminiRecommendations.lifestyleModifications.habits.map((habit, index) => (
                        <li key={index}>{habit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Follow-up Instructions */}
            {geminiRecommendations.followUpInstructions && (
              <div className="p-4 bg-white rounded border">
                <h3 className="font-medium text-purple-700 mb-3">📋 คำแนะนำการติดตาม</h3>
                
                {geminiRecommendations.followUpInstructions.timeline && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">⏰ กำหนดเวลา:</h4>
                    <p className="text-sm text-gray-600">{geminiRecommendations.followUpInstructions.timeline}</p>
                  </div>
                )}

                {geminiRecommendations.followUpInstructions.warningSignsToWatch && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-red-700 mb-2">⚠️ อาการที่ต้องระวัง:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                      {geminiRecommendations.followUpInstructions.warningSignsToWatch.map((sign, index) => (
                        <li key={index}>{sign}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {geminiRecommendations.followUpInstructions.whenToSeekHelp && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-700 mb-2">🏥 เมื่อไหร่ควรพบแพทย์:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-orange-800">
                      {geminiRecommendations.followUpInstructions.whenToSeekHelp.map((help, index) => (
                        <li key={index}>{help}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 text-xs text-purple-600 italic">
              * คำแนะนำนี้สร้างโดย Gemini AI และควรใช้เป็นข้อมูลเบื้องต้นเท่านั้น หากมีปัญหาผิวหนังรุนแรง ควรปรึกษาแพทย์ผิวหนัง
            </div>
          </div>
        )}

        {/* Error Display */}
        {reportData?.gemini_error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-800">ข้อผิดพลาดในการสร้างคำแนะนำ AI</h3>
                <p className="text-sm text-red-700 mt-1">{reportData.gemini_error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">การดำเนินการต่อ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <Link
              href="/upload"
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span>วิเคราะห์ใหม่</span>
            </Link>

            <Link
              href="/history"
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Clock className="w-5 h-5" />
              <span>ดูประวัติ</span>
            </Link>

            <button
              onClick={() => {
                const reportSummary = {
                  date: new Date(reportData?.created_at).toLocaleDateString("th-TH"),
                  skinType: reportData?.skin_analysis?.skin_type,
                  condition: reportData?.skin_analysis?.primary_condition,
                  severity: reportData?.skin_analysis?.severity_level,
                  score: reportData?.skin_analysis?.overall_health?.health_score,
                  recommendations: reportData?.recommendations?.skincare_routine?.slice(0, 3),
                };

                const summaryText = `
📊 สรุปการวิเคราะห์ผิว
วันที่: ${reportSummary.date}
ประเภทผิว: ${reportSummary.skinType}
สภาพผิว: ${reportSummary.condition}
ระดับความรุนแรง: ${reportSummary.severity}
คะแนนสุขภาพ: ${reportSummary.score}/100

คำแนะนำหลัก:
${reportSummary.recommendations?.map((rec, i) => `${i + 1}. ${rec}`).join('\n') || 'ไม่มีคำแนะนำ'}

รายงานฉบับเต็ม: ${window.location.href}
                `.trim();

                navigator.clipboard.writeText(summaryText).then(() => {
                  alert('คัดลอกสรุปรายงานแล้ว!');
                });
              }}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span>คัดลอกสรุป</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded border">
            <h3 className="font-medium text-gray-700 mb-2">ข้อมูลเพิ่มเติม</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>Analysis ID:</strong> {analysisId}
              </div>
              <div>
                <strong>Face Detection:</strong> {reportData?.face_detected ? "✅ ตรวจพบใบหน้า" : "❌ ไม่พบใบหน้า"}
              </div>
              <div>
                <strong>AI Enhancement:</strong> {reportData?.gemini_success ? "✅ ใช้ AI" : "❌ ไม่ใช้ AI"}
              </div>
              <div>
                <strong>Analysis Method:</strong> {reportData?.skin_analysis?.analysis_method || "Standard"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            รายงานนี้สร้างโดยระบบ AI สำหรับการวิเคราะห์ผิวเบื้องต้น 
            หากมีปัญหาผิวหนังรุนแรงหรือต้องการคำแนะนำเฉพาะ ควรปรึกษาแพทย์ผิวหนัง
          </p>
          <p className="mt-2">
            © 2024 Skin Analysis AI - สร้างเมื่อ {new Date().toLocaleString("th-TH")}
          </p>
        </div>
      </div>
    </div>
  );
}
