// 'use client';
// import { useEffect, useState } from 'react';
// import PieChartCard from '../../components/PieChartCard';
// import PdfDownloadButton from '../../components/PdfDownloadButton';

// export default function ReportPage(){
//   const [record, setRecord] = useState(null);

//   useEffect(()=>{
//     try { setRecord(JSON.parse(localStorage.getItem('skinai_last_analysis')||'null')); } catch {}
//   }, []);

//   if (!record) return <div className="card">ยังไม่มีผลวิเคราะห์ โปรดไปที่หน้า Analysis ก่อน</div>;

//   return (
//     <div className="grid md:grid-cols-2 gap-6 items-start">
//       <div id="report-card" className="card">
//         <div className="h2 mb-2">Report Summary</div>
//         <div className="mb-2">Severity: <span className="font-semibold">{record.severity}</span> ({Math.round(record.severityScore)})</div>
//         <img src={record.image} className="rounded-xl w-full mb-4" alt="face" />
//         <PieChartCard data={record.pie} />
//       </div>
//       <div className="card">
//         <div className="h2 mb-3">แนะนำสกินแคร์</div>
//         <p className="muted mb-2 text-sm">*เดโม: ข้อมูลนี้จำลอง (ในโปรดักชันสามารถให้ Gemini / VLM สร้างคำแนะนำตามผิวผู้ใช้)*</p>
//         <ul className="list-disc list-inside text-sm">
//           <li>Gentle Cleanser — ลดการอุดตัน เหมาะผิวเป็นสิว</li>
//           <li>Niacinamide 10% — ลดรอยดำ/แดง กระชับรูขุมขน</li>
//           <li>Azelaic Acid 10% — สิวอุดตัน/รอยสิว</li>
//           <li>Sunscreen SPF50 PA++++ — ป้องกันฝ้า กระ รอยเข้ม</li>
//           <li>Moisturizer (Ceramides) — ซ่อมเกราะผิว ลดระคายเคือง</li>
//         </ul>
//         <div className="mt-6">
//           <PdfDownloadButton targetId="report-card" />
//         </div>
//       </div>
//     </div>
//   );
// }


// 'use client'

// import { useState, useEffect } from 'react'
// import Navbar from '../../components/Navbar'
// import PdfDownloadButton from '../../components/PdfDownloadButton'

// export default function Report() {
//   const [reportData, setReportData] = useState(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     // Load report data from localStorage or API
//     const loadReportData = async () => {
//       try {
//         const analysisData = localStorage.getItem('skinai_analysis')
//         if (analysisData) {
//           const analysis = JSON.parse(analysisData)
          
//           // Generate Gemini-powered recommendations
//           const recommendations = await generateRecommendations(analysis)
          
//           setReportData({
//             ...analysis,
//             recommendations
//           })
//         }
//       } catch (error) {
//         console.error('Error loading report data:', error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     loadReportData()
//   }, [])

//   const generateRecommendations = async (analysisData) => {
//     // Mock Gemini API call - replace with actual Gemini integration
//     try {
//       const prompt = `Based on the following skin analysis data, provide personalized skincare recommendations:
      
//       Skin Type: ${analysisData.skinType}
//       Acne Severity: ${analysisData.acneSeverity}
//       Detected Issues: ${analysisData.detectedIssues?.join(', ') || 'None'}
//       Age Group: ${analysisData.ageGroup || 'Not specified'}
      
//       Please provide:
//       1. AM Routine (morning skincare steps)
//       2. PM Routine (evening skincare steps)  
//       3. Product Shortlist (specific product recommendations)
//       4. Avoid (ingredients/products to avoid)
//       5. Expected Timeline (when to expect improvements)
      
//       Format the response as a JSON object with these exact keys: amRoutine, pmRoutine, productShortlist, avoid, expectedTimeline`

//       // Mock response - replace with actual Gemini API call
//       const mockResponse = {
//         amRoutine: [
//           "Gentle cleanser with salicylic acid",
//           "Niacinamide serum (10%)",
//           "Lightweight moisturizer",
//           "Broad-spectrum SPF 30+ sunscreen"
//         ],
//         pmRoutine: [
//           "Oil-based cleanser (if wearing makeup)",
//           "Gentle foaming cleanser",
//           "BHA exfoliant (2-3 times per week)",
//           "Retinol serum (start 1x per week)",
//           "Hyaluronic acid serum",
//           "Night moisturizer"
//         ],
//         productShortlist: [
//           "CeraVe Foaming Facial Cleanser",
//           "The Ordinary Niacinamide 10% + Zinc 1%",
//           "Paula's Choice 2% BHA Liquid Exfoliant",
//           "Neutrogena Ultra Gentle Daily Cleanser",
//           "EltaMD UV Clear Broad-Spectrum SPF 46"
//         ],
//         avoid: [
//           "Harsh scrubs and physical exfoliants",
//           "Products with high alcohol content",
//           "Coconut oil-based products",
//           "Over-cleansing (more than twice daily)",
//           "Picking or squeezing acne"
//         ],
//         expectedTimeline: {
//           "2-4 weeks": "Reduced inflammation and fewer new breakouts",
//           "6-8 weeks": "Improved skin texture and tone",
//           "3-4 months": "Significant reduction in acne and post-inflammatory marks",
//           "6+ months": "Long-term maintenance and prevention"
//         }
//       }

//       return mockResponse
//     } catch (error) {
//       console.error('Error generating recommendations:', error)
//       return null
//     }
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//         </div>
//       </div>
//     )
//   }

//   if (!reportData) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <div className="container mx-auto px-4 py-8">
//           <div className="text-center">
//             <h1 className="text-2xl font-bold text-gray-900 mb-4">No Report Available</h1>
//             <p className="text-gray-600">Please complete an analysis first.</p>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   const { recommendations } = reportData

//   return (
//     <div className="min-h-screen bg-gray-50">
      
//       <div className="container mx-auto px-4 py-8 max-w-4xl">
//         <div className="bg-white rounded-lg shadow-lg p-8">
//           <div className="flex justify-between items-center mb-8">
//             <h1 className="text-3xl font-bold text-gray-900">Personalized Skincare Report</h1>
//             <PdfDownloadButton reportData={reportData} />
//           </div>

//           {/* Analysis Summary */}
//           <div className="mb-8 p-6 bg-blue-50 rounded-lg">
//             <h2 className="text-xl font-semibold text-blue-900 mb-4">Analysis Summary</h2>
//             <div className="grid md:grid-cols-2 gap-4">
//               <div>
//                 <span className="font-medium text-blue-800">Skin Type:</span>
//                 <span className="ml-2 text-blue-700">{reportData.skinType}</span>
//               </div>
//               <div>
//                 <span className="font-medium text-blue-800">Acne Severity:</span>
//                 <span className="ml-2 text-blue-700">{reportData.acneSeverity}</span>
//               </div>
//             </div>
//           </div>

//           {recommendations && (
//             <>
//               {/* AM Routine */}
//               <div className="mb-8">
//                 <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
//                   <span className="mr-2">🌅</span>
//                   Morning Routine (AM)
//                 </h2>
//                 <div className="bg-yellow-50 p-6 rounded-lg">
//                   <ol className="list-decimal list-inside space-y-2">
//                     {recommendations.amRoutine.map((step, index) => (
//                       <li key={index} className="text-gray-700">{step}</li>
//                     ))}
//                   </ol>
//                 </div>
//               </div>

//               {/* PM Routine */}
//               <div className="mb-8">
//                 <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
//                   <span className="mr-2">🌙</span>
//                   Evening Routine (PM)
//                 </h2>
//                 <div className="bg-indigo-50 p-6 rounded-lg">
//                   <ol className="list-decimal list-inside space-y-2">
//                     {recommendations.pmRoutine.map((step, index) => (
//                       <li key={index} className="text-gray-700">{step}</li>
//                     ))}
//                   </ol>
//                 </div>
//               </div>

//               {/* Product Shortlist */}
//               <div className="mb-8">
//                 <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
//                   <span className="mr-2">🛍️</span>
//                   Recommended Products
//                 </h2>
//                 <div className="bg-green-50 p-6 rounded-lg">
//                   <ul className="list-disc list-inside space-y-2">
//                     {recommendations.productShortlist.map((product, index) => (
//                       <li key={index} className="text-gray-700">{product}</li>
//                     ))}
//                   </ul>
//                 </div>
//               </div>

//               {/* Things to Avoid */}
//               <div className="mb-8">
//                 <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
//                   <span className="mr-2">⚠️</span>
//                   What to Avoid
//                 </h2>
//                 <div className="bg-red-50 p-6 rounded-lg">
//                   <ul className="list-disc list-inside space-y-2">
//                     {recommendations.avoid.map((item, index) => (
//                       <li key={index} className="text-gray-700">{item}</li>
//                     ))}
//                   </ul>
//                 </div>
//               </div>

//               {/* Expected Timeline */}
//               <div className="mb-8">
//                 <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
//                   <span className="mr-2">📅</span>
//                   Expected Timeline
//                 </h2>
//                 <div className="bg-purple-50 p-6 rounded-lg">
//                   <div className="space-y-4">
//                     {Object.entries(recommendations.expectedTimeline).map(([timeframe, expectation], index) => (
//                       <div key={index} className="flex flex-col sm:flex-row">
//                         <div className="font-semibold text-purple-800 sm:w-32 mb-1 sm:mb-0">
//                           {timeframe}:
//                         </div>
//                         <div className="text-gray-700 flex-1">
//                           {expectation}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </>
//           )}

//           {/* Disclaimer */}
//           <div className="mt-8 p-4 bg-gray-100 rounded-lg">
//             <p className="text-sm text-gray-600">
//               <strong>Disclaimer:</strong> This report is generated by AI and should not replace professional medical advice. 
//               Please consult with a dermatologist for serious skin concerns or before starting new skincare treatments.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

'use client'

import { Suspense } from 'react'
import ReportContent from './ReportContent'

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  )
}