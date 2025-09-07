import './globals.css'
import Navbar from '../components/Navbar'
import { UserProvider } from '../contexts/UserContext'

// ✅ เพิ่ม metadata สำหรับ SEO (Server Component เท่านั้น)
export const metadata = {
  title: 'SkinAI - AI Skin Analysis',
  description: 'Advanced AI-powered skin analysis and personalized skincare recommendations',
  keywords: 'skin analysis, AI, skincare, dermatology, beauty, health',
  author: 'SkinAI Team',
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'SkinAI - AI Skin Analysis',
    description: 'Get personalized skincare recommendations with our advanced AI technology',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkinAI - AI Skin Analysis',
    description: 'Advanced AI-powered skin analysis platform',
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* ✅ เพิ่ม meta tags สำคัญ */}
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* ✅ Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* ✅ Preconnect สำหรับ performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* ✅ Google Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      
      <body className="antialiased bg-gray-50 text-gray-900">
        {/* ✅ Client Components Wrapper */}
        <ClientWrapper>
          {/* ✅ Skip to main content สำหรับ accessibility */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
          >
            Skip to main content
          </a>
          
          {/* ✅ Navigation */}
          <Navbar />
          
          {/* ✅ Main Content */}
          <main 
            id="main-content"
            className="min-h-screen"
            role="main"
          >
            <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
              {children}
            </div>
          </main>
          
          {/* ✅ Footer */}
          <Footer />
        </ClientWrapper>
      </body>
    </html>
  )
}

// ✅ Client Wrapper Component (แยกออกมา)
function ClientWrapper({ children }) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}

// ✅ Footer Component (Server Component)
function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SkinAI</h3>
            <p className="text-gray-600 mb-4 max-w-md">
              Advanced AI-powered skin analysis platform providing personalized 
              skincare recommendations and professional insights.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-600">
              <li><a href="/upload" className="hover:text-blue-600 transition-colors">Upload & Analyze</a></li>
              <li><a href="/history" className="hover:text-blue-600 transition-colors">Analysis History</a></li>
              <li><a href="/about" className="hover:text-blue-600 transition-colors">About Us</a></li>
              <li><a href="/contact" className="hover:text-blue-600 transition-colors">Contact</a></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-600">
              <li><a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
              <li><a href="/disclaimer" className="hover:text-blue-600 transition-colors">Medical Disclaimer</a></li>
              <li><a href="/cookies" className="hover:text-blue-600 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} SkinAI. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2 md:mt-0">
            ⚠️ For educational purposes only. Consult a dermatologist for medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}


