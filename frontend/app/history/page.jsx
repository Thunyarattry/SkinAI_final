// 'use client';
// import { getHistory } from '../../lib/storage';
// import { useEffect, useState } from 'react';
// import LineChartCard from '../../components/LineChartCard';
// import BeforeAfterCompare from '../../components/BeforeAfterCompare';

// export default function HistoryPage(){
//   const [rows, setRows] = useState([]);

//   useEffect(()=>{ setRows(getHistory()); }, []);

//   const last = rows[rows.length-1];
//   const prev = rows[rows.length-2];

//   return (
//     <div className="grid md:grid-cols-2 gap-6 items-start">
//       <LineChartCard data={rows} />
//       <div className="card">
//         <div className="h2 mb-2">ประวัติการวิเคราะห์</div>
//         {rows.length? (
//           <ul className="text-sm text-slate-700 space-y-1 max-h-72 overflow-auto">
//             {rows.slice().reverse().map((r,i)=>(
//               <li key={i} className="flex items-center justify-between border-b py-2">
//                 <span>{new Date(r.ts).toLocaleString()}</span>
//                 <span className="font-medium">{r.severity} ({Math.round(r.severityScore)})</span>
//               </li>
//             ))}
//           </ul>
//         ) : <div className="muted">ยังไม่มีข้อมูล</div>}
//       </div>
//       {(last && prev) ? <BeforeAfterCompare before={prev.image} after={last.image} /> : <div className="card">อัปโหลดอย่างน้อย 2 ครั้งเพื่อเปรียบเทียบ Before–After</div>}
//     </div>
//   );
// }



'use client';
import { getHistory } from '../../lib/storage';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, TrendingUp, Eye, BarChart3, Camera, Clock } from 'lucide-react';
import LineChartCard from '../../components/LineChartCard';
import BeforeAfterCompare from '../../components/BeforeAfterCompare';

export default function HistoryPage(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, week, month
  const router = useRouter();

  useEffect(() => { 
    try {
      const historyData = getHistory();
      setRows(historyData || []);
    } catch (error) {
      console.error('Error loading history:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Filter data by period
  const getFilteredData = () => {
    if (selectedPeriod === 'all') return rows;
    
    const now = new Date();
    const filterDate = new Date();
    
    if (selectedPeriod === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    }
    
    return rows.filter(row => new Date(row.ts) >= filterDate);
  };

  const filteredRows = getFilteredData();
  const last = filteredRows[filteredRows.length - 1];
  const prev = filteredRows[filteredRows.length - 2];

  // ✅ Calculate statistics
  const getStats = () => {
    if (filteredRows.length === 0) return null;
    
    const scores = filteredRows.map(r => r.severityScore || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const trend = filteredRows.length >= 2 
      ? scores[scores.length - 1] - scores[0]
      : 0;
    
    return {
      totalAnalyses: filteredRows.length,
      avgScore: Math.round(avgScore),
      trend: Math.round(trend),
      bestScore: Math.max(...scores),
      latestScore: scores[scores.length - 1] || 0
    };
  };

  const stats = getStats();

  // ✅ View analysis details
  const viewAnalysis = (analysis) => {
    // Store analysis data for report page
    const reportData = {
      analysisId: analysis.id,
      timestamp: analysis.ts,
      originalImage: analysis.image,
      skinAnalysis: {
        skinType: analysis.skinType,
        skinCondition: analysis.skinCondition,
        severity: analysis.severity,
        severityScore: analysis.severityScore,
        detectedIssues: analysis.detectedIssues || [],
        recommendations: analysis.recommendations || []
      },
      faceDetected: analysis.faceDetected,
      geminiSuccess: analysis.geminiSuccess || false
    };
    
    sessionStorage.setItem('current_analysis_report', JSON.stringify(reportData));
    router.push(`/report?id=${analysis.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-700">กำลังโหลดประวัติ...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                ประวัติการวิเคราะห์ผิว
              </h1>
              <p className="text-gray-600 mt-1">
                ติดตามความก้าวหน้าของสุขภาพผิวของคุณ
              </p>
            </div>
            
            {/* Period Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">ช่วงเวลา:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="week">7 วันที่ผ่านมา</option>
                <option value="month">30 วันที่ผ่านมา</option>
              </select>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">การวิเคราะห์</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">{stats.totalAnalyses}</div>
                <div className="text-xs text-blue-600">ครั้ง</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">คะแนนเฉลี่ย</span>
                </div>
                <div className="text-2xl font-bold text-green-700">{stats.avgScore}</div>
                <div className="text-xs text-green-600">จาก 100</div>
              </div>
              
              <div className={`p-4 rounded-lg ${stats.trend >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className={`w-4 h-4 ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-sm font-medium ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>แนวโน้ม</span>
                </div>
                <div className={`text-2xl font-bold ${stats.trend >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {stats.trend >= 0 ? '+' : ''}{stats.trend}
                </div>
                <div className={`text-xs ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.trend >= 0 ? 'ดีขึ้น' : 'แย่ลง'}
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-600 font-medium">คะแนนสูงสุด</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">{stats.bestScore}</div>
                <div className="text-xs text-purple-600">จาก 100</div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-600 font-medium">ล่าสุด</span>
                </div>
                <div className="text-2xl font-bold text-orange-700">{stats.latestScore}</div>
                <div className="text-xs text-orange-600">จาก 100</div>
              </div>
            </div>
          )}
        </div>

        {filteredRows.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              ยังไม่มีข้อมูลการวิเคราะห์
            </h2>
            <p className="text-gray-500 mb-6">
              เริ่มต้นการวิเคราะห์ผิวของคุณเพื่อติดตามความก้าวหน้า
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              เริ่มวิเคราะห์ผิว
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            
            {/* Chart */}
            <div className="space-y-6">
              <LineChartCard data={filteredRows} />
              
              {/* Before/After Comparison */}
              {(last && prev) ? (
                <BeforeAfterCompare 
                  before={prev.image} 
                  after={last.image}
                  beforeDate={prev.ts}
                  afterDate={last.ts}
                  beforeScore={prev.severityScore}
                  afterScore={last.severityScore}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    เปรียบเทียบ Before & After
                  </h3>
                  <div className="text-center py-8">
                    <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      อัปโหลดอย่างน้อย 2 ครั้งเพื่อเปรียบเทียบ Before–After
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* History List */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  ประวัติการวิเคราะห์
                  <span className="text-sm font-normal text-gray-500">
                    ({filteredRows.length} รายการ)
                  </span>
                </h2>
              </div>
              
              <div className="max-h-96 overflow-auto">
                {filteredRows.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {filteredRows.slice().reverse().map((r, i) => (
                      <li key={i} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(r.ts).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(r.ts).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600">
                                {r.skinType || 'ไม่ระบุ'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                r.severity === 'Good' || r.severity === 'ดี' 
                                  ? 'bg-green-100 text-green-800'
                                  : r.severity === 'Mild' || r.severity === 'เล็กน้อย'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {r.severity}
                              </span>
                              <span className="font-medium text-blue-600">
                                {Math.round(r.severityScore || 0)}/100
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => viewAnalysis(r)}
                            className="ml-4 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            ดูรายงาน
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    ไม่มีข้อมูลในช่วงเวลาที่เลือก
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => router.push('/upload')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            วิเคราะห์ผิวใหม่
          </button>
          
          {filteredRows.length > 0 && (
            <button
              onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," 
                  + "วันที่,เวลา,ประเภทผิว,สภาพผิว,ระดับความรุนแรง,คะแนน\n"
                  + filteredRows.map(r => 
                      `${new Date(r.ts).toLocaleDateString('th-TH')},${new Date(r.ts).toLocaleTimeString('th-TH')},${r.skinType || ''},${r.skinCondition || ''},${r.severity || ''},${r.severityScore || 0}`
                    ).join("\n");
                
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `skin_analysis_history_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              ส่งออกข้อมูล CSV
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
