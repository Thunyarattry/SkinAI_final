'use client'

import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'

export default function LineChartCard({ data = [] }) {
  const [chartData, setChartData] = useState([])
  const { user } = useUser()

  useEffect(() => {
    if (data.length > 0) {
      // Process data for chart
      const processedData = data
        .slice(-10) // Last 10 entries
        .map((item, index) => ({
          date: new Date(item.timestamp).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          score: item.skinAnalysis?.overall_health?.health_score || item.severityScore || 0,
          issues: item.skinAnalysis?.total_detections || item.detectedIssues?.length || 0,
          index
        }))
        .reverse() // Oldest to newest for chart

      setChartData(processedData)
    }
  }, [data])

  if (!user?.features?.canViewHistory) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Progress Tracking
          </h3>
          <p className="text-gray-600 mb-4">
            Track your skin health progress over time
          </p>
          <button
            onClick={() => window.location.href = user ? '/upgrade' : '/signin'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {user ? 'Upgrade to Premium' : 'Sign Up Now'}
          </button>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📊</span>
          Progress Chart
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-gray-600">
            No data available for chart. Upload more analyses to see your progress.
          </p>
        </div>
      </div>
    )
  }

  const maxScore = Math.max(...chartData.map(d => d.score))
  const minScore = Math.min(...chartData.map(d => d.score))
  const scoreRange = maxScore - minScore || 1

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>📊</span>
          Progress Chart
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Health Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Issues Count</span>
          </div>
        </div>
      </div>

      {/* Simple SVG Chart */}
      <div className="relative">
        <svg width="100%" height="200" className="overflow-visible">
          {/* Grid Lines */}
          {[0, 25, 50, 75, 100].map((value) => (
            <g key={value}>
              <line
                x1="0"
                y1={200 - (value * 2)}
                x2="100%"
                y2={200 - (value * 2)}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
              <text
                x="0"
                y={200 - (value * 2) - 5}
                fontSize="12"
                fill="#9ca3af"
              >
                {value}
              </text>
            </g>
          ))}

          {/* Health Score Line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={chartData.map((d, i) => 
              `${(i / (chartData.length - 1)) * 100}%,${200 - (d.score * 2)}`
            ).join(' ')}
          />

          {/* Issues Count Line */}
          <polyline
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="5,5"
            points={chartData.map((d, i) => 
              `${(i / (chartData.length - 1)) * 100}%,${200 - (d.issues * 10)}`
            ).join(' ')}
          />

          {/* Data Points */}
          {chartData.map((d, i) => (
            <g key={i}>
              {/* Health Score Point */}
              <circle
                cx={`${(i / (chartData.length - 1)) * 100}%`}
                cy={200 - (d.score * 2)}
                r="4"
                fill="#3b82f6"
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>{`${d.date}: Health Score ${d.score}`}</title>
              </circle>
              
              {/* Issues Count Point */}
              <circle
                cx={`${(i / (chartData.length - 1)) * 100}%`}
                cy={200 - (d.issues * 10)}
                r="3"
                fill="#ef4444"
                className="hover:r-5 transition-all cursor-pointer"
              >
                <title>{`${d.date}: ${d.issues} issues`}</title>
              </circle>
            </g>
          ))}
        </svg>

        {/* X-axis Labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {chartData.map((d, i) => (
            <span key={i} className={i % 2 === 0 ? '' : 'opacity-50'}>
              {d.date}
            </span>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {chartData[chartData.length - 1]?.score || 0}
          </div>
          <div className="text-xs text-gray-500">Latest Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {maxScore}
          </div>
          <div className="text-xs text-gray-500">Best Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {chartData.length}
          </div>
          <div className="text-xs text-gray-500">Total Analyses</div>
        </div>
      </div>

      {/* Trend Analysis (Premium Feature) */}
      {user?.features?.hasDetailedAnalysis && chartData.length >= 3 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">📈</span>
            <span className="font-medium text-gray-900">Trend Analysis:</span>
            <span className="text-gray-600">
              {(() => {
                const recent = chartData.slice(-3).map(d => d.score)
                const trend = recent[2] - recent[0]
                return trend > 5 ? 'Improving steadily' :
                       trend > 0 ? 'Slight improvement' :
                       trend < -5 ? 'Needs attention' :
                       'Stable condition'
              })()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
