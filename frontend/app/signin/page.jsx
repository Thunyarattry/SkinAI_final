'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../../contexts/UserContext'

export default function SignInPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    accountType: 'trial'
  })
  const [loading, setLoading] = useState(false)
  const { signIn, startTrialSession } = useUser()
  const router = useRouter()

  const removeLocalStorage = () => {
    localStorage.removeItem('skinai_last_upload');
    localStorage.removeItem('skinai_history');
    localStorage.removeItem('skinai_last_analysis');
    localStorage.removeItem('skinai_user');
    localStorage.removeItem('skinai_analysis_history');
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)

  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    signIn(formData)
    removeLocalStorage();
    localStorage.setItem('skinai_user', JSON.stringify(formData))
    window.dispatchEvent(new Event("userChanged"))
    router.push('/upload')
  } catch (error) {
    console.error('Sign in error:', error)
    alert('Sign in failed. Please try again.')
  } finally {
    setLoading(false)
  }
}

  const handleTrialStart = () => {
    setLoading(true)
    try {
      startTrialSession()
      router.push('/upload')
    } catch (error) {
      console.error('Trial start error:', error)
      alert('Failed to start trial. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to SkinAI
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your skin analysis dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                id="accountType"
                value={formData.accountType}
                onChange={(e) => setFormData({...formData, accountType: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="trial">Free Trial (24 hours)</option>
                <option value="premium">Premium Account</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleTrialStart}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Starting Trial...' : 'Start Free Trial'}
              </button>
              <p className="mt-2 text-xs text-gray-500 text-center">
                No registration required • 24-hour access • Limited features
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
