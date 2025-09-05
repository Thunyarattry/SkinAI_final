// 'use client';
// import Link from 'next/link';
// import { usePathname, useRouter } from 'next/navigation';
// import { useEffect, useState } from 'react';

// export default function Navbar() {
//   const pathname = usePathname();
//   const router = useRouter();
//   const [name, setName] = useState('');

//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       setName(localStorage.getItem('skinai_user') || '');
//     }
//   }, [pathname]);

//   const onLogout = () => {
//     localStorage.removeItem('skinai_user');
//     router.push('/');
//   };

//   return (
//     <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur">
//       <div className="container-xl flex items-center justify-between py-3">
//         <Link href="/" className="flex items-center gap-2">
//           <span className="font-semibold text-pink-600 text-xl">SkinAI</span>
//         </Link>

//         <nav className="hidden md:flex items-center gap-6 text-slate-600">
//           <Link href="/upload" className="hover:text-slate-900">Upload</Link>
//           <Link href="/analysis" className="hover:text-slate-900">Analysis</Link>
//           <Link href="/report" className="hover:text-slate-900">Report</Link>
//           <Link href="/history" className="hover:text-slate-900">History</Link>
//         </nav>

//         <div className="flex items-center gap-3">
//           {name ? (<div className="hidden sm:block text-sm text-slate-600">Hi, {name}</div>) : null}
//           <button onClick={name? onLogout: () => router.push('/signin')} className="btn btn-primary rounded-full">
//             {name ? 'Log out' : 'Sign in'}
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// }


// 'use client';

// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';

// export default function Navbar() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [isDemo, setIsDemo] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     if (typeof window === 'undefined') return;
//     setIsDemo(Boolean(localStorage.getItem('demoUser')));

//     const onStorage = (e) => {
//       if (e.key === 'demoUser') setIsDemo(Boolean(e.newValue));
//     };
//     window.addEventListener('storage', onStorage);
//     return () => window.removeEventListener('storage', onStorage);
//   }, []);

//   const handleLogout = () => {
//     try {
//       localStorage.removeItem('demoUser');
//     } catch (e) {}
//     setIsOpen(false);
//     setIsDemo(false);
//     router.push('/');
//   };

//   const links = [
//     { href: '/upload', label: 'Upload' },
//     { href: '/analysis', label: 'Analysis' },
//     { href: '/report', label: 'Report' },
//     { href: '/history', label: 'History' },
//   ];

//   return (
//     <nav className="bg-white shadow-md sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4">
//         <div className="flex justify-between items-center h-16">
//           <div className="flex items-center">
//             <Link href="/" className="text-xl font-bold">
//               SkinAI
//             </Link>
//           </div>

//           {/* Desktop menu */}
//           <div className="hidden md:flex space-x-4 items-center">
//             {links.map((l) => (
//               <Link
//                 key={l.href}
//                 href={l.href}
//                 className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
//               >
//                 {l.label}
//               </Link>
//             ))}
//             {!isDemo ? (
//               <Link
//                 href="/signin"
//                 className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
//               >
//                 Sign in
//               </Link>
//             ) : (
//               <button
//                 onClick={handleLogout}
//                 className="px-3 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600"
//               >
//                 Logout
//               </button>
//             )}
//           </div>

//           {/* Mobile hamburger */}
//           <div className="md:hidden flex items-center">
//             <button
//               aria-label="Open menu"
//               onClick={() => setIsOpen(!isOpen)}
//               className="p-2 rounded-md focus:outline-none"
//             >
//               <svg
//                 className="w-6 h-6"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d={
//                     isOpen
//                       ? 'M6 18L18 6M6 6l12 12'
//                       : 'M4 6h16M4 12h16M4 18h16'
//                   }
//                 />
//               </svg>
//             </button>
//           </div>
//         </div>
//       </div>

//       {isOpen && (
//         <div className="md:hidden bg-white border-t shadow-sm">
//           <div className="px-2 pt-2 pb-3 space-y-1">
//             {links.map((l) => (
//               <Link
//                 key={l.href}
//                 href={l.href}
//                 onClick={() => setIsOpen(false)}
//                 className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-50"
//               >
//                 {l.label}
//               </Link>
//             ))}
//             {!isDemo ? (
//               <Link
//                 href="/signin"
//                 onClick={() => setIsOpen(false)}
//                 className="block px-3 py-2 rounded-md text-base font-medium bg-indigo-600 text-white text-center"
//               >
//                 Sign in
//               </Link>
//             ) : (
//               <button
//                 onClick={handleLogout}
//                 className="w-full text-left block px-3 py-2 rounded-md text-base font-medium bg-red-500 text-white"
//               >
//                 Logout
//               </button>
//             )}
//           </div>
//         </div>
//       )}
//     </nav>
//   );
// }




'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
  const updateUser = () => {
    const userData = localStorage.getItem('skinai_user')
    setUser(userData ? JSON.parse(userData) : null)
  }

  updateUser()
  window.addEventListener("userChanged", updateUser)

  return () => window.removeEventListener("userChanged", updateUser)
}, [])

  const handleSignIn = () => {
    router.push('/signin')
  }

  const handleSignOut = () => {
  localStorage.removeItem('skinai_user')
  window.dispatchEvent(new Event("userChanged"))
  setUser(null)
  router.push('/')
}

  const navItems = [
    { href: '/upload', label: 'Upload' },
    { href: '/analysis', label: 'Analysis' },
    { href: '/report', label: 'Report' },
    { href: '/history', label: 'History' },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-blue-600">Skin AI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Desktop Auth Button */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">Hello, {user.name}</span>
                  <button
                    onClick={handleSignOut}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Close icon */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === item.href
                  ? 'text-blue-600 bg-blue-100'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {/* Mobile Auth Button */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div className="px-3 space-y-2">
                <div className="text-base font-medium text-gray-800">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
