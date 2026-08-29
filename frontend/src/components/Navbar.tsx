'use client';

import Link from 'next/link';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import PasswordRequirementsList from './PasswordRequirementsList';
import { checkPasswordRequirements } from '@/utils/password';

function timeAgo(dateParam: string | Date) {
  if (!dateParam) return '';
  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
  const today = new Date();
  const seconds = Math.round((today.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);

  if (seconds < 60) return `${seconds < 0 ? 0 : seconds} seconds ago`;
  else if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  else if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  else if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  else if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  else if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  else return `${years} year${years > 1 ? 's' : ''} ago`;
}

export default function Navbar() {
  const { t } = useLanguage();
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const studentDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleStudentClickOutside(event: MouseEvent) {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
        setShowStudentDropdown(false);
      }
    }
    if (showStudentDropdown) document.addEventListener('mousedown', handleStudentClickOutside);
    return () => document.removeEventListener('mousedown', handleStudentClickOutside);
  }, [showStudentDropdown]);

  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [username, setUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userObject, setUserObject] = useState<any>(null);
  
  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveAvatarDirectly = async (avatarData: string | null) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) return;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          email: userObject?.email,
          avatar: avatarData
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUserObject(updatedUser);
        toast.success(avatarData ? 'Profile picture updated successfully!' : 'Profile picture removed!');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error?.message || 'Failed to save avatar');
      }
    } catch (e) {
      console.error('Auto-save avatar failed:', e);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setProfileAvatar(dataUrl);
          // Sync directly with backend without requiring password
          saveAvatarDirectly(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
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

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{unread: any[], marked: any[]}>({ unread: [], marked: [] });
  const [activeNotifTab, setActiveNotifTab] = useState<'unread' | 'marked'>('unread');
  const notifRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleNotifClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) document.addEventListener('mousedown', handleNotifClickOutside);
    return () => document.removeEventListener('mousedown', handleNotifClickOutside);
  }, [showNotifications]);

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
    
    const fetchNotifications = async () => {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-messages/notifications`, {
          headers: { 'Authorization': `Bearer ${jwt}` },
          cache: 'no-store'
        });
        if (res.ok) {
          const json = await res.json();
          setNotifications(json.data || { unread: [], marked: [] });
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchFreshUser();
    fetchNotifications();

    // Close mobile menu on route change
    setShowMobileMenu(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
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
        avatar: profileAvatar
      };
      
      if (currentPassword) {
        payload.currentPassword = currentPassword;
      }

      if (newPassword && newPassword.trim()) {
        const reqs = checkPasswordRequirements(newPassword.trim());
        if (!reqs.isValid) {
          let msg = 'Password requirements are not met.';
          if (!reqs.minLength) msg = 'New password must be at least 12 characters.';
          else if (!reqs.hasUppercase) msg = 'New password must contain at least 1 uppercase letter (A-Z).';
          else if (!reqs.hasLowercase) msg = 'New password must contain at least 1 lowercase letter (a-z).';
          else if (!reqs.hasSpecialChar) msg = 'New password must contain at least 1 sign or special character (!@#$%^&* etc.).';
          setProfileError(msg);
          toast.warning(msg);
          setProfileLoading(false);
          return;
        }
        payload.newPassword = newPassword.trim();
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || errData.message || errData.error || 'Failed to update profile');
      }

      const updatedUser = await res.json();
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserObject(updatedUser);
      setProfileSuccess('Profile and password updated successfully!');
      toast.success('Profile updated successfully!');
      
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setShowProfileModal(false), 1500);
      
    } catch (err: any) {
      const msg = err.message || 'Failed to update profile.';
      setProfileError(msg);
      toast.error(msg);
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
              {t('nav.courses')}
            </Link>
            <span className="text-slate-600 font-light">|</span>
            <Link 
              href="/blogs" 
              className={`px-4 py-2 text-base font-medium rounded-lg transition-all underline underline-offset-[6px] decoration-2 ${isActive('/blogs') ? 'bg-white/10 text-emerald-400 decoration-emerald-400/50' : 'text-slate-300 hover:text-white hover:bg-white/5 decoration-slate-500/30 hover:decoration-slate-300/60'}`}
            >
              {t('nav.blogs')}
            </Link>
            <span className="text-slate-600 font-light">|</span>
            <Link 
              href="/ide" 
              className={`px-4 py-2 text-base font-medium rounded-lg transition-all underline underline-offset-[6px] decoration-2 ${isActive('/ide') ? 'bg-white/10 text-emerald-400 decoration-emerald-400/50' : 'text-slate-300 hover:text-white hover:bg-white/5 decoration-slate-500/30 hover:decoration-slate-300/60'}`}
            >
              {t('nav.ide')}
            </Link>
          </div>

          {/* Right Side (Desktop) & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Right Links */}
            <div className="hidden lg:flex items-center space-x-2">
              {userRole === 'admin' && (
                <Link href="/admin" className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${isActive('/admin') ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:text-blue-400 hover:bg-blue-500/10'}`}>{t('nav.admin')}</Link>
              )}
              {userRole === 'content_manager' && (
                <Link href="/content-manager" className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${isActive('/content-manager') ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:text-blue-400 hover:bg-blue-500/10'}`}>{t('nav.manager')}</Link>
              )}
              {userRole === 'instructor' && (
                <Link href="/instructor" className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${isActive('/instructor') ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:text-blue-400 hover:bg-blue-500/10'}`}>{t('nav.instructor')}</Link>
              )}
              {username && isStudent && (
                  <div className="relative flex items-center" ref={studentDropdownRef}>
                    <button 
                      onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                      className={`flex items-center gap-1 px-4 py-2 text-base font-medium rounded-lg transition-colors ${(isActive('/my-courses') || isActive('/track-progress') || isActive('/leaderboard')) ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                    >
                      {t('nav.student')}
                      <svg className={`w-4 h-4 transition-transform duration-200 ${showStudentDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    
                    {showStudentDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
                        <div className="py-1 flex flex-col">
                          <Link href="/my-courses" onClick={() => setShowStudentDropdown(false)} className={`px-4 py-2 text-sm font-medium transition-colors ${isActive('/my-courses') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400'}`}>{t('nav.my_courses')}</Link>
                          <Link href="/track-progress" onClick={() => setShowStudentDropdown(false)} className={`px-4 py-2 text-sm font-medium transition-colors ${isActive('/track-progress') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400'}`}>{t('nav.progress')}</Link>
                          <Link href="/leaderboard" onClick={() => setShowStudentDropdown(false)} className={`px-4 py-2 text-sm font-medium transition-colors ${isActive('/leaderboard') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400'}`}>{t('nav.leaderboard')}</Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Profile Dropdown / Login Button (Visible on all sizes) */}
            {username ? (
              <div className="relative flex items-center gap-2 border-l border-white/10 pl-2 lg:pl-4" ref={dropdownRef}>
                
                {/* Notification Button & Dropdown */}
                <div className="relative flex items-center" ref={notifRef}>
                  <button 
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) setShowDropdown(false);
                    }}
                    className="p-2.5 text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all border border-transparent hover:border-emerald-500/30 relative cursor-pointer group"
                    title={t('nav.notifications')}
                  >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {notifications.unread?.length > 0 && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] bg-rose-500 text-white font-mono text-[10px] font-bold rounded-full border-2 border-slate-950 flex items-center justify-center animate-pulse shadow-md shadow-rose-500/50">
                        {notifications.unread.length > 9 ? '9+' : notifications.unread.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up origin-top-right z-50">
                      
                      {/* Dropdown Header */}
                      <div className="px-5 py-4 border-b border-white/10 bg-slate-950/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🔔</span>
                          <h3 className="font-bold text-white text-sm sm:text-base tracking-tight">{t('nav.notifications')}</h3>
                          {notifications.unread?.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {notifications.unread.length} {t('nav.new').toLowerCase()}
                            </span>
                          )}
                        </div>

                        {activeNotifTab === 'unread' && notifications.unread?.length > 0 && (
                          <button
                            onClick={async () => {
                              const jwt = localStorage.getItem('jwt');
                              if (jwt && notifications.unread?.length) {
                                notifications.unread.forEach((notif) => {
                                  fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-messages/chat/${notif.lessonId}/read`, {
                                    method: 'PUT',
                                    headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify(notif.studentId ? { studentId: notif.studentId } : {})
                                  }).catch(e => console.error(e));
                                });
                                setNotifications(prev => ({
                                  unread: [],
                                  marked: [...prev.unread, ...prev.marked]
                                }));
                                toast.success('All marked as read');
                              }
                            }}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer hover:underline"
                          >
                            {t('nav.mark_all_read')}
                          </button>
                        )}
                      </div>

                      {/* Tab Pill Switcher */}
                      <div className="p-2 border-b border-white/5 bg-slate-950/40 flex gap-1">
                        <button 
                          onClick={() => setActiveNotifTab('unread')} 
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeNotifTab === 'unread' 
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10' 
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <span>{t('nav.new')}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeNotifTab === 'unread' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/5 text-slate-500'}`}>
                            {notifications.unread?.length || 0}
                          </span>
                        </button>
                        <button 
                          onClick={() => setActiveNotifTab('marked')} 
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeNotifTab === 'marked' 
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10' 
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <span>{t('nav.marked')}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeNotifTab === 'marked' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/5 text-slate-500'}`}>
                            {notifications.marked?.length || 0}
                          </span>
                        </button>
                      </div>

                      {/* Notification Items List */}
                      <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                        {(!notifications[activeNotifTab] || notifications[activeNotifTab].length === 0) ? (
                          <div className="p-10 text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-500 flex items-center justify-center mx-auto text-xl border border-white/5">
                              🔕
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-300">
                              {t('nav.no_notifications').replace('{tab}', activeNotifTab === 'unread' ? t('nav.new') : t('nav.marked'))}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {activeNotifTab === 'unread' ? 'You are all caught up!' : 'Read notifications will appear here.'}
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-white/5">
                            {notifications[activeNotifTab].map((notif: any) => (
                              <button
                                key={`${notif.lessonId}-${notif.studentId}`}
                                onClick={async () => {
                                  setShowNotifications(false);
                                  if (activeNotifTab === 'unread') {
                                    const jwt = localStorage.getItem('jwt');
                                    if (jwt) {
                                      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-messages/chat/${notif.lessonId}/read`, {
                                        method: 'PUT',
                                        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
                                        body: JSON.stringify(notif.studentId ? { studentId: notif.studentId } : {})
                                      }).catch(e => console.error(e));
                                    }
                                    setNotifications(prev => ({
                                      ...prev,
                                      unread: prev.unread.filter(n => !(n.lessonId === notif.lessonId && n.studentId === notif.studentId)),
                                      marked: [notif, ...prev.marked]
                                    }));
                                  }
                                  router.push(`/courses/${notif.courseId}/lesson/${notif.lessonId}`);
                                }}
                                className="w-full text-left p-4 hover:bg-slate-800/60 transition-all flex items-start gap-3.5 group cursor-pointer"
                              >
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 text-sm font-bold shadow-sm">
                                  💬
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                                      {notif.title}
                                    </p>
                                    {activeNotifTab === 'unread' && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400"></span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-mono">
                                    <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{timeAgo(notif.createdAt)}</span>
                                  </div>
                                </div>
                                <div className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all text-xs font-bold shrink-0 self-center">
                                  →
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => {
                    setShowDropdown(!showDropdown);
                    if (!showDropdown) setShowNotifications(false);
                  }}
                  className="cursor-pointer flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl text-sm font-medium text-slate-200 hover:text-emerald-400 transition-all shadow-sm"
                >
                  {userObject?.avatar ? (
                    <img 
                      src={userObject.avatar} 
                      alt={username || ''} 
                      className="w-5 h-5 rounded-full object-cover border border-emerald-500/40" 
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center border border-emerald-500/30">
                      {username ? username.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
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
                          setProfileAvatar(userObject?.avatar || null);
                          setShowProfileModal(true);
                        }}
                        className="cursor-pointer w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        {t('nav.profile_settings')}
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
                        {t('nav.logout')}
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
                {t('nav.login')}
              </Link>
            )}

            <LanguageSelector />

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
              {t('nav.courses')}
            </Link>
            <Link 
              href="/blogs" 
              className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/blogs') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
            >
              {t('nav.blogs')}
            </Link>
            <Link 
              href="/ide" 
              className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/ide') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
            >
              {t('nav.ide')}
            </Link>
            
            <div className="h-px bg-white/10 my-2"></div>
            
            {userRole === 'admin' && (
              <Link href="/admin" className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/admin') ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 hover:bg-white/5 hover:text-blue-400'}`}>{t('nav.admin')}</Link>
            )}
            {userRole === 'content_manager' && (
              <Link href="/content-manager" className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/content-manager') ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 hover:bg-white/5 hover:text-blue-400'}`}>{t('nav.manager')}</Link>
            )}
            {userRole === 'instructor' && (
              <Link href="/instructor" className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/instructor') ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 hover:bg-white/5 hover:text-blue-400'}`}>{t('nav.instructor')}</Link>
            )}
            {username && isStudent && (
              <div className="space-y-1">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('nav.student')}</div>
                <Link href="/my-courses" className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/my-courses') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                  {t('nav.my_courses')}
                </Link>
                <Link href="/track-progress" className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/track-progress') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                  {t('nav.progress')}
                </Link>
                <Link href="/leaderboard" className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/leaderboard') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                  {t('nav.leaderboard')}
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          <div className="bg-slate-900/95 border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative backdrop-blur-2xl">
            {/* Modal Ambient Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="p-6 sm:p-7 border-b border-white/10 relative z-10 bg-slate-950/40 flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Interactive Avatar Upload Circle */}
                <div className="relative group/avatar cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                  {profileAvatar ? (
                    <img 
                      src={profileAvatar} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/20">
                      {username ? username.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  
                  {/* Camera overlay on hover */}
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[9px] font-bold text-emerald-300 mt-0.5">Edit</span>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarFileChange} 
                    accept="image/png, image/jpeg, image/webp, image/gif" 
                    className="hidden" 
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{username || 'User Profile'}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 capitalize">
                      {userRole || 'Student'}
                    </span>
                  </div>
                  
                  {/* Photo Actions */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>📷 {profileAvatar ? t('nav.change_photo') : t('nav.upload_photo')}</span>
                    </button>
                    {profileAvatar && (
                      <>
                        <span className="text-slate-600 text-xs">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileAvatar(null);
                            saveAvatarDirectly(null);
                          }}
                          className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                        >
                          {t('nav.remove_photo')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowProfileModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-6 sm:p-7 space-y-6 relative z-10">
              {profileError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-2xl flex items-center gap-2.5 animate-fade-in-up">
                  <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{profileError}</span>
                </div>
              )}
              
              {profileSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-2xl flex items-center gap-2.5 animate-fade-in-up">
                  <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{profileSuccess}</span>
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-5">
                
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                    <span>{t('nav.email_address')}</span>
                  </label>
                  <input 
                    type="email" 
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                    required
                  />
                </div>
                
                {/* New Password Field */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>{t('nav.new_password')}</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? 'text' : 'password'} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('nav.leave_blank')}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-2xl pl-4 pr-11 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-inner placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {newPassword && newPassword.trim() && (
                    <PasswordRequirementsList password={newPassword} className="mt-2" />
                  )}
                  <p className="text-[11px] text-slate-500">Leave blank if you do not want to change your password.</p>
                </div>

                {/* Current Password Verification Card */}
                {((newPassword && newPassword.trim()) || (profileEmail && profileEmail.trim().toLowerCase() !== userObject?.email?.toLowerCase())) && (
                  <div className="bg-slate-950/70 border border-rose-500/20 rounded-2xl p-4 space-y-2 mt-4 shadow-inner">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <span>🛡️ {t('nav.current_password')}</span>
                      </label>
                      <span className="text-[10px] text-rose-400/80 font-mono font-bold">Required to save password/email</span>
                    </div>
                    <div className="relative">
                      <input 
                        type={showCurrentPassword ? 'text' : 'password'} 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={t('nav.enter_current')}
                        className="w-full bg-slate-900 border border-rose-500/30 rounded-xl pl-4 pr-11 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-slate-600 shadow-inner"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title={showCurrentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">Enter your current password to authorize email or password changes.</p>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="pt-3 flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-all border border-white/5 cursor-pointer"
                  >
                    {t('nav.cancel')}
                  </button>
                  <button 
                    type="submit"
                    disabled={
                      profileLoading || 
                      Boolean(((newPassword && newPassword.trim()) || (profileEmail && profileEmail.trim().toLowerCase() !== userObject?.email?.toLowerCase())) && !currentPassword)
                    }
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {profileLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t('nav.saving')}</span>
                      </>
                    ) : (
                      <span>{t('nav.save_changes')}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}






