'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../../contexts/UserContext'

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const { user, addAnalysis, isTrialUser, isTrialExpired } = useUser()
  const router = useRouter()
  
  // If trial expired (only for logged-in users)
  if (user && isTrialExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trial Expired</h2>
          <p className="text-gray-600 mb-6">Your free trial has expired. Please sign up for a premium account.</p>
          <button 
            onClick={() => router.push('/signin')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign Up for Premium
          </button>
        </div>
      </div>
    )
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const simulateAnalysis = async (file) => {
    const analysisResults = {
      fileName: file.name,
      fileSize: file.size,
      uploadTime: new Date().toISOString(),
      skinCondition: 'Acne Analysis',
      severity: Math.random() > 0.5 ? 'Moderate' : 'Mild',
      confidence: Math.floor(Math.random() * 20) + 80,
      affectedAreas: [
        { area: 'Forehead', severity: 'Mild', percentage: Math.floor(Math.random() * 20) + 10 },
        { area: 'Cheeks', severity: 'Moderate', percentage: Math.floor(Math.random() * 30) + 15 },
        { area: 'Chin', severity: 'Moderate', percentage: Math.floor(Math.random() * 25) + 10 },
        { area: 'Nose', severity: 'Mild', percentage: Math.floor(Math.random() * 15) + 5 }
      ],
      recommendations: [
        'Use gentle, non-comedogenic cleansers twice daily',
        'Apply topical retinoid treatment as prescribed',
        'Avoid touching or picking at affected areas',
        'Use oil-free, broad-spectrum sunscreen daily',
        'Consider consulting a dermatologist for advanced treatment'
      ],
      treatmentPlan: {
        phase1: 'Initial treatment (Weeks 1-4): Gentle cleansing routine',
        phase2: 'Maintenance (Weeks 5-8): Add topical treatments',
        phase3: 'Follow-up (Week 12): Reassess and adjust treatment'
      }
    }
    return analysisResults
  }

  const handleAnalyze = async () => {
  if (!selectedFile) return;

  setAnalyzing(true);
  try {
    // Store last upload with metadata
    const lastUpload = {
      name: selectedFile.name,
      size: selectedFile.size,
      preview,
      uploadTime: new Date().toISOString(),
    };
    localStorage.setItem('skinai_last_upload', JSON.stringify(lastUpload));

    const analysisResults = await simulateAnalysis(selectedFile);
    if (user) {
      addAnalysis(analysisResults);
    }

    router.push('/analysis');
  } catch (error) {
    console.error('Analysis error:', error);
    alert('Analysis failed. Please try again.');
  } finally {
    setAnalyzing(false);
  }
};



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* User Info Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {user ? (
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
                <p className="text-gray-600">
                  Account Type: {isTrialUser ? 'Free Trial' : 'Premium'} • 
                  Signed in: {new Date(user.signInTime).toLocaleDateString()}
                </p>
              </div>
              {isTrialUser && (
                <div className="text-right">
                  <div className="text-sm text-orange-600 font-medium">
                    Trial expires: {new Date(user.trialExpiresAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Welcome, Guest</h1>
              <p className="text-gray-600">You are using guest mode. Sign in to save your reports.</p>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Skin Image for Analysis</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {preview ? (
              <div className="space-y-4">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="mx-auto max-h-64 rounded-lg shadow-md"
                />
                <div>
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload or drag and drop
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </span>
                  </label>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  'Start Analysis'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
