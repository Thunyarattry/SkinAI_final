'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Menu, X, User, Settings, LogOut, Crown, Shield, 
  Camera, History, Bell, ChevronDown, Star, Zap 
} from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState('guest');
  const [uploadCount, setUploadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  
  const router = useRouter();
  const pathname = usePathname();
  const profileRef = useRef(null);

  // Get upload limits based on tier
  const getUploadLimits = () => {
    switch (userTier) {
      case 'premium': return { daily: 50, fileSize: 25 * 1024 * 1024 };
      case 'regular': return { daily: 10, fileSize: 15 * 1024 * 1024 };
      default: return { daily: 3, fileSize: 15 * 1024 * 1024 };
    }
  };

  const uploadLimits = getUploadLimits();

  // Load user data from localStorage
  useEffect(() => {
    const loadUserData = () => {
      // Load user tier
      const savedTier = localStorage.getItem('skinai_user_tier') || 'guest';
      setUserTier(savedTier);

      // Load user info (simulate user data)
      const savedUser = localStorage.getItem('skinai_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing user data:', error);
          // Create default user if parsing fails
          const defaultUser = {
            name: getTierDisplayName(savedTier) + ' User',
            email: `user@${savedTier}.com`,
            avatar: null,
            tier: savedTier,
            joinDate: new Date().toISOString()
          };
          setUser(defaultUser);
          localStorage.setItem('skinai_user', JSON.stringify(defaultUser));
        }
      } else {
        // Create default user
        const defaultUser = {
          name: getTierDisplayName(savedTier) + ' User',
          email: `user@${savedTier}.com`,
          avatar: null,
          tier: savedTier,
          joinDate: new Date().toISOString()
        };
        setUser(defaultUser);
        localStorage.setItem('skinai_user', JSON.stringify(defaultUser));
      }

      // Load upload count
      const today = new Date().toDateString();
      const storageKey = `skinai_uploads_${savedTier}_${today}`;
      const stored = localStorage.getItem(storageKey);
      setUploadCount(stored ? parseInt(stored) : 0);

      // Load notifications (simulate)
      const savedNotifications = localStorage.getItem('skinai_notifications');
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications));
        } catch (error) {
          setNotifications([]);
        }
      }
    };

    loadUserData();
  }, []);

  // Update user data when tier changes
  useEffect(() => {
    if (user) {
      const updatedUser = {
        ...user,
        tier: userTier,
        name: getTierDisplayName(userTier) + ' User'
      };
      setUser(updatedUser);
      localStorage.setItem('skinai_user', JSON.stringify(updatedUser));
    }

    // Update upload count for new tier
    const today = new Date().toDateString();
    const storageKey = `skinai_uploads_${userTier}_${today}`;
    const stored = localStorage.getItem(storageKey);
    setUploadCount(stored ? parseInt(stored) : 0);
  }, [userTier]);

  // Get tier display name
  const getTierDisplayName = (tier) => {
    switch (tier) {
      case 'premium': return 'Premium';
      case 'regular': return 'Regular';
      default: return 'Guest';
    }
  };

  // Handle tier switching
  const switchTier = (newTier) => {
    setUserTier(newTier);
    localStorage.setItem('skinai_user_tier', newTier);
  };

  // Handle logout - แก้ไขฟังก์ชันนี้
  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem('skinai_user');
    localStorage.removeItem('skinai_user_tier');
    
    // Clear upload counts
    const today = new Date().toDateString();
    ['guest', 'regular', 'premium'].forEach(tier => {
      localStorage.removeItem(`skinai_uploads_${tier}_${today}`);
    });
    
    // Clear analysis history
    ['guest', 'regular', 'premium'].forEach(tier => {
      localStorage.removeItem(`skinai_analysis_history_${tier}`);
    });
    
    // Clear notifications
    localStorage.removeItem('skinai_notifications');
    
    // Clear session storage
    sessionStorage.removeItem('skinai_analysis_result');
    
    // Reset state
    setUser(null);
    setUserTier('guest');
    setUploadCount(0);
    setNotifications([]);
    setIsProfileOpen(false);
    
    // Redirect to home
    router.push('/');
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation items
  const navItems = [
    { name: 'Home', href: '/', icon: null },
    { name: 'Upload', href: '/upload', icon: Camera },
    { name: 'History', href: '/history', icon: History },
    { name: 'About', href: '/about', icon: null },
  ];

  // Check if current path is active
  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="font-bold text-xl text-gray-900">SkinAI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            
            {/* Tier Switcher (Demo) */}
            <div className="hidden lg:flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => switchTier('guest')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  userTier === 'guest' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Guest
              </button>
              <button
                onClick={() => switchTier('regular')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  userTier === 'regular' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Regular
              </button>
              <button
                onClick={() => switchTier('premium')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  userTier === 'premium' 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Crown className="w-3 h-3 inline mr-1" />
                Premium
              </button>
            </div>

            {/* Upload Count Badge */}
            <div className="hidden sm:flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-1">
              <Camera className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {uploadCount}/{uploadLimits.daily}
              </span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  userTier === 'premium' 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                    : userTier === 'regular'
                    ? 'bg-blue-500'
                    : 'bg-gray-500'
                }`}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    {userTier === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                    {getTierDisplayName(userTier)}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2 z-50">
                  
                  {/* User Info */}
                  <div className="px-4 py-3 border-b">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        userTier === 'premium' 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          : userTier === 'regular'
                          ? 'bg-blue-500'
                          : 'bg-gray-500'
                      }`}>
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user?.name || 'User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user?.email || 'user@example.com'}
                        </div>
                        <div className="flex items-center mt-1">
                          {userTier === 'premium' && <Crown className="w-3 h-3 mr-1 text-yellow-500" />}
                          {userTier === 'regular' && <Shield className="w-3 h-3 mr-1 text-blue-500" />}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            userTier === 'premium' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : userTier === 'regular'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {getTierDisplayName(userTier)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="px-4 py-2 border-b">
                    <div className="text-xs text-gray-500 mb-1">Today's Usage</div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Uploads</span>
                      <span className="text-sm font-medium">
                        {uploadCount}/{uploadLimits.daily}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          userTier === 'premium' 
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min((uploadCount / uploadLimits.daily) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      Profile
                    </Link>
                    
                    <Link
                      href="/history"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <History className="w-4 h-4 mr-3" />
                      Analysis History
                    </Link>
                    
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>

                    {userTier !== 'premium' && (
                      <button
                        onClick={() => {
                          switchTier('premium');
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50"
                      >
                        <Crown className="w-4 h-4 mr-3" />
                        Upgrade to Premium
                      </button>
                    )}
                  </div>

                  {/* Logout */}
                  <div className="border-t pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon && <item.icon className="w-5 h-5" />}
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {/* Mobile Tier Switcher */}
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-gray-700 mb-2">Switch Plan (Demo)</div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => switchTier('guest')}
                    className={`px-3 py-1 text-xs rounded-md ${
                      userTier === 'guest' ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Guest
                  </button>
                  <button
                    onClick={() => switchTier('regular')}
                    className={`px-3 py-1 text-xs rounded-md ${
                      userTier === 'regular' ? 'bg-blue-200' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Regular
                  </button>
                  <button
                    onClick={() => switchTier('premium')}
                    className={`px-3 py-1 text-xs rounded-md ${
                      userTier === 'premium' ? 'bg-yellow-200' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Crown className="w-3 h-3 inline mr-1" />
                    Premium
                  </button>
                </div>
              </div>

              {/* Mobile Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
