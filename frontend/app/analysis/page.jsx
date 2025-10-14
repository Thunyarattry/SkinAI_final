// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function AnalysisPage() {
//   const [analysisData, setAnalysisData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState("overview");
//   const [imageUrls, setImageUrls] = useState({ original: null, cropped: null });
//   const router = useRouter();

//   useEffect(() => {
//     const loadAnalysisData = () => {
//       try {
//         const storedData = sessionStorage.getItem("skinai_analysis_result");

//         if (!storedData) {
//           setError("No analysis data found. Please upload an image first.");
//           setLoading(false);
//           return;
//         }

//         const backendResponse = JSON.parse(storedData);
//         console.log("📊 Backend response:", backendResponse);

//         if (!backendResponse.success) {
//           setError(backendResponse.error || "Analysis failed");
//           setLoading(false);
//           return;
//         }

//         // ✅ Fix: Use the correct data structure from your API
//         setAnalysisData(backendResponse);

//         // ✅ Fix: Set up image URLs properly
//         const baseUrl =
//           process.env.NODE_ENV === "development"
//             ? "http://localhost:8000" // Your FastAPI backend URL
//             : window.location.origin;

//         const originalImageUrl = backendResponse.originalImage
//           ? `${baseUrl}${backendResponse.originalImage}`
//           : null;
//         const croppedImageUrl = backendResponse.croppedImage
//           ? `${baseUrl}${backendResponse.croppedImage}`
//           : null;

//         setImageUrls({
//           original: originalImageUrl,
//           cropped: croppedImageUrl,
//         });

//         console.log("🖼️ Image URLs:", { originalImageUrl, croppedImageUrl });

//         setLoading(false);
//       } catch (e) {
//         console.error("❌ Failed to load analysis data:", e);
//         setError("Failed to load analysis data");
//         setLoading(false);
//       }
//     };

//     loadAnalysisData();
//   }, []);

//   // ✅ Helper Functions - Fixed to use correct API structure
//   const getSeverityColor = (severity) => {
//     switch (severity?.toLowerCase()) {
//       case "good":
//         return "text-green-600 bg-green-100";
//       case "mild":
//         return "text-yellow-600 bg-yellow-100";
//       case "moderate":
//         return "text-orange-600 bg-orange-100";
//       case "severe":
//         return "text-red-600 bg-red-100";
//       default:
//         return "text-gray-600 bg-gray-100";
//     }
//   };

//   const getHealthScoreColor = (score) => {
//     if (score >= 80) return "text-green-600";
//     if (score >= 60) return "text-yellow-600";
//     if (score >= 40) return "text-orange-600";
//     return "text-red-600";
//   };

//   // ✅ Generate Report Function
//   const generateReport = () => {
//     try {
//       if (!analysisData) {
//         alert("No analysis data available");
//         return;
//       }

//       const reportData = {
//         analysisId: analysisData.analysisId,
//         created_at: analysisData.timestamp,
//         skin_analysis: {
//           health_score:
//             analysisData.skinAnalysis?.overall_health?.health_score || 0,
//           health_category:
//             analysisData.skinAnalysis?.overall_health?.health_category ||
//             "unknown",
//           total_detections: analysisData.skinAnalysis?.total_detections || 0,
//           detected_issues: analysisData.skinAnalysis?.detectedIssues || [],
//           detection_counts: analysisData.skinAnalysis?.detectionCounts || {},
//           face_detected: analysisData.faceDetection?.detected || false,
//           confidence: Math.round(
//             (analysisData.faceDetection?.confidence || 0) * 100
//           ),
//         },
//         recommendations: {
//           skincare_routine:
//             analysisData.recommendations?.skincareRecommendations || [],
//           lifestyle_tips:
//             analysisData.recommendations?.lifestyleRecommendations || [],
//           skin_type: analysisData.recommendations?.skinType || "Unknown",
//           condition:
//             analysisData.recommendations?.conditionAssessment || "Unknown",
//           timeline:
//             analysisData.recommendations?.improvementTimeline || "Unknown",
//         },
//         images: {
//           original: analysisData.originalImage,
//           cropped: analysisData.croppedImage,
//         },
//         processing_time: analysisData.processing_time,
//       };

//       sessionStorage.setItem(
//         "current_analysis_report",
//         JSON.stringify(reportData)
//       );
//       console.log("✅ Report data prepared:", reportData);
//       router.push(`/report?id=${analysisData.analysisId}`);
//     } catch (error) {
//       console.error("❌ Failed to generate report:", error);
//       alert("Failed to generate report. Please try again.");
//     }
//   };

//   // Loading State
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading analysis results...</p>
//         </div>
//       </div>
//     );
//   }

//   // Error State
//   if (error || !analysisData) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center bg-white p-8 rounded-lg shadow-sm max-w-md">
//           <div className="text-red-500 mb-4">
//             <svg
//               className="w-16 h-16 mx-auto"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
//               />
//             </svg>
//           </div>
//           <h2 className="text-xl font-bold text-gray-900 mb-2">
//             Analysis Not Found
//           </h2>
//           <p className="text-gray-600 mb-6">
//             {error || "Please upload an image first"}
//           </p>
//           <button
//             onClick={() => router.push("/upload")}
//             className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
//           >
//             Upload New Image
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-6xl mx-auto px-4">
//         {/* Header */}
//         <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">
//                 Skin Analysis Results
//               </h1>
//               <p className="text-gray-600">
//                 Analysis completed on{" "}
//                 {new Date(analysisData.timestamp).toLocaleString()}
//               </p>
//               <p className="text-sm text-gray-500">
//                 ID: {analysisData.analysisId}
//               </p>
//               <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
//                 <span>Processing: {analysisData.processing_time}s</span>
//                 <span>
//                   • Issues: {analysisData.skinAnalysis?.total_detections || 0}
//                 </span>
//                 <span>
//                   • Health Score:{" "}
//                   {analysisData.skinAnalysis?.overall_health?.health_score || 0}
//                   /100
//                 </span>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               {/* ✅ Fix: Use correct face detection status */}
//               {analysisData.faceDetection?.detected && (
//                 <span className="px-3 py-1 rounded-full text-sm font-medium text-green-600 bg-green-100">
//                   Face Detected (
//                   {Math.round(
//                     (analysisData.faceDetection.confidence || 0) * 100
//                   )}
//                   %)
//                 </span>
//               )}
//               <span
//                 className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(
//                   analysisData.recommendations?.severity || "mild"
//                 )}`}
//               >
//                 {analysisData.skinAnalysis?.overall_health?.health_category?.replace(
//                   /_/g,
//                   " "
//                 ) || "Unknown"}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="grid lg:grid-cols-3 gap-6">
//           {/* Left Column - Images and Quick Stats */}
//           <div className="lg:col-span-1">
//             {/* Images */}
//             <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                 Analysis Images
//               </h3>

//               {/* Original Image */}
//               <div className="mb-4">
//                 <h4 className="text-sm font-medium text-gray-700 mb-2">
//                   Original Image
//                 </h4>
//                 {imageUrls.original ? (
//                   <img
//                     src={imageUrls.original}
//                     alt="Original analysis image"
//                     className="w-full rounded-lg shadow-md"
//                     onLoad={() => console.log("✅ Original image loaded")}
//                     onError={(e) => {
//                       console.error(
//                         "❌ Failed to load original image:",
//                         imageUrls.original
//                       );
//                       e.target.style.display = "none";
//                       e.target.nextSibling.style.display = "flex";
//                     }}
//                   />
//                 ) : null}

//                 <div
//                   className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"
//                   style={{ display: imageUrls.original ? "none" : "flex" }}
//                 >
//                   <div className="text-center">
//                     <svg
//                       className="w-12 h-12 mx-auto mb-2"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
//                       />
//                     </svg>
//                     <p className="text-sm">Original image not available</p>
//                     <p className="text-xs text-gray-400 mt-1">
//                       Path: {analysisData?.originalImage}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Cropped Face Image */}
//               {imageUrls.cropped && (
//                 <div>
//                   <h4 className="text-sm font-medium text-gray-700 mb-2">
//                     Detected Face Region
//                   </h4>
//                   <img
//                     src={imageUrls.cropped}
//                     alt="Cropped face region"
//                     className="w-full rounded-lg shadow-md"
//                     onLoad={() => console.log("✅ Cropped image loaded")}
//                     onError={(e) => {
//                       console.error(
//                         "❌ Failed to load cropped image:",
//                         imageUrls.cropped
//                       );
//                       e.target.style.display = "none";
//                     }}
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Quick Stats */}
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                 Analysis Summary
//               </h3>
//               <div className="space-y-3">
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Health Score</span>
//                   <span
//                     className={`font-bold ${getHealthScoreColor(
//                       analysisData.skinAnalysis?.overall_health?.health_score ||
//                         0
//                     )}`}
//                   >
//                     {analysisData.skinAnalysis?.overall_health?.health_score ||
//                       0}
//                     /100
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Health Category</span>
//                   <span className="font-medium capitalize">
//                     {analysisData.skinAnalysis?.overall_health?.health_category?.replace(
//                       /_/g,
//                       " "
//                     ) || "Unknown"}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Issues Found</span>
//                   <span className="font-medium">
//                     {analysisData.skinAnalysis?.total_detections || 0}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Skin Type</span>
//                   <span className="font-medium">
//                     {analysisData.recommendations?.skinType || "Unknown"}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Face Detection</span>
//                   <span
//                     className={`font-medium ${
//                       analysisData.faceDetection?.detected
//                         ? "text-green-600"
//                         : "text-red-600"
//                     }`}
//                   >
//                     {analysisData.faceDetection?.detected
//                       ? "Success"
//                       : "Failed"}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Detailed Analysis */}
//           <div className="lg:col-span-2">
//             {/* Tabs */}
//             <div className="bg-white rounded-lg shadow-sm mb-6">
//               <div className="border-b border-gray-200">
//                 <nav className="flex space-x-8 px-6">
//                   {["overview", "recommendations"].map((tab) => (
//                     <button
//                       key={tab}
//                       onClick={() => setActiveTab(tab)}
//                       className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
//                         activeTab === tab
//                           ? "border-blue-500 text-blue-600"
//                           : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                       }`}
//                     >
//                       {tab}
//                     </button>
//                   ))}
//                 </nav>
//               </div>

//               <div className="p-6">
//                 {/* Overview Tab */}
//                 {activeTab === "overview" && (
//                   <div className="space-y-6">
//                     {/* Face Detection Status */}
//                     <div>
//                       <h4 className="text-lg font-semibold text-gray-900 mb-3">
//                         Face Detection Status
//                       </h4>
//                       <div
//                         className={`rounded-lg p-4 ${
//                           analysisData.faceDetection?.detected
//                             ? "bg-green-50 border border-green-200"
//                             : "bg-red-50 border border-red-200"
//                         }`}
//                       >
//                         <div className="flex items-center gap-3 mb-2">
//                           <div
//                             className={`w-3 h-3 rounded-full ${
//                               analysisData.faceDetection?.detected
//                                 ? "bg-green-500"
//                                 : "bg-red-500"
//                             }`}
//                           ></div>
//                           <span
//                             className={`font-medium ${
//                               analysisData.faceDetection?.detected
//                                 ? "text-green-800"
//                                 : "text-red-800"
//                             }`}
//                           >
//                             {analysisData.faceDetection?.detected
//                               ? "Face Successfully Detected"
//                               : "Face Detection Failed"}
//                           </span>
//                         </div>
//                         <div
//                           className={`text-sm ml-6 ${
//                             analysisData.faceDetection?.detected
//                               ? "text-green-700"
//                               : "text-red-700"
//                           }`}
//                         >
//                           <p>
//                             Method:{" "}
//                             {analysisData.faceDetection?.detection_method ||
//                               "Unknown"}
//                           </p>
//                           <p>
//                             Confidence:{" "}
//                             {Math.round(
//                               (analysisData.faceDetection?.confidence || 0) *
//                                 100
//                             )}
//                             %
//                           </p>
//                           <p>
//                             Total faces:{" "}
//                             {analysisData.faceDetection?.total_faces || 0}
//                           </p>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Health Status */}
//                     <div>
//                       <h4 className="text-lg font-semibold text-gray-900 mb-3">
//                         Overall Health Status
//                       </h4>
//                       <div className="bg-gray-50 rounded-lg p-4">
//                         <div className="flex items-center justify-between mb-3">
//                           <span className="text-lg font-medium">
//                             Health Score
//                           </span>
//                           <span
//                             className={`text-2xl font-bold ${getHealthScoreColor(
//                               analysisData.skinAnalysis?.overall_health
//                                 ?.health_score || 0
//                             )}`}
//                           >
//                             {analysisData.skinAnalysis?.overall_health
//                               ?.health_score || 0}
//                             /100
//                           </span>
//                         </div>
//                         <div className="w-full bg-gray-200 rounded-full h-3">
//                           <div
//                             className={`h-3 rounded-full ${
//                               (analysisData.skinAnalysis?.overall_health
//                                 ?.health_score || 0) >= 80
//                                 ? "bg-green-500"
//                                 : (analysisData.skinAnalysis?.overall_health
//                                     ?.health_score || 0) >= 60
//                                 ? "bg-yellow-500"
//                                 : (analysisData.skinAnalysis?.overall_health
//                                     ?.health_score || 0) >= 40
//                                 ? "bg-orange-500"
//                                 : "bg-red-500"
//                             }`}
//                             style={{
//                               width: `${
//                                 analysisData.skinAnalysis?.overall_health
//                                   ?.health_score || 0
//                               }%`,
//                             }}
//                           ></div>
//                         </div>
//                         <p className="text-sm text-gray-600 mt-2 capitalize">
//                           Category:{" "}
//                           {analysisData.skinAnalysis?.overall_health?.health_category?.replace(
//                             /_/g,
//                             " "
//                           ) || "Unknown"}
//                         </p>
//                       </div>
//                     </div>

//                     {/* Detected Issues */}
//                     {analysisData.skinAnalysis?.detectedIssues &&
//                     analysisData.skinAnalysis.detectedIssues.length > 0 ? (
//                       <div>
//                         <h4 className="text-lg font-semibold text-gray-900 mb-3">
//                           Detected Issues
//                         </h4>
//                         <div className="space-y-3">
//                           {analysisData.skinAnalysis.detectedIssues.map(
//                             (issue, index) => {
//                               const count =
//                                 analysisData.skinAnalysis.detectionCounts[
//                                   issue
//                                 ] || 1;
//                               const details =
//                                 analysisData.skinAnalysis.detection_details?.[
//                                   issue
//                                 ];

//                               return (
//                                 <div
//                                   key={index}
//                                   className="bg-gray-50 rounded-lg p-4"
//                                 >
//                                   <div className="flex justify-between items-center mb-2">
//                                     <span className="font-medium capitalize">
//                                       {issue.replace(/_/g, " ")}
//                                     </span>
//                                     <div className="flex items-center gap-2">
//                                       <span className="text-sm text-gray-600">
//                                         Count: {count}
//                                       </span>
//                                       {details?.severity && (
//                                         <span
//                                           className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(
//                                             details.severity
//                                           )}`}
//                                         >
//                                           {details.severity}
//                                         </span>
//                                       )}
//                                     </div>
//                                   </div>
//                                   {details && (
//                                     <div className="text-sm text-gray-600">
//                                       {issue === "texture_variation" &&
//                                         details.variance && (
//                                           <p>
//                                             Texture variance:{" "}
//                                             {Math.round(details.variance)}
//                                           </p>
//                                         )}
//                                       {issue === "redness" &&
//                                         details.red_dominance && (
//                                           <p>
//                                             Red dominance:{" "}
//                                             {Math.round(details.red_dominance)}%
//                                           </p>
//                                         )}
//                                     </div>
//                                   )}
//                                 </div>
//                               );
//                             }
//                           )}
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                         <div className="flex items-center gap-3">
//                           <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                           <span className="font-medium text-green-800">
//                             No significant skin issues detected
//                           </span>
//                         </div>
//                         <p className="text-sm text-green-700 mt-2 ml-6">
//                           Your skin appears to be in good condition. Continue
//                           with your current skincare routine.
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* Analysis Tab */}
//                 {activeTab === "analysis" && (
//                   <div className="space-y-6">
//                     <h4 className="text-lg font-semibold text-gray-900">
//                       Technical Analysis Details
//                     </h4>

//                     {/* Face Detection Details */}
//                     {analysisData.faceDetection && (
//                       <div className="bg-gray-50 rounded-lg p-4">
//                         <h5 className="font-medium text-gray-900 mb-3">
//                           Face Detection Results
//                         </h5>
//                         <div className="grid md:grid-cols-2 gap-4 text-sm">
//                           <div>
//                             <span className="font-medium">
//                               Detection Method:
//                             </span>
//                             <p className="text-gray-600">
//                               {analysisData.faceDetection.detection_method}
//                             </p>
//                           </div>
//                           <div>
//                             <span className="font-medium">Confidence:</span>
//                             <p className="text-gray-600">
//                               {Math.round(
//                                 (analysisData.faceDetection.confidence || 0) *
//                                   100
//                               )}
//                               %
//                             </p>
//                           </div>
//                           <div>
//                             <span className="font-medium">Face Region:</span>
//                             <p className="text-gray-600">
//                               {analysisData.faceDetection.coordinates?.width} ×{" "}
//                               {analysisData.faceDetection.coordinates?.height}{" "}
//                               pixels
//                             </p>
//                           </div>
//                           <div>
//                             <span className="font-medium">Total Faces:</span>
//                             <p className="text-gray-600">
//                               {analysisData.faceDetection.total_faces}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     {/* Face Analysis Details */}
//                     {analysisData.faceDetection?.face_analysis && (
//                       <div className="bg-gray-50 rounded-lg p-4">
//                         <h5 className="font-medium text-gray-900 mb-3">
//                           Face Analysis Metrics
//                         </h5>
//                         <div className="grid md:grid-cols-2 gap-4 text-sm">
//                           <div>
//                             <span className="font-medium">Brightness:</span>
//                             <p className="text-gray-600">
//                               {Math.round(
//                                 analysisData.faceDetection.face_analysis
//                                   .brightness
//                               )}
//                               /255
//                             </p>
//                           </div>
//                           <div>
//                             <span className="font-medium">
//                               Texture Variance:
//                             </span>
//                             <p className="text-gray-600">
//                               {Math.round(
//                                 analysisData.faceDetection.face_analysis
//                                   .texture_variance
//                               )}
//                             </p>
//                           </div>
//                           <div>
//                             <span className="font-medium">Aspect Ratio:</span>
//                             <p className="text-gray-600">
//                               {
//                                 analysisData.faceDetection.face_analysis
//                                   .aspect_ratio
//                               }
//                             </p>
//                           </div>
//                           <div>
//                             <span className="font-medium">
//                               Mean Color (RGB):
//                             </span>
//                             {/* <p className="text-gray-600">
//                               R:
//                               {Math.round(
//                                 analysisData.faceDetection.face_analysis
//                                   .mean_color.r
//                               )}
//                               , G:
//                               {Math.round(
//                                 analysisData.faceDetection.face_analysis
//                                   .mean_color.g
//                               )}
//                               , B:
//                               {Math.round(
//                                 analysisData.faceDetection.face_analysis
//                                   .mean_color.b
//                               )}
//                             </p> */}
//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     {/* OpenCV Analysis */}
//                     {analysisData.skinAnalysis?.opencv_analysis && (
//                       <div className="bg-blue-50 rounded-lg p-4">
//                         <h5 className="font-medium text-blue-900 mb-3">
//                           OpenCV Analysis Results
//                         </h5>
//                         <div className="text-sm text-blue-800 space-y-2">
//                           <p>
//                             • Analysis Method:{" "}
//                             {analysisData.skinAnalysis.analysis_method}
//                           </p>
//                           <p>
//                             • Analysis Region:{" "}
//                             {
//                               analysisData.skinAnalysis.opencv_analysis
//                                 .analysis_region
//                             }
//                           </p>
//                           <p>
//                             • Total Issues:{" "}
//                             {
//                               analysisData.skinAnalysis.opencv_analysis
//                                 .total_issues
//                             }
//                           </p>
//                           <p>
//                             • Detected Classes:{" "}
//                             {analysisData.skinAnalysis.detected_classes}
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* Recommendations Tab */}
//                 {activeTab === "recommendations" && (
//                   <div className="space-y-6">
//                     <h4 className="text-lg font-semibold text-gray-900">
//                       AI Recommendations
//                     </h4>

//                     {/* Skin Assessment */}
//                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                       <h5 className="font-medium text-blue-900 mb-2">
//                         Skin Assessment
//                       </h5>
//                       <div className="text-sm text-blue-800 space-y-1">
//                         <p>
//                           • Skin Type:{" "}
//                           {analysisData.recommendations?.skinType || "Unknown"}
//                         </p>
//                         <p>
//                           • Condition:{" "}
//                           {analysisData.recommendations?.conditionAssessment ||
//                             "Unknown"}
//                         </p>
//                         <p>
//                           • Expected Timeline:{" "}
//                           {analysisData.recommendations?.improvementTimeline ||
//                             "Unknown"}
//                         </p>
//                       </div>
//                     </div>

//                     {/* Skincare Recommendations */}
//                     {analysisData.recommendations?.skincareRecommendations &&
//                       analysisData.recommendations.skincareRecommendations
//                         .length > 0 && (
//                         <div>
//                           <h5 className="font-medium text-gray-800 mb-3">
//                             Skincare Routine
//                           </h5>
//                           <div className="space-y-3">
//                             {analysisData.recommendations.skincareRecommendations.map(
//                               (rec, index) => (
//                                 <div
//                                   key={index}
//                                   className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
//                                 >
//                                   <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
//                                     <span className="text-blue-600 text-sm font-medium">
//                                       {index + 1}
//                                     </span>
//                                   </div>
//                                   <p className="text-gray-700">{rec}</p>
//                                 </div>
//                               )
//                             )}
//                           </div>
//                         </div>
//                       )}

//                     {/* Lifestyle Recommendations */}
//                     {analysisData.recommendations?.lifestyleRecommendations &&
//                       analysisData.recommendations.lifestyleRecommendations
//                         .length > 0 && (
//                         <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                           <h5 className="font-medium text-green-900 mb-3">
//                             💡 Lifestyle Tips
//                           </h5>
//                           <div className="space-y-1 text-sm text-green-800">
//                             {analysisData.recommendations.lifestyleRecommendations.map(
//                               (tip, index) => (
//                                 <div
//                                   key={index}
//                                   className="flex items-start gap-2"
//                                 >
//                                   <span className="text-green-600">•</span>
//                                   <span>{tip}</span>
//                                 </div>
//                               )
//                             )}
//                           </div>
//                         </div>
//                       )}

//                     {/* Dermatologist Advice */}
//                     {analysisData.recommendations?.dermatologistAdvice && (
//                       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//                         <h5 className="font-medium text-yellow-900 mb-2">
//                           👨‍⚕️ Professional Advice
//                         </h5>
//                         <p className="text-sm text-yellow-800">
//                           {analysisData.recommendations.dermatologistAdvice}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <div className="flex flex-wrap gap-3">
//                 <button
//                   onClick={() => router.push("/upload")}
//                   className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
//                 >
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
//                     />
//                   </svg>
//                   New Analysis
//                 </button>

//                 <button
//                   onClick={generateReport}
//                   className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
//                 >
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                     />
//                   </svg>
//                   Generate Report
//                 </button>

//                 <button
//                   onClick={() => router.push("/history")}
//                   className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
//                 >
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
//                     />
//                   </svg>
//                   View History
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // เปลี่ยนจาก 'next/router' เป็น 'next/navigation'
import { 
  User, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Sun, 
  Moon, 
  Droplets, 
  Heart, 
  Stethoscope, 
  ShoppingBag, 
  Star, 
  Crown, 
  Shield,
  Lock,
  Loader2
} from 'lucide-react';

export default function SkincareAnalysisResults() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('problems');
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);
  const [userTier, setUserTier] = useState('guest'); // guest, regular, premium

  // Load user tier from localStorage
  useEffect(() => {
    const savedTier = localStorage.getItem('skinai_user_tier') || 'guest';
    setUserTier(savedTier);
  }, []);

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData = {
        skin_problems: [
          {
            problem: "สิว",
            severity: "ปานกลาง",
            description: "พบสิวอักเสบบริเวณหน้าผากและคาง อาจเกิดจากการสะสมของความมันและแบคทีเรีย",
            causes: ["ฮอร์โมน", "ความเครียด", "การทำความสะอาดไม่เพียงพอ"],
            solutions: [
              "ใช้ผลิตภัณฑ์ที่มี Salicylic Acid",
              "หลีกเลี่ยงการแตะหน้า",
              "ทำความสะอาดหน้า 2 ครั้งต่อวัน"
            ]
          },
          {
            problem: "จุดด่างดำ",
            severity: "เล็กน้อย",
            description: "มีจุดด่างดำจากรอยสิวเก่า บริเวณแก้มและจมูก",
            causes: ["รอยแผลเป็นจากสิว", "การสัมผัสแสงแดด"],
            solutions: [
              "ใช้ครีมกันแดดทุกวัน",
              "ใช้ผลิตภัณฑ์ที่มี Vitamin C",
              "พิจารณาการรักษาด้วย Chemical Peel"
            ]
          }
        ],
        daily_routine: {
          morning: [
            {
              step: 1,
              action: "ล้างหน้าด้วยโฟมอ่อนโยน",
              product_type: "Gentle Cleanser",
              duration: "1-2 นาที"
            },
            {
              step: 2,
              action: "ใช้โทนเนอร์ปรับสมดุลผิว",
              product_type: "Balancing Toner",
              duration: "30 วินาที"
            },
            {
              step: 3,
              action: "ทา Vitamin C Serum",
              product_type: "Antioxidant Serum",
              duration: "1 นาที"
            },
            {
              step: 4,
              action: "ทาครีมบำรุงผิว",
              product_type: "Moisturizer",
              duration: "1 นาที"
            },
            {
              step: 5,
              action: "ทาครีมกันแดด SPF 30+",
              product_type: "Sunscreen",
              duration: "1 นาที"
            }
          ],
          evening: [
            {
              step: 1,
              action: "ล้างเครื่องสำอาง (ถ้ามี)",
              product_type: "Makeup Remover",
              duration: "2 นาที"
            },
            {
              step: 2,
              action: "ล้างหน้าด้วยโฟมทำความสะอาด",
              product_type: "Deep Cleanser",
              duration: "2 นาที"
            },
            {
              step: 3,
              action: "ใช้ BHA (วันเว้นวัน)",
              product_type: "Salicylic Acid",
              duration: "ทิ้งไว้ 10 นาที"
            },
            {
              step: 4,
              action: "ทาครีมบำรุงกลางคืน",
              product_type: "Night Moisturizer",
              duration: "1 นาที"
            }
          ],
          lifestyle_tips: [
            "ดื่มน้ำอย่างน้อย 8 แก้วต่อวัน",
            "นอนหลับพักผ่อนให้เพียงพอ 7-8 ชั่วโมง",
            "หลีกเลี่ยงอาหารมัน ของหวาน และนมมากเกินไป",
            "ออกกำลังกายสม่ำเสมอเพื่อเพิ่มการไหลเวียนเลือด",
            "จัดการความเครียดด้วยการทำสมาธิหรือโยคะ"
          ]
        },
        skincare_routine: {
          medical_advice: [
            {
              type: "คำแนะนำทั่วไป",
              advice: "หลีกเลี่ยงการบีบสิวด้วยตัวเอง เพราะอาจทำให้เกิดรอยแผลเป็นและการติดเชื้อ"
            },
            {
              type: "การใช้ผลิตภัณฑ์",
              advice: "เริ่มใช้ผลิตภัณฑ์ใหม่ทีละตัว และทดสอบที่แขนก่อนเพื่อดูการแพ้"
            }
          ],
          product_recommendations: [
            {
              name: "CeraVe Foaming Facial Cleanser",
              category: "ผลิตภัณฑ์ล้างหน้า",
              description: "โฟมล้างหน้าอ่อนโยนที่มี Ceramides ช่วยบำรุงผิวขณะทำความสะอาด",
              usage: "ใช้เช้า-เย็น ลูบเป็นวงกลมแล้วล้างออกด้วยน้ำเย็น",
              price_range: "350-450 บาท"
            },
            {
              name: "The Ordinary Niacinamide 10% + Zinc 1%",
              category: "Treatment",
              description: "เซรั่มลดความมันและรูขุมขน พร้อมสังกะสีที่ช่วยลดการอักเสบ",
              usage: "ใช้เย็น หลังทำความสะอาดหน้า ก่อนครีมบำรุง",
              price_range: "350-400 บาท"
            },
            {
              name: "Neutrogena Ultra Sheer Dry-Touch SPF 50+",
              category: "ครีมกันแดด",
              description: "ครีมกันแดดเนื้อเบา ไม่เหนียวเหนอะหนะ เหมาะสำหรับผิวมัน",
              usage: "ทาก่อนออกแสงแดด 15-30 นาที ทาซ้ำทุก 2 ชั่วโมง",
              price_range: "250-350 บาท"
            },
            {
              name: "Olay Regenerist Micro-Sculpting Cream",
              category: "Anti-aging",
              description: "ครีมบำรุงที่มี Amino-Peptides ช่วยลดริ้วรอยและเพิ่มความยืดหยุ่น",
              usage: "ใช้เย็นหลังทำความสะอาด ทาเป็นวงกลมเบาๆ",
              price_range: "800-1200 บาท"
            },
            {
              name: "Melano CC Intensive Anti-Spot Essence",
              category: "Brightening",
              description: "เซรั่ม Vitamin C เข้มข้นช่วยลดจุดด่างดำและป้องกันการเกิดใหม่",
              usage: "ใช้เช้า หลังทำความสะอาด ก่อนครีมกันแดด",
              price_range: "450-550 บาท"
            },
            {
              name: "Eucerin DermoPurifyer Oil Control Moisturizer",
              category: "ครีมบำรุง",
              description: "ครีมบำรุงสำหรับผิวมันที่ช่วยควบคุมความมันและลดการอักเสบ",
              usage: "ใช้เช้า-เย็น หลังใช้เซรั่มหรือโทนเนอร์",
              price_range: "600-750 บาท"
            }
          ]
        }
      };
      
      setRecommendations(mockData);
      setIsLoading(false);
    };

    fetchRecommendations();
  }, []);

  // Tier information - แก้ไขให้ตรงกับ Navbar
  const tierInfo = {
    guest: { name: 'Guest', color: 'gray', icon: User },
    regular: { name: 'Regular', color: 'blue', icon: Shield },
    premium: { name: 'Premium', color: 'gold', icon: Crown }
  };

  // Get tier display name
  const getTierDisplayName = (tier) => {
    return tierInfo[tier]?.name || 'Guest';
  };

  // Get tier icon
  const getTierIcon = (tier) => {
    return tierInfo[tier]?.icon || User;
  };

  const tabs = [
    { id: 'problems', label: 'ปัญหาผิว', icon: AlertTriangle },
    { id: 'routine', label: 'การดูแลและรักษา', icon: Heart },
    { id: 'products', label: 'สกินแคร์และผลิตภัณฑ์', icon: ShoppingBag }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">กำลังวิเคราะห์ผิวของคุณ</h2>
          <p className="text-gray-600">โปรดรอสักครู่...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ผลการวิเคราะห์ผิวของคุณ
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                {React.createElement(getTierIcon(userTier), { className: "w-4 h-4" })}
                <span>สมาชิก: {getTierDisplayName(userTier)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>วันที่: {new Date().toLocaleDateString('th-TH')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>เวลา: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="flex border-b border-gray-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Problems Tab */}
              {activeTab === 'problems' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      ปัญหาผิวที่พบ
                    </h2>
                    <p className="text-gray-600">
                      การวิเคราะห์และคำแนะนำสำหรับปัญหาผิวของคุณ
                    </p>
                  </div>

                  <div className="grid gap-6">
                    {recommendations?.skin_problems.map((problem, index) => (
                      <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">{problem.problem}</h3>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                problem.severity === 'รุนแรง' ? 'bg-red-100 text-red-800' :
                                problem.severity === 'ปานกลาง' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                ระดับ: {problem.severity}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-6 leading-relaxed">{problem.description}</p>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Info className="w-5 h-5 text-blue-600" />
                              สาเหตุที่เป็นไปได้
                            </h4>
                            <ul className="space-y-2">
                              {problem.causes.map((cause, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-gray-700">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  {cause}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              วิธีการแก้ไข
                            </h4>
                            <ul className="space-y-2">
                              {problem.solutions.map((solution, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-gray-700">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  {solution}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-600" />
                      สรุปและข้อแนะนำ
                    </h3>
                    <div className="space-y-3 text-gray-700">
                      <p>• ปัญหาหลักของผิวคุณคือ <strong>สิว</strong> และ <strong>จุดด่างดำ</strong></p>
                      <p>• ควรเน้นการใช้ผลิตภัณฑ์ที่อ่อนโยนและมีส่วนผสมที่ช่วยลดการอักเสบ</p>
                      <p>• การป้องกันแสงแดดเป็นสิ่งสำคัญในการป้องกันปัญหาเพิ่มเติม</p>
                      <p>• หากปัญหาไม่ดีขึ้นภายใน 6-8 สัปดาห์ ควรปรึกษาแพทย์ผิวหนัง</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Routine Tab */}
              {activeTab === 'routine' && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      การดูแลและรักษา
                    </h2>
                    <p className="text-gray-600">
                      ขั้นตอนการดูแลผิวประจำวันและคำแนะนำการใช้ชีวิต
                    </p>
                  </div>

                  {/* Morning Routine */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Sun className="w-6 h-6 text-yellow-600" />
                      ขั้นตอนเช้า
                    </h3>
                    
                    <div className="space-y-4">
                      {recommendations?.daily_routine.morning.map((step, index) => (
                        <div key={index} className="flex items-start gap-4 bg-white rounded-lg p-4 shadow-sm">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-yellow-600 font-bold text-sm">{step.step}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{step.action}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="bg-gray-100 px-2 py-1 rounded">{step.product_type}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {step.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evening Routine */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Moon className="w-6 h-6 text-indigo-600" />
                      ขั้นตอนเย็น
                    </h3>
                    
                    <div className="space-y-4">
                      {recommendations?.daily_routine.evening.map((step, index) => (
                        <div key={index} className="flex items-start gap-4 bg-white rounded-lg p-4 shadow-sm">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 font-bold text-sm">{step.step}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{step.action}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="bg-gray-100 px-2 py-1 rounded">{step.product_type}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {step.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lifestyle Tips */}
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Droplets className="w-6 h-6 text-green-600" />
                      คำแนะนำการใช้ชีวิต
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {recommendations?.daily_routine.lifestyle_tips.map((tip, index) => (
                        <div key={index} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-700">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Schedule */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-gray-600" />
                      ตารางสัปดาห์
                    </h3>
                    
                    <div className="grid grid-cols-7 gap-2 text-center">
                      {['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map((day, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-semibold text-gray-900 mb-2">{day}</div>
                          <div className="space-y-1 text-xs">
                            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">เช้า: ปกติ</div>
                            <div className={`px-2 py-1 rounded ${
                              index % 2 === 0 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {index % 2 === 0 ? 'เย็น: BHA' : 'เย็น: ปกติ'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="space-y-8">
                  {userTier !== 'guest' ? (
                    <>
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          สกินแคร์และผลิตภัณฑ์
                        </h2>
                        <p className="text-gray-600">
                          ผลิตภัณฑ์และคำแนะนำจากผู้เชี่ยวชาญที่เหมาะสมกับผิวของคุณ
                        </p>
                      </div>

                      {/* Medical Advice Section */}
                      {recommendations.skincare_routine.medical_advice && 
                       recommendations.skincare_routine.medical_advice.length > 0 && (
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
                          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Stethoscope className="w-6 h-6 text-red-600" />
                            คำแนะนำทางการแพทย์
                          </h3>
                          
                          <div className="grid gap-4">
                            {recommendations.skincare_routine.medical_advice.map((advice, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  {advice.type}
                                </h4>
                                <p className="text-gray-700 leading-relaxed">{advice.advice}</p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 p-4 bg-yellow-100 rounded-lg border border-yellow-300">
                            <p className="text-sm text-yellow-800 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>หมายเหตุ:</strong> คำแนะนำเหล่านี้เป็นข้อมูลทั่วไป 
                                หากมีปัญหาผิวรุนแรงหรือต่อเนื่อง ควรปรึกษาแพทย์ผิวหนัง
                              </span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Product Recommendations */}
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                          <ShoppingBag className="w-6 h-6 text-purple-600" />
                          ผลิตภัณฑ์ที่แนะนำ
                        </h3>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {recommendations.skincare_routine.product_recommendations.map((product, index) => (
                            <div key={index} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h4>
                                  <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                    {product.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="text-sm text-gray-600">4.5</span>
                                </div>
                              </div>
                              
                              <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                                {product.description}
                              </p>
                              
                              <div className="space-y-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h5 className="text-sm font-medium text-gray-900 mb-1">วิธีใช้:</h5>
                                  <p className="text-sm text-gray-600">{product.usage}</p>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-sm">
                                    <span className="text-gray-500">ราคา: </span>
                                    <span className="font-semibold text-green-600">{product.price_range}</span>
                                  </div>
                                  <button className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-purple-700 transition-colors">
                                    ดูรายละเอียด
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6 text-center">
                          <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md">
                            ดูผลิตภัณฑ์ทั้งหมด
                          </button>
                        </div>
                      </div>

                      {/* Expert Recommendations for Premium users */}
                      {userTier === 'premium' && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-300">
                          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Crown className="w-6 h-6 text-yellow-600" />
                            คำแนะนำจากผู้เชี่ยวชาญ
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full ml-2">
                              Premium
                            </span>
                          </h3>
                          
                          <div className="grid gap-6">
                            <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-yellow-500">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 mb-2">
                                    ดร. สมชาย วงศ์ผิวหนัง - แพทย์ผิวหนัง
                                  </h4>
                                  <p className="text-gray-700 leading-relaxed mb-3">
                                    "จากการวิเคราะห์ผิวของคุณ แนะนำให้เริ่มต้นด้วยการใช้ผลิตภัณฑ์อ่อนโยนก่อน 
                                    โดยเฉพาะ Gentle Cleanser และ Moisturizer ที่ไม่มี Fragrance 
                                    หลังจากผิวปรับตัวได้แล้ว (ประมาณ 2-3 สัปดาห์) จึงค่อยเพิ่ม Active Ingredients 
                                    เช่น Salicylic Acid หรือ Niacinamide"
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>คำแนะนำเมื่อ: วันนี้</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-purple-500">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 mb-2">
                                    คุณนิดา สกินแคร์ - Beauty Expert
                                  </h4>
                                  <p className="text-gray-700 leading-relaxed mb-3">
                                    "สำหรับการดูแลจุดด่างดำ แนะนำให้ใช้ Vitamin C Serum ในตอนเช้า 
                                    และ Retinol หรือ AHA ในตอนเย็น (สลับกันใช้) อย่าลืมใช้ Sunscreen ทุกวัน 
                                    เพราะเป็นขั้นตอนสำคัญที่สุดในการป้องกันจุดด่างดำใหม่"
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>คำแนะนำเมื่อ: วันนี้</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-green-500">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 mb-2">
                                    คุณมานี โภชนาการ - Nutritionist
                                  </h4>
                                  <p className="text-gray-700 leading-relaxed mb-3">
                                    "การดูแลผิวจากภายในก็สำคัญไม่แพ้การใช้ผลิตภัณฑ์ แนะนำให้เพิ่ม Omega-3, 
                                    Vitamin E และ Zinc ในอาหาร ลดการบริโภคนมและอาหารที่มี Glycemic Index สูง 
                                    ดื่มน้ำให้เพียงพอ และนอนหลับให้เพียงพอ 7-8 ชั่วโมงต่อวัน"
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>คำแนะนำเมื่อ: วันนี้</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-300">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Info className="w-5 h-5 text-yellow-600" />
                              การติดตามผล
                            </h4>
                            <p className="text-gray-700 text-sm mb-3">
                              ผู้เชี่ยวชาญแนะนำให้ถ่ายรูปผิวหน้าทุกสัปดาห์เพื่อติดตามความคืบหน้า 
                              และปรับแผนการดูแลตามความเหมาะสม
                            </p>
                            <div className="flex gap-3">
                              <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition-colors">
                                นัดหมายปรึกษา
                              </button>
                              <button className="bg-white text-yellow-600 border border-yellow-600 px-4 py-2 rounded-lg text-sm hover:bg-yellow-50 transition-colors">
                                ถ่ายรูปติดตาม
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Regular User Features */}
                      {userTier === 'regular' && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-blue-600" />
                            คำแนะนำสำหรับสมาชิก Regular
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2">
                              Regular
                            </span>
                          </h3>
                          
                          <div className="grid gap-4">
                            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                การดูแลพื้นฐาน
                              </h4>
                              <p className="text-gray-700 leading-relaxed">
                                ตามขั้นตอนการดูแลที่แนะนำอย่างสม่ำเสมอ และจดบันทึกการเปลี่ยนแปลงของผิว 
                                เพื่อประเมินประสิทธิภาพของผลิตภัณฑ์
                              </p>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Info className="w-5 h-5 text-green-600" />
                                เคล็ดลับประหยัด
                              </h4>
                              <p className="text-gray-700 leading-relaxed">
                                เริ่มต้นด้วยผลิตภัณฑ์พื้นฐาน 3-4 ชิ้น ก่อนที่จะเพิ่มผลิตภัณฑ์อื่นๆ 
                                เพื่อประเมินผลและประหยัดค่าใช้จ่าย
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        คำแนะนำผลิตภัณฑ์สำหรับสมาชิก
                      </h3>
                      <p className="text-gray-600 mb-6">
                        สมัครสมาชิกเพื่อรับคำแนะนำผลิตภัณฑ์และการรักษาจากผู้เชี่ยวชาญ
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => router.push('/register')}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Shield className="w-5 h-5" />
                          สมัครสมาชิก Regular
                        </button>
                        <button
                          onClick={() => router.push('/premium')}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Crown className="w-5 h-5" />
                          อัพเกรด Premium
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              พิมพ์ผลการวิเคราะห์
            </button>
            
            <button
              onClick={() => router.push('/upload')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              วิเคราะห์ใหม่
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              กลับหน้าหลัก
            </button>
          </div>

          {/* Upgrade Prompt for Regular Users */}
          {userTier === 'regular' && (
            <div className="mt-8 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-6 border border-yellow-300 text-center">
              <Crown className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                อัพเกรดเป็น Premium เพื่อรับสิทธิพิเศษเพิ่มเติม
              </h3>
              <p className="text-gray-600 mb-4">
                รับคำแนะนำจากผู้เชี่ยวชาญ 3 ท่าน, การติดตามผลแบบเรียลไทม์, และผลิตภัณฑ์แนะนำเฉพาะบุคคล
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/premium')}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
                >
                  <Crown className="w-5 h-5" />
                  อัพเกรด Premium
                </button>
                <button
                  onClick={() => router.push('/compare-plans')}
                  className="bg-white text-yellow-600 border border-yellow-600 px-6 py-3 rounded-lg hover:bg-yellow-50 transition-colors"
                >
                  เปรียบเทียบแผน
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
