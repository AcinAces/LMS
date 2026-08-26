'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userObject, setUserObject] = useState<any>(null);
  
  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Menus
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username);
        setUserObject(user);
        
        const role = localStorage.getItem('role') || user.role?.type || null;
        setUserRole(role);
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
    
    const fetchFreshUser = async () => {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/users/me?populate=role`, {
          headers: { 'Authorization': `Bearer ${jwt}` },
          cache: 'no-store'
        });
        if (res.ok) {
          const freshUser = await res.json();
          localStorage.setItem('user', JSON.stringify(freshUser));
          if (freshUser.role) {
            localStorage.setItem('role', freshUser.role.type);
            setUserRole(freshUser.role.type);
          } else {
            localStorage.removeItem('role');
            setUserRole(null);
          }
          setUsername(freshUser.username);
          setUserObject(freshUser);
        } else if (res.status === 401 || res.status === 403) {
          handleLogout();
        }
      } catch (err) {
        console.error('Failed to fetch fresh user data', err);
      }
    };
    fetchFreshUser();

    // Close mobile menu on route change
    setShowMobileMenu(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('loginTimestamp');
    setUsername(null);
    setUserRole(null);
    setUserObject(null);
    window.location.href = '/';
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const jwt = localStorage.getItem('jwt');
      const payload: any = {
        email: profileEmail,
        currentPassword: currentPassword
      };
      
      if (newPassword) {
        payload.password = newPassword;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/users/${userObject?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to update profile');
      }

      const updatedUser = await res.json();
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserObject(updatedUser);
      setProfileSuccess('Profile updated successfully!');
      
      if (newPassword) {
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setShowProfileModal(false), 2000);
      } else {
        setShowProfileModal(false);
      }
      
    } catch (err: any) {
      setProfileError(err.message || 'An error occurred.');
    } finally {
      setProfileLoading(false);
    }
  };

  const isActive = (path: string) => pathname.startsWith(path);

  // Role-based links logic
  const isStudent = !userRole || (userRole !== 'admin' && userRole !== 'instructor' && userRole !== 'content_manager');

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-slate-950/70 backdrop-blur-xl border-b border-white/5 text-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Left Side */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl sm:text-2xl font-extrabold tracking-tight transition-colors flex items-center gap-1.5 sm:gap-2.5">
              <span>Acin's<span className="text-emerald-500">LMS</span></span>
              <span className="text-slate-600 font-light text-lg sm:text-xl hidden lg:inline">|</span>
              <span className="text-emerald-400 text-lg sm:text-xl font-bold tracking-normal drop-shadow-[0_0_8px_rgba(52,211,153,0.55)] hidden lg:inline">
                "HelloWorld"(print)
              </span>
            </Link>
          </div>

          {/* Desktop Middle Links */}
          <div className="hidden lg:flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
            <Link 
              href="/courses" 
              className={`px-4 py-2 text-base font-medium rounded-lg transition-all underline underline-offset-[6px] decoration-2 ${isActive('/courses') ? 'bg-white/10 text-emerald-400 decoration-emerald-400/50' : 'text-slate-300 hover:text-white hover:bg-white/5 decoration-slate-500/30 hover:decoration-slate-300/60'}`}
            >
              All Courses
            </Link>
            <span className="text-slate-600 font-light">|</span>
            <Link 
              href="/blogs" 
              className={`px-4 py-2 text-base font-medium rounded-lg transition-all underline underline-offset-[6px] decoration-2 ${isActive('/blogs') ? 'bg-white/10 text-emerald-400 decoration-emerald-400/50' : 'text-slate-300 hover:text-white hover:bg-white/5 decoration-slate-500/30 hover:decoration-slate-300/60'}`}
            >
              Blogs
            </Link>
          </div>

          {/* Right Side (Desktop) & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Right Links */}
            <div className="hidden lg:flex items-center space-x-2">
              {userRole === 'admin' && (
                <Link href="/admin" className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${isActive('/admin') ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:text-blue-400 hover:bg-blue-500/10'}`}>Admin</Link>
              )}
              {userRole === 'content_manager' && (
                <Link href="/content-manager" className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${isActive('/content-manager') ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:text-blue-400 hover:bg-blue-500/10'}`}>Manager</Link>
              )}
              {userRole === 'instructor' && (
                <Link href="/instructor" className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${isActive('/instructor') ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:text-blue-400 hover:bg-blue-500/10'}`}>Instructor</Link>
              )}
              {username && isStudent && (
                <>
                  <Link href="/my-courses" className={`px-4 py-2 text-base font-medium rounded-lg transition-all border border-slate-700/80 hover:border-emerald-500/50 ${isActive('/my-courses') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>
                    My Courses
                  </Link>
                  <Link href="/track-progress" className={`px-4 py-2 text-base font-medium rounded-lg transition-all border border-slate-700/80 hover:border-emerald-500/50 ${isActive('/track-progress') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>
                    Progress
                  </Link>
                </>
              )}
            </div>

            {/* Profile Dropdown / Login Button (Visible on all sizes) */}
            {username ? (
              <div className="relative flex items-center border-l border-white/10 pl-2 lg:pl-4" ref={dropdownRef}>
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="cursor-pointer flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-lg text-sm font-medium text-slate-200 hover:text-emerald-400 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 text-emerald-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  <span className="max-w-[80px] sm:max-w-[120px] truncate">{username}</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                
                {showDropdown && (
                  <>
                    
                    <div className="absolute right-0 top-full mt-3 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setProfileError('');
                          setProfileSuccess('');
                          setCurrentPassword('');
                          setNewPassword('');
                          setProfileEmail(userObject?.email || '');
                          setShowProfileModal(true);
                        }}
                        className="cursor-pointer w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        Profile Settings
                      </button>
                      <div className="h-px bg-white/10 my-1"></div>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleLogout();
                        }}
                        className="cursor-pointer w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2 ml-1 text-slate-300 hover:text-white transition-colors border border-slate-700/50 rounded-lg bg-slate-800/30"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="lg:hidden bg-slate-900 border-b border-white/10 px-4 py-4 space-y-2 animate-fade-in-up shadow-2xl absolute w-full" style={{ animationDuration: '0.2s' }}>
            <Link 
              href="/courses" 
              className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/courses') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
            >
              All Courses
            </Link>
            <Link 
              href="/blogs" 
              className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/blogs') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
            >
              Blogs
            </Link>
            
            <div className="h-px bg-white/10 my-2"></div>
            
            {userRole === 'admin' && (
              <Link href="/admin" className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/admin') ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 hover:bg-white/5 hover:text-blue-400'}`}>Admin Dashboard</Link>
            )}
            {userRole === 'content_manager' && (
              <Link href="/content-manager" className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/content-manager') ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 hover:bg-white/5 hover:text-blue-400'}`}>Manager Dashboard</Link>
            )}
            {userRole === 'instructor' && (
              <Link href="/instructor" className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/instructor') ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 hover:bg-white/5 hover:text-blue-400'}`}>Instructor Dashboard</Link>
            )}
            {username && isStudent && (
              <>
                <Link href="/my-courses" className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/my-courses') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                  My Courses
                </Link>
                <Link href="/track-progress" className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/track-progress') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                  Track Progress
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <h3 className="text-2xl font-bold text-white mb-6">Profile Settings</h3>
            
            {profileError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">
                {profileError}
              </div>
            )}
            
            {profileSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg">
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  required
                />
              </div>
              
              <div className="border-t border-white/5 my-4 pt-4">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>

              <div className="bg-slate-950/50 border border-red-500/20 rounded-xl p-4 mt-6">
                <label className="block text-sm font-bold text-red-400 mb-2">Current Password (Required)</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password to verify"
                  className="w-full bg-slate-900 border border-red-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={profileLoading || !currentPassword}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


