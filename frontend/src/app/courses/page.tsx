'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';

interface Course {
  id: number;
  documentId: string;
  courseTitle: string;
  courseTag: string;
  lessons: any[];
  enrollments: any[];
  courseAuthor: any;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUserId(JSON.parse(userStr).id); } catch (e) {}
    }

    const fetchCourses = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        const headers: HeadersInit = {};
        if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
        
        // Removed populate[2]=enrollments.student to prevent 403/400 errors from Strapi RBAC
        const res = await fetch('http://localhost:1337/api/courses?populate[0]=courseAuthor&populate[1]=lessons', {
          headers
        });

        if (res.status === 401) {
          console.error('Session expired or invalid token. Logging out...');
          localStorage.removeItem('jwt');
          localStorage.removeItem('user');
          localStorage.removeItem('loginTimestamp');
          router.push('/login');
          return;
        }
        
        if (!res.ok) {
          const text = await res.text();
          console.error('Fetch error:', text);
          throw new Error('Failed to fetch');
        }
        
        const data = await res.json();
        setCourses(data.data || []);

        // If logged in, fetch their specific enrollments securely
        if (jwt) {
          const enrollRes = await fetch('http://localhost:1337/api/enrollments', { headers });
          if (enrollRes.ok) {
            const enrollData = await enrollRes.json();
            setUserEnrollments(enrollData.data || []);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: number, documentId: string) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt || !userId) {
        router.push('/login');
        return;
      }

      const res = await fetch('http://localhost:1337/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ data: { student: userId, course: courseId } })
      });

      if (res.ok) {
        router.push(`/courses/${documentId}`);
      }
    } catch (e) {}
  };

  const filteredCourses = courses.filter(course => 
    course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (course.courseTag && course.courseTag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-16">
      <AnimatedBackground />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-6">Available Courses</h1>
          <div className="w-full max-w-2xl relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text"
              placeholder="Search courses by title or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors backdrop-blur-md"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div></div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center p-12 bg-white/5 border border-white/10 rounded-xl"><p className="text-gray-400">No courses found.</p></div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredCourses.map(course => {
              const isEnrolled = userId ? userEnrollments?.some((e: any) => e.course?.documentId === course.documentId) : false;
              
              return (
                <div key={course.id} className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-emerald-500/50 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {course.courseTag ? course.courseTag.split(',').map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-black/50 backdrop-blur-md text-emerald-400 text-xs font-semibold rounded border border-emerald-500/20">{t.trim()}</span>
                      )) : (
                        <span className="px-2 py-1 bg-black/50 backdrop-blur-md text-emerald-400 text-xs font-semibold rounded border border-emerald-500/20">General</span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{course.courseTitle}</h3>
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {course.courseAuthor?.username || 'LMS'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">{course.lessons?.length || 0} Lessons</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-center">
                    {!userId ? (
                      <Link href={`/courses/${course.documentId}`} className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
                        View details
                      </Link>
                    ) : isEnrolled ? (
                      <Link href={`/courses/${course.documentId}`} className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
                        Continue <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      </Link>
                    ) : (
                      <Link href={`/courses/${course.documentId}`} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                        View course
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
