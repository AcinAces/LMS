'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import ReviewModal from '@/components/ReviewModal';

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

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progresses, setProgresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewingCourse, setReviewingCourse] = useState<Course | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  const fetchMyCourses = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      const userStr = localStorage.getItem('user');
      if (!jwt || !userStr) {
        router.push('/login');
        return;
      }
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      const headers: HeadersInit = { 'Authorization': `Bearer ${jwt}` };
      
      const coursesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?populate[0]=courseAuthor&populate[1]=lessons&populate[2]=reviews&populate[3]=reviews.author`, { headers, cache: 'no-store' });
      if (coursesRes.status === 401) {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      if (!coursesRes.ok) throw new Error('Failed to fetch courses');
      const coursesData = await coursesRes.json();
      const allCourses = coursesData.data || [];

      const enrollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/enrollments`, { headers, cache: 'no-store' });
      if (!enrollRes.ok) throw new Error('Failed to fetch enrollments');
      const enrollData = await enrollRes.json();
      const myEnrollments = enrollData.data || [];

      const progRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-progresses?populate[0]=lesson`, { headers, cache: 'no-store' });
      if (!progRes.ok) throw new Error('Failed to fetch progresses');
      const progData = await progRes.json();
      setProgresses(progData.data || []);

      const enrolledCourseIds = new Set(myEnrollments.map((e: any) => e.course?.documentId).filter(Boolean));
      const myCourses = allCourses.filter((c: Course) => enrolledCourseIds.has(c.documentId));

      setCourses(myCourses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, [router]);

  const filteredCourses = courses.filter(course => 
    course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (course.courseTag && course.courseTag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCourseCompletion = (course: Course) => {
    if (!course.lessons || course.lessons.length === 0) return false;
    const lessonIds = course.lessons.map(l => l.documentId);
    const completedLessons = progresses.filter(p => p.lesson && lessonIds.includes(p.lesson.documentId) && p.completed);
    return completedLessons.length === lessonIds.length;
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-16">
      <AnimatedBackground />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">My Courses</h1>
          <div className="w-full max-w-2xl relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text"
              placeholder="Search my courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-900/60 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all backdrop-blur-xl shadow-lg"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div></div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center p-12 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-gray-400 mb-6">You are not enrolled in any courses yet, or no courses match your search.</p>
            <Link href="/courses" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors">
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
              {filteredCourses.map(course => {
                const isCompleted = getCourseCompletion(course);
                const userReview = course.reviews?.find(r => r.authorId === currentUser?.id || r.author?.id === currentUser?.id || r.author === currentUser?.id);

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
                      
                      <Link href={`/courses/${course.documentId}`}>
                        <h3 className="cursor-pointer text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{course.courseTitle}</h3>
                      </Link>
                      
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <p className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            By {course.courseAuthor?.username || 'LMS'}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            {course.lessons?.length || 0} Lessons
                          </p>
                        </div>

                        {isCompleted && (
                          <div className="flex items-center flex-wrap gap-3 mt-1">
                            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              COMPLETED
                            </div>
                            
                            {!userReview ? (
                              <button 
                                onClick={() => setReviewingCourse(course)} 
                                className="cursor-pointer px-4 py-1.5 rounded-lg text-sm font-bold text-white shadow-sm shadow-emerald-500/5 animate-gradient-wave bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:scale-105 transition-all"
                              >
                                Share your feedback
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                Rated: <strong className="text-emerald-400">{Number(userReview.overallRating).toFixed(2)}/5</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center justify-center">
                      <Link href={`/courses/${course.documentId}`} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                        Select <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
        )}
      </div>

      {reviewingCourse && (
        <ReviewModal 
          courseId={reviewingCourse.documentId} 
          courseTitle={reviewingCourse.courseTitle}
          onClose={() => setReviewingCourse(null)}
          onSuccess={() => {
            setReviewingCourse(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}










