'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import ReviewsListModal from '@/components/ReviewsListModal';

interface Course {
  id: number;
  documentId: string;
  courseTitle: string;
  courseTag: string;
  lessons: any[];
  enrollments: any[];
  courseAuthor: any;
  reviews?: any[];
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [userId, setUserId] = useState<number | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<any[]>([]);
  const [viewingReviews, setViewingReviews] = useState<Course | null>(null);
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
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?populate[0]=courseAuthor&populate[1]=lessons&populate[2]=reviews&populate[3]=reviews.author`, {
          headers, cache: 'no-store' });

        if (res.status === 401) {
          localStorage.removeItem('jwt');
          localStorage.removeItem('user');
          localStorage.removeItem('loginTimestamp');
          router.push('/login');
          return;
        }
        
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        setCourses(data.data || []);

        if (jwt) {
          const enrollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/enrollments`, { headers, cache: 'no-store' });
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
  }, [router]);

  const filteredCourses = courses
    .filter(course => 
      course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (course.courseTag && course.courseTag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortOption === 'newest') return b.id - a.id;
      if (sortOption === 'oldest') return a.id - b.id;
      if (sortOption === 'a-z') return a.courseTitle.localeCompare(b.courseTitle);
      if (sortOption === 'z-a') return b.courseTitle.localeCompare(a.courseTitle);
      return 0;
    });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-16">
      <AnimatedBackground />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        
        <div className="flex flex-col items-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Available Courses</h1>
          
          <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 relative">
            <div className="relative group flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input 
                type="text"
                placeholder="Search courses by title or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-900/60 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all backdrop-blur-xl shadow-lg"
              />
            </div>
            
            <div className="relative min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
              </div>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full pl-11 pr-10 py-4 appearance-none bg-slate-900/60 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all backdrop-blur-xl shadow-lg cursor-pointer"
              >
                <option value="newest" className="bg-slate-900">Newest First</option>
                <option value="oldest" className="bg-slate-900">Oldest First</option>
                <option value="a-z" className="bg-slate-900">Title (A-Z)</option>
                <option value="z-a" className="bg-slate-900">Title (Z-A)</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 animate-fade-in-up delay-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center p-12 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl animate-fade-in-up delay-100">
            <p className="text-slate-400 text-lg">No courses found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up delay-100">
            {filteredCourses.map((course, index) => {
              const isEnrolled = userId ? userEnrollments?.some((e: any) => e.course?.documentId === course.documentId) : false;
              const hasReviews = course.reviews && course.reviews.length > 0;
              const avgRating = hasReviews ? (course.reviews!.reduce((acc, r) => acc + Number(r.overallRating), 0) / course.reviews!.length).toFixed(1) : null;
              
              return (
                <div key={course.id} className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between" style={{ animationDelay: `${(index % 10) * 50}ms` }}>
                  
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="flex flex-wrap gap-2">
                        {course.courseTag ? course.courseTag.split(',').map((t, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-md border border-emerald-500/20">{t.trim()}</span>
                        )) : (
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-md border border-emerald-500/20">General</span>
                        )}
</div>
                      {hasReviews && (
                        <button onClick={() => setViewingReviews(course)} className="cursor-pointer flex items-center gap-1 text-amber-400 text-sm font-bold hover:text-amber-300 transition-colors bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {avgRating} ({course.reviews!.length})
                        </button>
                      )}
                    </div>
                    
                    <Link href={`/courses/${course.documentId}`}>
                      <h3 className="cursor-pointer text-2xl font-bold text-slate-100 mb-3 group-hover:text-emerald-400 transition-colors line-clamp-2">{course.courseTitle}</h3>
                    </Link>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        By {course.courseAuthor?.username || 'LMS'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        {course.lessons?.length || 0} Lessons
                      </div>
                      {isEnrolled && (
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-md border border-blue-500/20">Enrolled</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-auto">
                    {!userId ? (
                      <Link href={`/courses/${course.documentId}`} className="w-full py-3 flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-colors">
                        View details
                      </Link>
                    ) : isEnrolled ? (
                      <Link href={`/courses/${course.documentId}`} className="w-full py-3 flex justify-center items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-sm font-bold rounded-xl transition-colors">
                        Select <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      </Link>
                    ) : (
                      <Link href={`/courses/${course.documentId}`} className="w-full py-3 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] transition-all">
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

      {viewingReviews && viewingReviews.reviews && (
        <ReviewsListModal 
          courseTitle={viewingReviews.courseTitle}
          reviews={viewingReviews.reviews}
          onClose={() => setViewingReviews(null)}
        />
      )}
    </div>
  );
}





