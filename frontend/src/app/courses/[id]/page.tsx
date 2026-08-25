'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import ReactMarkdown from 'react-markdown';

interface LessonProgress {
  completed: boolean;
  lastWatchedPosition: number;
  student: { id: number };
}

interface Lesson {
  id: number;
  documentId: string;
  title: string;
  durationInSeconds: number;
  lessonProgresses: LessonProgress[];
}

interface Course {
  id: number;
  documentId: string;
  courseTitle: string;
  courseDescription: string;
  courseAuthor: { username: string };
  lessons: Lesson[];
  enrollments: any[];
}

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [localEnrolled, setLocalEnrolled] = useState(false);
  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [takenQuizzes, setTakenQuizzes] = useState(0);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    let currentUserId = null;
    if (userStr) {
      try { 
        currentUserId = JSON.parse(userStr).id; 
        setUserId(currentUserId); 
      } catch (e) {}
    } else {
      setIsPublic(true);
    }

    const fetchCourse = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        const headers: HeadersInit = {};
        if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
        
        // Populate deeply to ensure we get the student in enrollments
        const res = await fetch(`http://localhost:1337/api/courses/${params.id}?populate[0]=courseAuthor&populate[1]=lessons`, {
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

        if (!res.ok) throw new Error('Failed to fetch course');
        
        const data = await res.json();
        setCourse(data.data);

        // Check enrollment — backend auto-filters to only return this user's enrollments
        if (currentUserId && jwt) {
          try {
            const enrollRes = await fetch('http://localhost:1337/api/enrollments', { headers });
            if (enrollRes.ok) {
              const enrollData = await enrollRes.json();
              const match = enrollData.data?.some((e: any) => e.course?.documentId === params.id);
              if (match) setLocalEnrolled(true);
            }

            // Also fetch all lesson progresses securely for this user
            const progRes = await fetch('http://localhost:1337/api/lesson-progresses?populate[0]=lesson', { headers });
            if (progRes.ok) {
              const progData = await progRes.json();
              setAllProgress(progData.data || []);
            }
            
            // Fetch quizzes for this course
            const quizzesRes = await fetch(`http://localhost:1337/api/quizzes?filters[course][documentId][$eq]=${params.id}`, { headers });
            if (quizzesRes.ok) {
               const qData = await quizzesRes.json();
               setTotalQuizzes(qData.data?.length || 0);
               
               // Fetch quiz attempts for this user and this course
               const attemptsRes = await fetch(`http://localhost:1337/api/quiz-attempts?filters[student][id][$eq]=${currentUserId}&filters[quiz][course][documentId][$eq]=${params.id}&populate=quiz`, { headers });
               if (attemptsRes.ok) {
                  const attData = await attemptsRes.json();
                  const uniqueQuizIds = new Set(attData.data?.map((a: any) => a.quiz?.documentId).filter(Boolean));
                  setTakenQuizzes(uniqueQuizIds.size);
               }
            }
          } catch (err) {
            console.error('Failed to verify status', err);
          }
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourse();
  }, [params.id]);

  const handleEnroll = async () => {
    if (!course || !userId) return;
    try {
      setEnrolling(true);
      const jwt = localStorage.getItem('jwt');
      const res = await fetch('http://localhost:1337/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ 
          data: { 
            course: course.documentId 
          } 
        })
      });

      if (res.ok) {
        setLocalEnrolled(true);
        setEnrolling(false);
      } else {
        console.error('Failed to enroll', await res.text());
        setEnrolling(false);
      }
    } catch (e) {
      console.error(e);
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <AnimatedBackground />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 relative z-10"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 text-white">
        <AnimatedBackground />
        <h1 className="relative z-10 text-2xl">Course not found.</h1>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    if (!seconds) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const userObj = userStr ? JSON.parse(userStr) : null;
  const roleType = userObj?.role?.type;
  const isStaff = roleType === 'admin' || roleType === 'content_manager' || roleType === 'instructor';

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-16">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <Link href="/courses" className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold flex items-center gap-2 mb-8 inline-flex">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Courses
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2">{course.courseTitle}</h1>
            <p className="text-gray-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              {course.courseAuthor?.username || 'LMS'}
            </p>
          </div>
          
          {!isPublic && (
            <div className="flex-shrink-0">
              {isStaff ? (
                <button 
                  disabled
                  title="Staff cannot enroll in courses"
                  className="px-8 py-3 bg-white/5 border border-white/10 text-gray-500 text-sm font-bold rounded-lg flex items-center gap-2 cursor-not-allowed"
                >
                  Enrollment Disabled for Staff
                </button>
              ) : localEnrolled ? (
                <div className="flex flex-col items-center gap-2">
                  <button 
                    disabled
                    className="w-full px-8 py-3 bg-white/10 border border-white/20 text-gray-400 text-sm font-bold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    Enrolled 
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </button>
                  {totalQuizzes > 0 && (
                    <div className="flex flex-col items-center w-full mt-2">
                      <Link 
                        href={`/courses/${course.documentId}/quizzes`}
                        className="w-full px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        {takenQuizzes >= totalQuizzes ? 'Retake Quiz' : 'Take a Quiz'}
                      </Link>
                      {takenQuizzes >= totalQuizzes ? (
                        <div className="mt-2 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          {totalQuizzes}/{totalQuizzes}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs font-semibold text-gray-400">
                          {takenQuizzes}/{totalQuizzes} Quizzes Taken
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={handleEnroll} 
                  disabled={enrolling}
                  className={`px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 ${enrolling ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  {!enrolling && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>}
                </button>
              )}
            </div>
          )}
        </div>

        {isPublic && course.courseDescription && (
          <div className="mb-10 p-6 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl prose prose-invert max-w-none">
            <ReactMarkdown>{course.courseDescription}</ReactMarkdown>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white mb-6">Course Lessons</h3>
          
          {!course.lessons || course.lessons.length === 0 ? (
            <p className="text-gray-400">No lessons available for this course yet.</p>
          ) : (
            course.lessons.map((lesson, idx) => {
              const progress = allProgress.find(p => p.lesson?.documentId === lesson.documentId);
              
              let statusText = 'Start';
              let buttonStyle = 'bg-emerald-600 hover:bg-emerald-500 text-white';
              let timeLeftText = null;
              
              if (isStaff) {
                statusText = 'View Lesson';
                buttonStyle = 'bg-white/10 hover:bg-white/20 text-white border border-white/20';
              } else if (progress) {
                if (progress.completed) {
                  statusText = 'Start again';
                  buttonStyle = 'bg-white/10 hover:bg-white/20 text-white border border-white/20';
                } else if (progress.lastWatchedPosition > 0) {
                  statusText = 'Resume';
                  buttonStyle = 'bg-blue-600 hover:bg-blue-500 text-white';
                  const left = Math.max(0, (lesson.durationInSeconds || 0) - progress.lastWatchedPosition);
                  timeLeftText = `${formatTime(left)} left`;
                }
              }

              return (
                <div 
                  key={lesson.id} 
                  className={`backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isPublic 
                      ? 'bg-black/20 opacity-50 select-none' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 font-bold border border-white/10">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-bold text-white">{lesson.title || `Lesson ${idx + 1}`}</h4>
                        {!isStaff && progress?.completed && (
                          <span className="text-emerald-400 flex items-center" title="Completed">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          </span>
                        )}
                      </div>
                      {(!progress?.completed || isStaff) && (
                        <p className="text-sm text-gray-500 mt-1">
                          Duration: {formatTime(lesson.durationInSeconds || 0)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {!isPublic && (
                    <div className="flex flex-col items-center gap-1.5">
                      <button 
                        disabled={!isStaff && !localEnrolled}
                        onClick={() => router.push(`/courses/${course.documentId}/lesson/${lesson.documentId}`)}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto ${buttonStyle} ${!isStaff && !localEnrolled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {statusText}
                      </button>
                      {timeLeftText && !isStaff && (
                        <span className="text-blue-400 text-xs font-semibold text-center w-full">
                          {timeLeftText}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isPublic && (
            <div className="mt-12 text-center p-8 bg-gradient-to-r from-emerald-900/40 to-blue-900/40 border border-emerald-500/20 rounded-xl">
              <p className="text-lg text-gray-300 mb-4">
                Interested in taking this course?
              </p>
              <Link 
                href="/login" 
                className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
              >
                Login as a student and get access now!
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
