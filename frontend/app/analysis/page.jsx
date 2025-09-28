"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 👇 Base URL ของ BE (ใช้ env ได้ หรือ fallback 4000)
const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

// 👇 แปลงทั้ง path แบบ relative (/uploads/xxx.jpg) และ absolute
const makeUrl = (p) => {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p; // absolute แล้ว
  return new URL(p, API_BASE_URL).href;  // ต่อ base 4000 ให้
};

export default function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [imageUrls, setImageUrls] = useState({ original: null, cropped: null });
  const router = useRouter();

  useEffect(() => {
    const loadAnalysisData = () => {
      try {
        const storedData = sessionStorage.getItem("skinai_analysis_result");

        if (!storedData) {
          setError("No analysis data found. Please upload an image first.");
          setLoading(false);
          return;
        }

        const backendResponse = JSON.parse(storedData);
        console.log("📊 Backend response:", backendResponse);

        if (!backendResponse.success) {
          setError(backendResponse.error || "Analysis failed");
          setLoading(false);
          return;
        }

        // ✅ Fix: Use the correct data structure from your API
        setAnalysisData(backendResponse);

        // ✅ Fix: Set up image URLs properly
        // const baseUrl =
        //   process.env.NODE_ENV === "development"
        //     ? "http://localhost:8000" // Your FastAPI backend URL
        //     : window.location.origin;

        // const originalImageUrl = backendResponse.originalImage
        //   ? `${baseUrl}${backendResponse.originalImage}`
        //   : null;
        // const croppedImageUrl = backendResponse.croppedImage
        //   ? `${baseUrl}${backendResponse.croppedImage}`
        //   : null;
        const originalImageUrl = makeUrl(backendResponse.originalImage);
        const croppedImageUrl  = makeUrl(backendResponse.croppedImage);

        setImageUrls({
          original: originalImageUrl,
          cropped: croppedImageUrl,
        });

        console.log("🖼️ Image URLs:", { originalImageUrl, croppedImageUrl });

        setLoading(false);
      } catch (e) {
        console.error("❌ Failed to load analysis data:", e);
        setError("Failed to load analysis data");
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, []);

  // ✅ Helper Functions - Fixed to use correct API structure
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "good":
        return "text-green-600 bg-green-100";
      case "mild":
        return "text-yellow-600 bg-yellow-100";
      case "moderate":
        return "text-orange-600 bg-orange-100";
      case "severe":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  // ✅ Generate Report Function
  const generateReport = () => {
    try {
      if (!analysisData) {
        alert("No analysis data available");
        return;
      }

      const reportData = {
        analysisId: analysisData.analysisId,
        created_at: analysisData.timestamp,
        skin_analysis: {
          health_score:
            analysisData.skinAnalysis?.overall_health?.health_score || 0,
          health_category:
            analysisData.skinAnalysis?.overall_health?.health_category ||
            "unknown",
          total_detections: analysisData.skinAnalysis?.total_detections || 0,
          detected_issues: analysisData.skinAnalysis?.detectedIssues || [],
          detection_counts: analysisData.skinAnalysis?.detectionCounts || {},
          face_detected: analysisData.faceDetection?.detected || false,
          confidence: Math.round(
            (analysisData.faceDetection?.confidence || 0) * 100
          ),
        },
        recommendations: {
          skincare_routine:
            analysisData.recommendations?.skincareRecommendations || [],
          lifestyle_tips:
            analysisData.recommendations?.lifestyleRecommendations || [],
          skin_type: analysisData.recommendations?.skinType || "Unknown",
          condition:
            analysisData.recommendations?.conditionAssessment || "Unknown",
          timeline:
            analysisData.recommendations?.improvementTimeline || "Unknown",
        },
        images: {
          original: analysisData.originalImage,
          cropped: analysisData.croppedImage,
        },
        processing_time: analysisData.processing_time,
      };

      sessionStorage.setItem(
        "current_analysis_report",
        JSON.stringify(reportData)
      );
      console.log("✅ Report data prepared:", reportData);
      router.push(`/report?id=${analysisData.analysisId}`);
    } catch (error) {
      console.error("❌ Failed to generate report:", error);
      alert("Failed to generate report. Please try again.");
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
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Analysis Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "Please upload an image first"}
          </p>
          <button
            onClick={() => router.push("/upload")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Upload New Image
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Skin Analysis Results
              </h1>
              <p className="text-gray-600">
                Analysis completed on{" "}
                {new Date(analysisData.timestamp).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                ID: {analysisData.analysisId}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>Processing: {analysisData.processing_time}s</span>
                <span>
                  • Issues: {analysisData.skinAnalysis?.total_detections || 0}
                </span>
                <span>
                  • Health Score:{" "}
                  {analysisData.skinAnalysis?.overall_health?.health_score || 0}
                  /100
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
            {/* ✅ Face Detected badge */}
            {analysisData.faceDetection?.detected && (
              <span className="px-3 py-1 rounded-full text-sm font-medium text-green-600 bg-green-100">
                Face Detected (
                {Math.round((analysisData.faceDetection.confidence || 0) * 100)}%)
              </span>
            )}

            {/* ✅ Gemini badge */}
            {analysisData.geminiSuccess && (
              <span className="px-3 py-1 rounded-full text-sm font-medium text-indigo-600 bg-indigo-100">
                Gemini: {analysisData.geminiModel || '1.5-flash'}
              </span>
            )}

            {/* ✅ Health category badge */}
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(
                analysisData.recommendations?.severity || 'mild'
              )}`}
            >
              {analysisData.skinAnalysis?.overall_health?.health_category?.replace(
                /_/g,
                ' '
              ) || 'Unknown'}
            </span>
          </div>

          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Images and Quick Stats */}
          <div className="lg:col-span-1">
            {/* Images */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Analysis Images
              </h3>

              {/* Original Image */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Original Image
                </h4>
                {imageUrls.original ? (
                  <img
                    src={imageUrls.original}
                    alt="Original analysis image"
                    className="w-full rounded-lg shadow-md"
                    onLoad={() => console.log("✅ Original image loaded")}
                    onError={(e) => {
                      console.error(
                        "❌ Failed to load original image:",
                        imageUrls.original
                      );
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}

                <div
                  className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"
                  style={{ display: imageUrls.original ? "none" : "flex" }}
                >
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm">Original image not available</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Path: {analysisData?.originalImage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cropped Face Image */}
              {imageUrls.cropped && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Detected Face Region
                  </h4>
                  <img
                    src={imageUrls.cropped}
                    alt="Cropped face region"
                    className="w-full rounded-lg shadow-md"
                    onLoad={() => console.log("✅ Cropped image loaded")}
                    onError={(e) => {
                      console.error(
                        "❌ Failed to load cropped image:",
                        imageUrls.cropped
                      );
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Analysis Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Health Score</span>
                  <span
                    className={`font-bold ${getHealthScoreColor(
                      analysisData.skinAnalysis?.overall_health?.health_score ||
                        0
                    )}`}
                  >
                    {analysisData.skinAnalysis?.overall_health?.health_score ||
                      0}
                    /100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Health Category</span>
                  <span className="font-medium capitalize">
                    {analysisData.skinAnalysis?.overall_health?.health_category?.replace(
                      /_/g,
                      " "
                    ) || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Issues Found</span>
                  <span className="font-medium">
                    {analysisData.skinAnalysis?.total_detections || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skin Type</span>
                  <span className="font-medium">
                    {analysisData.recommendations?.skinType || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Face Detection</span>
                  <span
                    className={`font-medium ${
                      analysisData.faceDetection?.detected
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {analysisData.faceDetection?.detected
                      ? "Success"
                      : "Failed"}
                  </span>
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
                  {["overview", "analysis", "recommendations"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Face Detection Status */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Face Detection Status
                      </h4>
                      <div
                        className={`rounded-lg p-4 ${
                          analysisData.faceDetection?.detected
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              analysisData.faceDetection?.detected
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          <span
                            className={`font-medium ${
                              analysisData.faceDetection?.detected
                                ? "text-green-800"
                                : "text-red-800"
                            }`}
                          >
                            {analysisData.faceDetection?.detected
                              ? "Face Successfully Detected"
                              : "Face Detection Failed"}
                          </span>
                        </div>
                        <div
                          className={`text-sm ml-6 ${
                            analysisData.faceDetection?.detected
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          <p>
                            Method:{" "}
                            {analysisData.faceDetection?.detection_method ||
                              "Unknown"}
                          </p>
                          <p>
                            Confidence:{" "}
                            {Math.round(
                              (analysisData.faceDetection?.confidence || 0) *
                                100
                            )}
                            %
                          </p>
                          <p>
                            Total faces:{" "}
                            {analysisData.faceDetection?.total_faces || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Health Status */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Overall Health Status
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-medium">
                            Health Score
                          </span>
                          <span
                            className={`text-2xl font-bold ${getHealthScoreColor(
                              analysisData.skinAnalysis?.overall_health
                                ?.health_score || 0
                            )}`}
                          >
                            {analysisData.skinAnalysis?.overall_health
                              ?.health_score || 0}
                            /100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              (analysisData.skinAnalysis?.overall_health
                                ?.health_score || 0) >= 80
                                ? "bg-green-500"
                                : (analysisData.skinAnalysis?.overall_health
                                    ?.health_score || 0) >= 60
                                ? "bg-yellow-500"
                                : (analysisData.skinAnalysis?.overall_health
                                    ?.health_score || 0) >= 40
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${
                                analysisData.skinAnalysis?.overall_health
                                  ?.health_score || 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 capitalize">
                          Category:{" "}
                          {analysisData.skinAnalysis?.overall_health?.health_category?.replace(
                            /_/g,
                            " "
                          ) || "Unknown"}
                        </p>
                      </div>
                    </div>

                    {/* Detected Issues */}
                    {analysisData.skinAnalysis?.detectedIssues &&
                    analysisData.skinAnalysis.detectedIssues.length > 0 ? (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          Detected Issues
                        </h4>
                        <div className="space-y-3">
                          {analysisData.skinAnalysis.detectedIssues.map(
                            (issue, index) => {
                              const count =
                                analysisData.skinAnalysis.detectionCounts[
                                  issue
                                ] || 1;
                              const details =
                                analysisData.skinAnalysis.detection_details?.[
                                  issue
                                ];

                              return (
                                <div
                                  key={index}
                                  className="bg-gray-50 rounded-lg p-4"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium capitalize">
                                      {issue.replace(/_/g, " ")}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600">
                                        Count: {count}
                                      </span>
                                      {details?.severity && (
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(
                                            details.severity
                                          )}`}
                                        >
                                          {details.severity}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {details && (
                                    <div className="text-sm text-gray-600">
                                      {issue === "texture_variation" &&
                                        details.variance && (
                                          <p>
                                            Texture variance:{" "}
                                            {Math.round(details.variance)}
                                          </p>
                                        )}
                                      {issue === "redness" &&
                                        details.red_dominance && (
                                          <p>
                                            Red dominance:{" "}
                                            {Math.round(details.red_dominance)}%
                                          </p>
                                        )}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-green-800">
                            No significant skin issues detected
                          </span>
                        </div>
                        <p className="text-sm text-green-700 mt-2 ml-6">
                          Your skin appears to be in good condition. Continue
                          with your current skincare routine.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis Tab */}
                {activeTab === "analysis" && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Technical Analysis Details
                    </h4>

                    {/* Face Detection Details */}
                    {analysisData.faceDetection && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3">
                          Face Detection Results
                        </h5>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">
                              Detection Method:
                            </span>
                            <p className="text-gray-600">
                              {analysisData.faceDetection.detection_method}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Confidence:</span>
                            <p className="text-gray-600">
                              {Math.round(
                                (analysisData.faceDetection.confidence || 0) *
                                  100
                              )}
                              %
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Face Region:</span>
                            <p className="text-gray-600">
                              {analysisData.faceDetection.coordinates?.width} ×{" "}
                              {analysisData.faceDetection.coordinates?.height}{" "}
                              pixels
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Total Faces:</span>
                            <p className="text-gray-600">
                              {analysisData.faceDetection.total_faces}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Face Analysis Details */}
                    {analysisData.faceDetection?.face_analysis && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3">
                          Face Analysis Metrics
                        </h5>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Brightness:</span>
                            <p className="text-gray-600">
                              {Math.round(
                                analysisData.faceDetection.face_analysis
                                  .brightness
                              )}
                              /255
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">
                              Texture Variance:
                            </span>
                            <p className="text-gray-600">
                              {Math.round(
                                analysisData.faceDetection.face_analysis
                                  .texture_variance
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Aspect Ratio:</span>
                            <p className="text-gray-600">
                              {
                                analysisData.faceDetection.face_analysis
                                  .aspect_ratio
                              }
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">
                              Mean Color (RGB):
                            </span>
                            <p className="text-gray-600">
                              R:
                              {Math.round(
                                analysisData.faceDetection.face_analysis
                                  .mean_color.r
                              )}
                              , G:
                              {Math.round(
                                analysisData.faceDetection.face_analysis
                                  .mean_color.g
                              )}
                              , B:
                              {Math.round(
                                analysisData.faceDetection.face_analysis
                                  .mean_color.b
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* OpenCV Analysis */}
                    {analysisData.skinAnalysis?.opencv_analysis && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-3">
                          OpenCV Analysis Results
                        </h5>
                        <div className="text-sm text-blue-800 space-y-2">
                          <p>
                            • Analysis Method:{" "}
                            {analysisData.skinAnalysis.analysis_method}
                          </p>
                          <p>
                            • Analysis Region:{" "}
                            {
                              analysisData.skinAnalysis.opencv_analysis
                                .analysis_region
                            }
                          </p>
                          <p>
                            • Total Issues:{" "}
                            {
                              analysisData.skinAnalysis.opencv_analysis
                                .total_issues
                            }
                          </p>
                          <p>
                            • Detected Classes:{" "}
                            {analysisData.skinAnalysis.detected_classes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === "recommendations" && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">
                      AI Recommendations
                    </h4>

                    {/* Skin Assessment */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-2">
                        Skin Assessment
                      </h5>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>
                          • Skin Type:{" "}
                          {analysisData.recommendations?.skinType || "Unknown"}
                        </p>
                        <p>
                          • Condition:{" "}
                          {analysisData.recommendations?.conditionAssessment ||
                            "Unknown"}
                        </p>
                        <p>
                          • Expected Timeline:{" "}
                          {analysisData.recommendations?.improvementTimeline ||
                            "Unknown"}
                        </p>
                      </div>
                    </div>

                    {/* Skincare Recommendations */}
                    {analysisData.recommendations?.skincareRecommendations &&
                      analysisData.recommendations.skincareRecommendations
                        .length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-800 mb-3">
                            Skincare Routine
                          </h5>
                          <div className="space-y-3">
                            {analysisData.recommendations.skincareRecommendations.map(
                              (rec, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-blue-600 text-sm font-medium">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <p className="text-gray-700">{rec}</p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Lifestyle Recommendations */}
                    {analysisData.recommendations?.lifestyleRecommendations &&
                      analysisData.recommendations.lifestyleRecommendations
                        .length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h5 className="font-medium text-green-900 mb-3">
                            💡 Lifestyle Tips
                          </h5>
                          <div className="space-y-1 text-sm text-green-800">
                            {analysisData.recommendations.lifestyleRecommendations.map(
                              (tip, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-green-600">•</span>
                                  <span>{tip}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Dermatologist Advice */}
                    {analysisData.recommendations?.dermatologistAdvice && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h5 className="font-medium text-yellow-900 mb-2">
                          👨‍⚕️ Professional Advice
                        </h5>
                        <p className="text-sm text-yellow-800">
                          {analysisData.recommendations.dermatologistAdvice}
                        </p>
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
                  onClick={() => router.push("/upload")}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  New Analysis
                </button>

                <button
                  onClick={generateReport}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Generate Report
                </button>

                <button
                  onClick={() => router.push("/history")}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
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
