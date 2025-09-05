'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analysisHistory, setAnalysisHistory] = useState([])

  useEffect(() => {
    // Load user data from localStorage on mount
    loadUserData()
  }, [])

  const loadUserData = () => {
    try {
      const userData = localStorage.getItem('skinai_user')
      const historyData = localStorage.getItem('skinai_analysis_history')
      
      if (userData) {
        setUser(JSON.parse(userData))
      }
      
      if (historyData) {
        setAnalysisHistory(JSON.parse(historyData))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = (userData) => {
    const userWithId = {
      ...userData,
      id: userData.id || `user_${Date.now()}`,
      signInTime: new Date().toISOString(),
      accountType: userData.accountType || 'trial' // 'trial' or 'premium'
    }
    
    setUser(userWithId)
    localStorage.setItem('skinai_user', JSON.stringify(userWithId))
    
    // Initialize empty analysis history for new user
    if (!localStorage.getItem('skinai_analysis_history')) {
      localStorage.setItem('skinai_analysis_history', JSON.stringify([]))
    }
  }

  const signOut = () => {
    setUser(null)
    setAnalysisHistory([])
    localStorage.removeItem('skinai_user')
    localStorage.removeItem('skinai_analysis_history')
  }

  const addAnalysis = (analysisData) => {
    const newAnalysis = {
      id: `analysis_${Date.now()}`,
      userId: user?.id,
      timestamp: new Date().toISOString(),
      ...analysisData
    }

    const updatedHistory = [newAnalysis, ...analysisHistory]
    setAnalysisHistory(updatedHistory)
    localStorage.setItem('skinai_analysis_history', JSON.stringify(updatedHistory))
    
    return newAnalysis.id
  }

  const getLatestAnalysis = () => {
    return analysisHistory.length > 0 ? analysisHistory[0] : null
  }

  const getUserAnalyses = () => {
    if (!user) return []
    return analysisHistory.filter(analysis => analysis.userId === user.id)
  }

  const startTrialSession = () => {
    const trialUser = {
      id: `trial_${Date.now()}`,
      name: 'Trial User',
      email: 'trial@skinai.com',
      accountType: 'trial',
      signInTime: new Date().toISOString(),
      trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }
    
    signIn(trialUser)
    return trialUser
  }

  const value = {
    user,
    loading,
    analysisHistory,
    signIn,
    signOut,
    addAnalysis,
    getLatestAnalysis,
    getUserAnalyses,
    startTrialSession,
    isTrialUser: user?.accountType === 'trial',
    isTrialExpired: user?.trialExpiresAt ? new Date() > new Date(user.trialExpiresAt) : false
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw Error('useUser must be used within a UserProvider')
  }
  return context
}
