'use client'

import { useUser } from '../contexts/UserContext'
import { useRouter } from 'next/navigation'

export default function TierStatus() {
  const { user, checkUploadLimit } = useUser()
  const router = useRouter()
  
  if (!user) return null

  const uploadStatus = checkUploadLimit()
  
  const getTierInfo = (tier) => {
    const tiers = {
      guest: {
        name: 'Guest',
        icon: '🔍',
        color: 'from-gray-400 to-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-800',
        description: 'Limited access - Sign up for more features'
      },
      regular: {
        name: 'Regular',
        icon: '👤',
        color: 'from-blue-500 to-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        description: 'Standard features with history tracking'
      },
      premium: {
        name: 'Premium',
        icon: '⭐',
        color: 'from-yellow-400 to-orange-500',
        bgColor: 'bg-gradient-to-r from-yellow-50 to-orange-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        description: 'Full access to all AI features and insights'
      }
    }
    return tiers[tier] || tiers.guest
  }

  const tierInfo = getTierInfo(user.tier)

  return (
    <div className={`${tierInfo.bgColor} border ${tierInfo.borderColor} rounded-lg p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-r ${tierInfo.color} rounded-full flex items-center justify-center text-white font-bold`}>
            {tierInfo.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold ${tierInfo.textColor}`}>
                {tierInfo.name} Account
              </h3>
              {user.isGuest && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Temporary
                </span>
              )}
            </div>
            <p className={`text-sm ${tierInfo.textColor} opacity-80`}>
              {tierInfo.description}
            </p>
          </div>
        </div>

        <div className="text-right">
          {/* Upload Status */}
          {uploadStatus && (
            <div className="mb-2">
              <div className={`text-sm font-medium ${tierInfo.textColor}`}>
                {uploadStatus.remaining}/{uploadStatus.limit} uploads left
              </div>
              <div className="w-24 bg-white bg-opacity-50 rounded-full h-2 mt-1">
                <div 
                  className={`h-2 bg-gradient-to-r ${tierInfo.color} rounded-full transition-all duration-300`}
                  style={{ width: `${(uploadStatus.remaining / uploadStatus.limit) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          {user.tier !== 'premium' && (
            <button
              onClick={() => router.push(user.isGuest ? '/signin' : '/upgrade')}
              className={`text-xs bg-gradient-to-r ${tierInfo.color} text-white px-3 py-1 rounded-full hover:shadow-md transition-all duration-200`}
            >
              {user.isGuest ? 'Sign Up' : 'Upgrade'}
            </button>
          )}
        </div>
      </div>

      {/* Feature Preview */}
      {user.tier !== 'premium' && (
        <div className="mt-3 pt-3 border-t border-white border-opacity-50">
          <div className="flex flex-wrap gap-2 text-xs">
            {user.tier === 'guest' ? (
              <>
                <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full">🚫 No History</span>
                <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full">🚫 Limited Analysis</span>
                <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full">🚫 No Routines</span>
              </>
            ) : (
              <>
                <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full">🚫 No AI Insights</span>
                <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full">🚫 No Weekly Routines</span>
                <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full">🚫 Limited Uploads</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
