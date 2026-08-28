'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';
import LessonChat from '@/components/LessonChat';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/i18n/LanguageContext';

interface Lesson {
  id: number;
  documentId: string;
  title: string;
  description: string;
  videoUrl: string;
  youtubeVideoId: string;
  durationInSeconds: number;
  content: string;
  order: number;
  isPreview: boolean;
}

interface Course {
  documentId: string;
  courseTitle: string;
  lessons: Lesson[];
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const videoPlayerRef = useRef<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  // We use a ref to prevent spamming the backend with sync requests
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedData = useRef<{ lastWatched: number, maxWatched: number, completed: boolean } | null>(null);

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
          router.push('/login');
          return;
        }

        const userStr = localStorage.getItem('user');
        const roleType = userStr ? JSON.parse(userStr).role?.type : null;
        const staff = roleType === 'admin' || roleType === 'content_manager' || roleType === 'instructor';
        setIsStaff(staff);

        const headers = { 'Authorization': `Bearer ${jwt}` };

        // 1. Fetch the course and all its lessons
        const courseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses/${params.id}?populate[0]=lessons`, { headers });
        if (!courseRes.ok) throw new Error('Failed to fetch course');
        const courseData = await courseRes.json();
        setCourse(courseData.data);

        // Find the current lesson in the course
        const lesson = courseData.data?.lessons?.find((l: any) => l.documentId === params.lessonId);
        if (!lesson) throw new Error('Lesson not found');
        setCurrentLesson(lesson);

        // 2. Fetch the user's progress for this course's lessons (if not staff)
        if (!staff) {
          const progRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-progresses?populate[0]=lesson`, { headers });
          if (progRes.ok) {
            const progData = await progRes.json();
            setAllProgress(progData.data || []);
            
            // Find progress specifically for this lesson
            const thisLessonProgress = progData.data?.find((p: any) => p.lesson?.documentId === params.lessonId);
            if (thisLessonProgress) {
              setProgress(thisLessonProgress);
            } else {
              // No progress yet, default values
              setProgress({ lastWatchedPosition: 0, maxWatchedPosition: 0, completed: false });
            }
          }
        } else {
          // Staff don't have progress tracking
          setProgress({ lastWatchedPosition: 0, maxWatchedPosition: 0, completed: false });
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [params.id, params.lessonId, router]);

  const handleProgressSync = useCallback((lastWatched: number, maxWatched: number, completed: boolean, duration: number) => {
    const jwt = localStorage.getItem('jwt');
    
    // Check if the lesson is missing duration on the frontend state; if so, update backend!
    if (duration > 0 && (!currentLesson?.durationInSeconds || currentLesson.durationInSeconds === 0)) {
      if (jwt) {
        // Background update, no await
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lessons/${params.lessonId}/duration`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({ durationInSeconds: Math.floor(duration) })
        }).catch(console.error);
      }
      
      // Optimitiscally update local state so we don't spam the endpoint
      if (currentLesson) {
        setCurrentLesson({ ...currentLesson, durationInSeconds: Math.floor(duration) });
      }
    }

    if (isStaff) return; // Do not sync progress for staff
    if (!jwt) return;

    // Throttle the sync to avoid API spam (e.g., sync every 5 seconds or if completion status changes)
    const hasCompletedChanged = lastSyncedData.current?.completed !== completed;
    
    if (syncTimeoutRef.current && !hasCompletedChanged) {
      return; // A sync is already scheduled and completion hasn't changed
    }

    lastSyncedData.current = { lastWatched, maxWatched, completed };

    const syncToBackend = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-progresses/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({
            lessonDocumentId: params.lessonId,
            lastWatchedPosition: Math.floor(lastWatched),
            maxWatchedPosition: Math.floor(maxWatched),
            completed
          })
        });
      } catch (err) {
        console.error('Failed to sync progress:', err);
      } finally {
        syncTimeoutRef.current = null;
      }
    };

    // If completed just flipped, sync immediately
    if (hasCompletedChanged) {
      syncToBackend();
    } else {
      // Otherwise debounce for 5 seconds
      syncTimeoutRef.current = setTimeout(syncToBackend, 5000);
    }
  }, [params.lessonId, isStaff, currentLesson]);

  const markLessonComplete = async () => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt || isStaff || !currentLesson) return;

    const maxPos = currentLesson.durationInSeconds || progress.maxWatchedPosition || 0;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-progresses/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          lessonDocumentId: params.lessonId,
          lastWatchedPosition: Math.floor(progress.lastWatchedPosition || 0),
          maxWatchedPosition: Math.floor(maxPos),
          completed: true
        })
      });
    } catch (err) {
      console.error('Failed to sync progress:', err);
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

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 text-white">
        <AnimatedBackground />
        <h1 className="relative z-10 text-2xl">{t('lesson.lesson_not_found')}</h1>
      </div>
    );
  }

  // Calculate next and previous lessons
  const currentIndex = course.lessons.findIndex(l => l.documentId === currentLesson.documentId);
  const prevLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;

  // Calculate course completion
  const totalLessons = course.lessons.length;
  const completedLessons = course.lessons.filter(l => 
    allProgress.some(p => p.lesson?.documentId === l.documentId && p.completed)
  ).length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-16">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href={`/courses/${course.documentId}`} className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold flex items-center gap-2 inline-flex">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            {t('lesson.back_to')} {course.courseTitle}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Video Area */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-3xl font-extrabold text-white">{currentLesson.title}</h1>
            
            {progress && currentLesson.youtubeVideoId ? (
              <div className="w-full">
                <CustomVideoPlayer
                  ref={videoPlayerRef}
                  videoId={currentLesson.youtubeVideoId}
                  initialLastWatched={progress.lastWatchedPosition || 0}
                  initialMaxWatched={progress.maxWatchedPosition || 0}
                  isCompleted={progress.completed || false}
                  onProgressSync={handleProgressSync}
                  isStaff={isStaff}
                />
              </div>
            ) : (
              <div className="w-full aspect-video bg-black rounded-xl border border-white/10 flex items-center justify-center">
                <span className="text-gray-500">{t('lesson.no_video')}</span>
              </div>
            )}

            {/* Next/Prev Navigation */}
            <div className="flex items-center justify-between mt-4">
              {prevLesson ? (
                <Link 
                  href={`/courses/${course.documentId}/lesson/${prevLesson.documentId}`}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors border border-white/10"
                >
                  &larr; {t('lesson.previous')}
                </Link>
              ) : <div></div>}
              
              {nextLesson ? (
                <Link 
                  href={`/courses/${course.documentId}/lesson/${nextLesson.documentId}`}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {t('lesson.next')} &rarr;
                </Link>
              ) : (
                <Link
                  href={`/courses/${course.documentId}`}
                  className={`px-6 py-3 ${isStaff ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold rounded-lg shadow-lg ${isStaff ? '' : 'shadow-blue-500/20'} transition-all`}
                >
                  {isStaff ? 'Back to Course \u2191' : 'Finish Course \u2713'}
                </Link>
              )}
            </div>

            {/* Lesson Content (Text) */}
            {currentLesson.content && (
              <div className="mt-8 p-6 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl prose prose-invert max-w-none">
                <ReactMarkdown>{currentLesson.content}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Sidebar Playlist */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 sticky top-24">
              {!isStaff && (
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-gray-300">{t('lesson.course_progress')}</span>
                    <span className="text-emerald-400 font-bold text-lg leading-none">{completionPercentage}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden mb-2 border border-white/5">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700 relative"
                      style={{ width: `${completionPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  <div className="text-xs text-center text-gray-400 font-medium">
                    {completedLessons} / {totalLessons} {t('lesson.completed')}
                  </div>
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-6">Course Lessons</h3>
              
              <div className="space-y-3">
                {course.lessons.map((lesson: any, idx: number) => {
                  const isCurrent = lesson.documentId === currentLesson.documentId;
                  const lessonProgress = allProgress.find(p => p.lesson?.documentId === lesson.documentId);
                  const isCompleted = lessonProgress?.completed;
                  
                  const maxWatched = lessonProgress?.maxWatchedPosition || 0;
                  const totalDuration = lesson.durationInSeconds || 0;
                  const timeRemaining = Math.max(0, totalDuration - maxWatched);

                  return (
                    <Link 
                      key={lesson.id}
                      href={`/courses/${course.documentId}/lesson/${lesson.documentId}`}
                      className={`block p-4 rounded-lg border transition-all ${
                        isCurrent 
                          ? 'bg-emerald-500/20 border-emerald-500/50' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-400'
                        }`}>
                          {isCompleted ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${isCurrent ? 'text-emerald-400' : 'text-gray-200'}`}>
                            {lesson.title}
                          </p>
                          {!isCompleted && (
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.floor(timeRemaining / 60)}m {Math.floor(timeRemaining % 60)}s left
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
        <LessonChat 
          lessonId={currentLesson.documentId} 
          courseId={course.documentId} 
          lessonTitle={currentLesson.title}
          lessonOrder={currentLesson.order}
          isStaff={isStaff} 
        />
      </div>
    </div>
  );
}
