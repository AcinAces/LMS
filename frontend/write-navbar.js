const fs = require('fs');

const code = \'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userObject, setUserObject] = useState<any>(null);

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const jwt = localStorage.getItem('jwt');
      const userStr = localStorage.getItem('user');
      const timestampStr = localStorage.getItem('loginTimestamp');

      if (jwt && userStr && timestampStr) {
        const loginTime = parseInt(timestampStr, 10);
        const isExpired = Date.now() - loginTime > 10 * 60 * 1000; // 10 minutes
        const parsedUser = JSON.parse(userStr);
        const role = parsedUser?.role?.type || 'authenticated';
        const isStudent = role === 'authenticated' || role === 'student';

        if (isExpired && isStudent) {
          // Auto logout
          localStorage.removeItem('jwt');
          localStorage.removeItem('user');
          localStorage.removeItem('loginTimestamp');
          setUsername(null);
          setUserRole(null);
          setUserObject(null);
          
          // Redirect if not on public pages
          const publicRoutes = ['/', '/login', '/register', '/courses', '/blogs'];
          const isPublic = publicRoutes.some(route => pathname === route || pathname?.startsWith(route + '/'));
          
          if (!isPublic && !pathname?.startsWith('/admin') && !pathname?.startsWith('/instructor') && !pathname?.startsWith('/content-manager')) {
            router.push('/login');
          }
        } else {
          try {
            const user = JSON.parse(userStr);
            if (user && user.username) {
              setUsername(user.username);
              setUserRole(user.role?.type || null);
              setUserObject(user);
              setProfileEmail(user.email || '');
            }
            
            // ALWAYS fetch fresh role on page change or refresh
            try {
              const res = await fetch('http://localhost:1337/api/users/me?populate=role', {
                headers: { 'Authorization': \\\Bearer \\\\ }
              });
              
              if (res.ok) {
                const meData = await res.json();
                if (meData?.role) {
                  const currentRole = meData.role.type;
                  const updatedUser = { ...user, ...meData, role: meData.role };
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                  setUserRole(currentRole);
                  setUserObject(updatedUser);
                  setProfileEmail(updatedUser.email || '');

                  // Enforce dashboard constraints based on new role
                  if (currentRole === 'admin') {
                    if (pathname?.startsWith('/instructor') || pathname?.startsWith('/content-manager')) {
                      router.push('/admin');
                    }
                  } else if (currentRole === 'instructor') {
                    if (pathname?.startsWith('/admin') || pathname?.startsWith('/content-manager')) {
                      router.push('/instructor');
                    }
                  } else if (currentRole === 'content_manager') {
                    if (pathname?.startsWith('/admin') || pathname?.startsWith('/instructor')) {
                      router.push('/content-manager');
                    }
                  } else {
                    // Regular user / student
                    if (pathname?.startsWith('/admin') || pathname?.startsWith('/instructor') || pathname?.startsWith('/content-manager')) {
                      router.push('/');
                    }
                  }
                }
              } else {
                if (res.status === 401 || res.status === 403) {
                  localStorage.removeItem('jwt');
                  localStorage.removeItem('user');
                  localStorage.removeItem('loginTimestamp');
                  setUsername(null);
                  setUserRole(null);
                  setUserObject(null);
                  router.push('/login');
                }
              }
            } catch (err) {
              // Network error
            }

          } catch (e) {
            setUsername(null);
            setUserRole(null);
            setUserObject(null);
          }
        }
      } else {
        setUsername(null);
        setUserRole(null);
        setUserObject(null);
      }
    };

    checkSession();
    const intervalId = setInterval(checkSession, 30000);

    const updateActivity = () => {
      const jwt = localStorage.getItem('jwt');
      if (jwt) {
        localStorage.setItem('loginTimestamp', Date.now().toString());
      }
    };

    let throttleTimer: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (!throttleTimer) {
        updateActivity();
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
        }, 5000);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTimestamp');
    setUsername(null);
    setUserRole(null);
    setUserObject(null);
    router.push('/login');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setProfileError('Current password is required to save changes.');
      return;
    }
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      // 1. Verify current password by attempting to log in
      const jwt = localStorage.getItem('jwt');
      
      const authRes = await fetch('http://localhost:1337/api/auth/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: userObject.username || userObject.email, password: currentPassword })
      });

      if (!authRes.ok) {
        throw new Error('Incorrect current password.');
      }

      // 2. Process Email Change
      let isEmailChanged = false;
      if (profileEmail !== userObject.email) {
        const updateRes = await fetch(\\\http://localhost:1337/api/users/\\\\, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \\\Bearer \\\\
          },
          body: JSON.stringify({ email: profileEmail })
        });
        
        if (!updateRes.ok) {
          throw new Error('Failed to update email. It might already be in use.');
        }
        isEmailChanged = true;
      }

      // 3. Process Password Change
      let isPasswordChanged = false;
      if (newPassword) {
        const passRes = await fetch('http://localhost:1337/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \\\Bearer \\\\
          },
          body: JSON.stringify({
            currentPassword,
            password: newPassword,
            passwordConfirmation: newPassword
          })
        });

        if (!passRes.ok) {
          throw new Error('Failed to update password.');
        }
        isPasswordChanged = true;
      }

      // Success
      if (isEmailChanged || isPasswordChanged) {
        // Update local storage object
        const newObj = { ...userObject, email: profileEmail };
        localStorage.setItem('user', JSON.stringify(newObj));
        setUserObject(newObj);
        
        let msgs = [];
        if (isEmailChanged) msgs.push('Email');
        if (isPasswordChanged) msgs.push('Password');
        setProfileSuccess(\\\\ updated successfully!\\\);
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setShowProfileModal(false), 2000);
      } else {
        setShowProfileModal(false); // nothing changed
      }
      
    } catch (err: any) {
      setProfileError(err.message || 'An error occurred.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/50 backdrop-blur-md border-b border-white/10 text-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Left Side */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold tracking-tighter hover:text-emerald-400 transition-colors">
              Acin's LMS
            </Link>
          </div>

          {/* Middle */}
          <div className="hidden md:flex space-x-8">
            <Link href="/courses" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              All Courses
            </Link>
            <Link href="/blogs" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Blogs
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-6">
            {username ? (
              <div className="flex items-center space-x-4">
                {userRole === 'admin' && (
                  <Link href="/admin" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">Admin Dashboard</Link>
                )}
                {userRole === 'content_manager' && (
                  <Link href="/content-manager" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">Manager Dashboard</Link>
                )}
                {userRole === 'instructor' && (
                  <Link href="/instructor" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">Instructor Dashboard</Link>
                )}
                {(!userRole || (userRole !== 'admin' && userRole !== 'instructor' && userRole !== 'content_manager')) && (
                  <>
                    <Link href="/my-courses" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                      My Courses
                    </Link>
                    <Link href="/track-progress" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                      Track Progress
                    </Link>
                  </>
                )}
                
                <div className="border-l border-white/20 pl-4 flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setProfileError('');
                      setProfileSuccess('');
                      setCurrentPassword('');
                      setNewPassword('');
                      setProfileEmail(userObject?.email || '');
                      setShowProfileModal(true);
                    }}
                    className="text-sm font-bold text-gray-200 hover:text-emerald-400 underline decoration-white/30 underline-offset-4 transition-colors"
                  >
                    {username}
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
              >
                Login
              </Link>
            )}
          </div>
          
        </div>
      </nav>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <h3 className="text-2xl font-bold text-white mb-6">Profile Settings</h3>
            
            {profileError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded-lg">
                {profileError}
              </div>
            )}
            
            {profileSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm rounded-lg">
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
              
              <div className="border-t border-white/10 my-4 pt-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4 mt-6">
                <label className="block text-sm font-bold text-red-400 mb-2">Current Password (Required)</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password to verify"
                  className="w-full bg-black/50 border border-red-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-600"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={profileLoading || !currentPassword}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
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
\;

fs.writeFileSync('src/components/Navbar.tsx', code, 'utf8');
