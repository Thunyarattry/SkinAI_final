// 'use client';
// import Link from 'next/link';

// function Feature({ title, subtitle }) {
//   return (
//     <div className="card">
//       <div className="text-5xl">💡</div>
//       <div className="font-semibold mt-2">{title}</div>
//       <div className="muted text-sm">{subtitle}</div>
//     </div>
//   );
// }

// export default function HomePage() {
//   return (
//     <div>
//       <section className="relative rounded-[28px] overflow-hidden bg-gradient-to-b from-blue-50 to-indigo-50 border border-slate-200/60">
//         <div className="container-xl text-center py-14 md:py-20">
//           <div className="h1 max-w-3xl mx-auto">Incredibly powerful, simple and time-saving solutions for every team</div>
//           <p className="muted max-w-2xl mx-auto mt-4">
//             It’s time to say bye to machine forms. We present a more human approach for skin analysis.
//             Create reports and publish them. Get an email for each response.
//           </p>
//           <div className="mt-6">
//             <Link href="/signin" className="btn btn-primary">Sign in</Link>
//           </div>
//           <div className="mt-10">
//             <img src="/hero-people.svg" alt="hero" className="mx-auto h-40 opacity-90"/>
//           </div>
//         </div>
//       </section>

//       <section className="text-center py-14">
//         <div className="h2">Easy and more human online form builder for every team</div>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
//           <Feature title="Smart and intelligent" subtitle="AI analysis of your skin"/>
//           <Feature title="Big time saver" subtitle="One-click report & PDF"/>
//           <Feature title="Organized and analyzed" subtitle="History dashboard"/>
//         </div>
//         <div className="mt-8">
//           <Link href="/upload" className="text-blue-700 font-medium">Explore more about 3 forms</Link>
//         </div>
//       </section>
//     </div>
//   );
// }
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = async () => {
    setIsLoading(true)
    // Simulate quick setup or go directly to upload
    setTimeout(() => {
      router.push('/upload')
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Skin Analysis
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Get personalized skincare recommendations with advanced AI technology
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            Upload your photo and receive detailed skin analysis with customized AM/PM routines, 
            product recommendations.
          </p>
          
          <div className="space-y-6">
            <button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {isLoading ? 'Getting Started...' : 'Get Started for Free'}
            </button>
            
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No signup required
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Instant analysis
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                AI-powered recommendations
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Face Detection</h3>
              <p className="text-gray-600">Precise face detection and cropping</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Skin Analysis</h3>
              <p className="text-gray-600">Accurate acne detection and skin type classification</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Recommendations</h3>
              <p className="text-gray-600">Gemini AI provides personalized skincare routines and product suggestions</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
