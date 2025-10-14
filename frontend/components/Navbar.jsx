// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { usePathname, useRouter } from 'next/navigation'
// import { useUser } from '../contexts/UserContext'

// export default function Navbar() {
//   const [isMenuOpen, setIsMenuOpen] = useState(false)
//   const pathname = usePathname()
//   const router = useRouter()
//   const { user, signOut } = useUser()

//   const handleSignIn = () => {
//     router.push('/signin')
//   }

//   const handleSignOut = () => {
//     signOut()
//     router.push('/')
//   }

//   const navItems = [
//     { href: '/upload', label: 'Upload' },
//     { href: '/analysis', label: 'Analysis' },
//     // { href: '/report', label: 'Report' },
//     { href: '/history', label: 'History' },
//   ]

//   return (
//     <nav className="bg-white shadow-sm border-b">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16">
//           {/* Logo */}
//           <div className="flex items-center">
//             <Link href="/" className="flex-shrink-0">
//               <span className="text-2xl font-bold text-blue-600">Skin AI</span>
//             </Link>
//           </div>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center space-x-8">
//             {navItems.map((item) => (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
//                   pathname === item.href
//                     ? 'text-blue-600 bg-blue-50'
//                     : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
//                 }`}
//               >
//                 {item.label}
//               </Link>
//             ))}

//             {/* Desktop Auth */}
//             <div className="flex items-center space-x-4">
//               {user ? (
//                 <div className="flex items-center space-x-3">
//                   <span className="text-sm text-gray-700">Hello, {user.name}</span>
//                   <button
//                     onClick={handleSignOut}
//                     className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
//                   >
//                     Logout
//                   </button>
//                 </div>
//               ) : (
//                 <button
//                   onClick={handleSignIn}
//                   className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
//                 >
//                   Sign In
//                 </button>
//               )}
//             </div>
//           </div>

//           {/* Mobile menu button */}
//           <div className="md:hidden flex items-center">
//             <button
//               onClick={() => setIsMenuOpen(!isMenuOpen)}
//               className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
//             >
//               <span className="sr-only">Open main menu</span>
//               {/* Hamburger */}
//               {!isMenuOpen ? (
//                 <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                 </svg>
//               ) : (
//                 <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Mobile menu */}
//       {isMenuOpen && (
//         <div className="md:hidden bg-gray-50 px-2 pt-2 pb-3 space-y-1 sm:px-3">
//           {navItems.map((item) => (
//             <Link
//               key={item.href}
//               href={item.href}
//               className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
//                 pathname === item.href
//                   ? 'text-blue-600 bg-blue-100'
//                   : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
//               }`}
//               onClick={() => setIsMenuOpen(false)}
//             >
//               {item.label}
//             </Link>
//           ))}

//           {/* Mobile Auth */}
//           <div className="pt-4 pb-3 border-t border-gray-200">
//             {user ? (
//               <div className="px-3 space-y-2">
//                 <div className="text-base font-medium text-gray-800">{user.name}</div>
//                 <div className="text-sm text-gray-500">{user.email}</div>
//                 <button
//                   onClick={handleSignOut}
//                   className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
//                 >
//                   Logout
//                 </button>
//               </div>
//             ) : (
//               <button
//                 onClick={handleSignIn}
//                 className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50"
//               >
//                 Sign In
//               </button>
//             )}
//           </div>
//         </div>
//       )}
//     </nav>
//   )
// }
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  Upload, 
  BarChart3, 
  Crown,
  Sparkles,
  Home,
  Camera,
  History,
  Bell,
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // ✅ เพิ่มฟังก์ชัน checkUploadLimit ใน component
  const checkUploadLimit = () => {
    if (!user) return null;
    
    const today = new Date().toDateString();
    const uploadKey = `skinai_uploads_${today}`;
    const todayUploads = parseInt(localStorage.getItem(uploadKey) || '0');
    
    // กำหนด limit ตาม tier
    const limits = {
      guest: 3,
      regular: 10,
      premium: 50,
      pro: 999
    };
    
    const userTier = user.tier || 'regular';
    const maxUploads = limits[userTier] || limits.regular;
    
    return {
      current: todayUploads,
      max: maxUploads,
      remaining: Math.max(0, maxUploads - todayUploads),
      isLimitReached: todayUploads >= maxUploads,
      percentage: Math.min(100, (todayUploads / maxUploads) * 100)
    };
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown') && !event.target.closest('.profile-button')) {
        setIsProfileOpen(false);
      }
      if (!event.target.closest('.mobile-menu') && !event.target.closest('.menu-button')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Get navigation items based on user status
  const getNavItems = () => {
    const baseItems = [
      { href: '/', label: 'Home', icon: Home },
      { href: '/upload', label: 'Analyze', icon: Camera },
    ];

    if (user) {
      baseItems.push(
        { href: '/history', label: 'History', icon: History },
        { href: '/dashboard', label: 'Dashboard', icon: BarChart3 }
      );
    }

    return baseItems;
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    router.push('/');
  };

  // Get tier styling
  const getTierBadge = (tier) => {
    const styles = {
      guest: 'bg-gray-100 text-gray-700',
      regular: 'bg-blue-100 text-blue-700',
      premium: 'bg-purple-100 text-purple-700',
      pro: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
    };
    
    const icons = {
      guest: null,
      regular: null,
      premium: <Sparkles className="w-3 h-3" />,
      pro: <Crown className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[tier] || styles.regular}`}>
        {icons[tier]}
        {tier?.toUpperCase() || 'REGULAR'}
      </span>
    );
  };

  const navItems = getNavItems();
  const uploadStatus = user ? checkUploadLimit() : null; // ✅ ใช้ฟังก์ชันที่อยู่ใน component

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SkinAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            
            {/* Upload Status (Desktop) */}
            {user && uploadStatus && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-lg">
                <Upload className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {uploadStatus.current}/{uploadStatus.max}
                </span>
                <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadStatus.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Notifications */}
            {user && (
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="profile-button flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name || 'User'}
                    </p>
                    <div className="flex items-center space-x-1">
                      {getTierBadge(user.tier)}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="profile-dropdown absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2 z-50">
                    
                    {/* User Info */}
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="mt-2 flex items-center justify-between">
                        {getTierBadge(user.tier)}
                        {uploadStatus && (
                          <span className="text-xs text-gray-500">
                            {uploadStatus.remaining} uploads left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Upload Progress */}
                    {uploadStatus && (
                      <div className="px-4 py-2 border-b">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Daily Usage</span>
                          <span>{uploadStatus.current}/{uploadStatus.max}</span>
                        </div>
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              uploadStatus.percentage > 80 ? 'bg-red-500' : 
                              uploadStatus.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${uploadStatus.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      
                      <Link
                        href="/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>

                      {user.tier !== 'pro' && (
                        <Link
                          href="/upgrade"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Crown className="w-4 h-4" />
                          <span>Upgrade Plan</span>
                        </Link>
                      )}
                      
                      <hr className="my-1" />
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Auth Buttons */
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="menu-button md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mobile-menu md:hidden py-4 border-t">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Upload Status */}
              {user && uploadStatus && (
                <div className="px-3 py-2 mt-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Daily Usage</span>
                    <span className="text-sm text-gray-600">
                      {uploadStatus.current}/{uploadStatus.max}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        uploadStatus.percentage > 80 ? 'bg-red-500' : 
                        uploadStatus.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${uploadStatus.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {uploadStatus.remaining} uploads remaining
                  </p>
                </div>
              )}

              {/* Mobile Auth */}
              {!user && (
                <div className="pt-4 border-t space-y-2">
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
