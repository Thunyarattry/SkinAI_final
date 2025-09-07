'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useState, useMemo } from 'react';

export default function LineChartCard({ 
  data = [],
  title = "แนวโน้มความรุนแรง",
  subtitle = "ติดตามการเปลี่ยนแปลงของอาการ",
  height = 320,
  showGrid = true,
  showLegend = true,
  showTrend = true,
  colorScheme = 'blue',
  dateFormat = 'short',
  yAxisLabel = "คะแนนความรุนแรง",
  xAxisLabel = "วันที่",
  className = "",
  onPointClick = null,
  showAverage = false,
  showGoalLine = false,
  goalValue = null,
  animationDuration = 1000
}) {
  const [activePoint, setActivePoint] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // all, 7d, 30d, 90d

  // 🎨 Color schemes
  const colorSchemes = {
    blue: {
      primary: '#3B82F6',
      gradient: ['#3B82F6', '#1D4ED8'],
      light: '#EFF6FF',
      dark: '#1E40AF'
    },
    green: {
      primary: '#10B981',
      gradient: ['#10B981', '#047857'],
      light: '#ECFDF5',
      dark: '#065F46'
    },
    red: {
      primary: '#EF4444',
      gradient: ['#EF4444', '#DC2626'],
      light: '#FEF2F2',
      dark: '#B91C1C'
    },
    purple: {
      primary: '#8B5CF6',
      gradient: ['#8B5CF6', '#7C3AED'],
      light: '#F5F3FF',
      dark: '#5B21B6'
    }
  };

  const colors = colorSchemes[colorScheme] || colorSchemes.blue;

  // 📅 Date formatting
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    switch (dateFormat) {
      case 'short':
        return date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
      case 'long':
        return date.toLocaleDateString('th-TH', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      case 'time':
        return date.toLocaleString('th-TH', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return date.toLocaleDateString('th-TH');
    }
  };

  // 📊 Process data with time filtering
  const processedData = useMemo(() => {
    if (!data.length) return [];

    // Filter by time range
    let filteredData = data;
    if (timeRange !== 'all') {
      const days = parseInt(timeRange.replace('d', ''));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filteredData = data.filter(d => new Date(d.ts) >= cutoffDate);
    }

    // Sort by timestamp
    filteredData.sort((a, b) => new Date(a.ts) - new Date(b.ts));

    return filteredData.map((d, index) => ({
      x: formatDate(d.ts),
      y: d.severityScore,
      originalDate: d.ts,
      index,
      improvement: index > 0 ? d.severityScore - filteredData[index - 1].severityScore : 0,
      ...d // Include other properties
    }));
  }, [data, timeRange, dateFormat]);

  // 📈 Calculate statistics
  const stats = useMemo(() => {
    if (!processedData.length) return {};

    const values = processedData.map(d => d.y);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[values.length - 1];
    const first = values[0];
    const trend = latest - first;
    const trendPercent = first !== 0 ? ((trend / first) * 100) : 0;

    return {
      average: average.toFixed(1),
      min,
      max,
      latest,
      first,
      trend: trend.toFixed(1),
      trendPercent: trendPercent.toFixed(1),
      improvement: trend < 0 // Lower severity = improvement
    };
  }, [processedData]);

  // 🎯 Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <div className="font-medium text-gray-900 mb-2">{label}</div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">คะแนน:</span>
            <span className="font-semibold" style={{ color: colors.primary }}>
              {payload[0].value}
            </span>
          </div>
          {data.improvement !== 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">การเปลี่ยนแปลง:</span>
              <span className={`font-semibold ${data.improvement > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {data.improvement > 0 ? '+' : ''}{data.improvement.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 📊 Custom dot
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;

    const isActive = activePoint === payload.index;
    const isImprovement = payload.improvement < 0;
    const isWorsening = payload.improvement > 0;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={isActive ? 6 : 4}
        fill={isWorsening ? '#EF4444' : isImprovement ? '#10B981' : colors.primary}
        stroke="white"
        strokeWidth={2}
        className="cursor-pointer transition-all duration-200"
        onClick={() => {
          setActivePoint(payload.index);
          if (onPointClick) onPointClick(payload);
        }}
      />
    );
  };

  // 📱 Time range buttons
  const timeRanges = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: '7d', label: '7 วัน' },
    { key: '30d', label: '30 วัน' },
    { key: '90d', label: '90 วัน' }
  ];

  if (!data.length) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <p>ยังไม่มีข้อมูลสำหรับแสดงกราф</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {timeRanges.map((range) => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">ล่าสุด</div>
            <div className="text-lg font-semibold" style={{ color: colors.primary }}>
              {stats.latest}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">เฉลี่ย</div>
            <div className="text-lg font-semibold text-gray-700">
              {stats.average}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">แนวโน้ม</div>
            <div className={`text-lg font-semibold flex items-center ${
              stats.improvement ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.improvement ? '📈' : '📉'} {stats.trend}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">ช่วง</div>
            <div className="text-lg font-semibold text-gray-700">
              {stats.min} - {stats.max}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart
            data={processedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E5E7EB"
                opacity={0.6}
              />
            )}
            
            <XAxis 
              dataKey="x"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
            />
            
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {showLegend && (
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
            )}

            {/* Average Reference Line */}
            {showAverage && stats.average && (
              <ReferenceLine 
                y={parseFloat(stats.average)} 
                stroke={colors.primary}
                strokeDasharray="5 5"
                strokeOpacity={0.6}
                label={{ value: `เฉลี่ย: ${stats.average}`, position: 'topRight' }}
              />
            )}

            {/* Goal Reference Line */}
            {showGoalLine && goalValue && (
              <ReferenceLine 
                y={goalValue} 
                stroke="#10B981"
                strokeDasharray="8 4"
                strokeWidth={2}
                label={{ value: `เป้าหมาย: ${goalValue}`, position: 'topRight' }}
              />
            )}

            {/* Main Line */}
            <Line
              type="monotone"
              dataKey="y"
              stroke={colors.primary}
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ 
                r: 6, 
                fill: colors.primary,
                stroke: 'white',
                strokeWidth: 2
              }}
              animationDuration={animationDuration}
              name="คะแนนความรุนแรง"
            />

            {/* Trend Line */}
            {showTrend && processedData.length > 1 && (
              <Line
                type="linear"
                dataKey="y"
                stroke={stats.improvement ? '#10B981' : '#EF4444'}
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                opacity={0.5}
                name="แนวโน้ม"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      {Object.keys(stats).length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">📊 สรุปผล</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              • คะแนนความรุนแรงล่าสุด: <span className="font-medium">{stats.latest}</span>
            </p>
            <p>
              • แนวโน้ม: 
              <span className={`font-medium ml-1 ${stats.improvement ? 'text-green-600' : 'text-red-600'}`}>
                {stats.improvement ? 'ดีขึ้น' : 'แย่ลง'} {Math.abs(stats.trend)} คะแนน
                ({Math.abs(stats.trendPercent)}%)
              </span>
            </p>
            <p>
              • ค่าเฉลี่ย: <span className="font-medium">{stats.average}</span> คะแนน
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
