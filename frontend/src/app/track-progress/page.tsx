'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useToast } from '@/context/ToastContext';

interface LessonDetail {
  id: number;
  documentId: string;
  title: string;
  order: number;
  durationInSeconds: number;
  completed: boolean;
  completedAt: string | null;
  lastWatchedPosition: number;
  maxWatchedPosition: number;
}

interface CourseProgress {
  id: number;
  documentId: string;
  courseTitle: string;
  courseType: string;
  courseTag: string | null;
  courseAuthor: { id: number; username: string; email: string } | null;
  enrolledAt: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  isFullyCompleted: boolean;
  lessons: LessonDetail[];
}

interface QuizAttemptDetail {
  id: number;
  documentId: string;
  quizId: string;
  quizTitle: string;
  courseTitle: string;
  score: number;
  totalQuestion: number;
  percentage: number;
  status: string;
  violationScore: number;
  violationsCount: number;
  submittedAt: string;
  startedAt: string;
}

interface StudentReportData {
  student: {
    id: number;
    documentId: string;
    username: string;
    email: string;
    createdAt: string;
  };
  summary: {
    totalEnrolledCourses: number;
    fullyCompletedCourses: number;
    inProgressCourses: number;
    totalLessonsCount: number;
    totalCompletedLessonsCount: number;
    overallCompletionRate: number;
    totalQuizzesAttempted: number;
    submittedQuizzesCount: number;
    averageQuizScore: number;
    highestQuizScore: number;
  };
  courses: CourseProgress[];
  quizzes: QuizAttemptDetail[];
}

export default function TrackProgressPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const toast = useToast();

  const [reportData, setReportData] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseSearch, setCourseSearch] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  const fetchMyProgress = async () => {
    setLoading(true);
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/student-reports/me`, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || errJson.message || `Server error (${res.status})`);
      }

      const json = await res.json();
      if (json.data) {
        setReportData(json.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load progress report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProgress();
  }, []);

  const toggleCourseExpand = (courseDocId: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseDocId]: !prev[courseDocId]
    }));
  };

  const filteredCourses = useMemo(() => {
    if (!reportData?.courses) return [];
    if (!courseSearch.trim()) return reportData.courses;

    const q = courseSearch.toLowerCase();
    return reportData.courses.filter(c => 
      c.courseTitle.toLowerCase().includes(q) ||
      c.courseType.toLowerCase().includes(q) ||
      (c.courseTag && c.courseTag.toLowerCase().includes(q)) ||
      (c.courseAuthor && c.courseAuthor.username.toLowerCase().includes(q))
    );
  }, [reportData?.courses, courseSearch]);

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-16 pb-20">
      <AnimatedBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-3xl font-black shadow-inner">
                {reportData?.student?.username?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {reportData?.student?.username 
                      ? t('progress.user_progress').replace('{username}', reportData.student.username) 
                      : t('progress.my_progress')}
                  </h1>
                  <span className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    {t('progress.student_badge')}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {t('progress.subtitle')}
                </p>
                {reportData?.student?.createdAt && (
                  <p className="text-xs text-gray-500 pt-0.5">
                    {t('progress.member_since')} {new Date(reportData.student.createdAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                onClick={fetchMyProgress}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('progress.refresh')}
              </button>

              <Link
                href="/courses"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <span>{t('progress.browse_courses')}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">{t('progress.loading')}</p>
          </div>
        )}

        {!loading && reportData && (
          <>
            {/* KPI Cards Grid (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Enrolled Courses */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('progress.kpi_enrolled')}</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{reportData.summary.totalEnrolledCourses}</span>
                  <span className="text-xs text-gray-400">
                    ({reportData.summary.fullyCompletedCourses} {t('progress.completed_count')})
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${reportData.summary.totalEnrolledCourses > 0 ? (reportData.summary.fullyCompletedCourses / reportData.summary.totalEnrolledCourses) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Overall Completion Rate */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('progress.kpi_overall')}</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400">{reportData.summary.overallCompletionRate}%</span>
                  <span className="text-xs text-gray-400">{t('progress.avg_across')}</span>
                </div>
                <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${reportData.summary.overallCompletionRate}%` }}
                  />
                </div>
              </div>

              {/* Card 3: Lessons Completed */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('progress.kpi_lessons')}</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{reportData.summary.totalCompletedLessonsCount}</span>
                  <span className="text-xs text-gray-400">/ {reportData.summary.totalLessonsCount} {t('progress.total_lessons_suffix')}</span>
                </div>
                <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500" 
                    style={{ width: `${reportData.summary.totalLessonsCount > 0 ? (reportData.summary.totalCompletedLessonsCount / reportData.summary.totalLessonsCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Card 4: Quiz Performance */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('progress.kpi_quiz_score')}</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-purple-400">
                    {reportData.summary.submittedQuizzesCount > 0 ? `${reportData.summary.averageQuizScore}%` : 'N/A'}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({reportData.summary.submittedQuizzesCount} {t('progress.taken_count')})
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  {reportData.summary.submittedQuizzesCount > 0 
                    ? `${t('progress.highest_score')} ${reportData.summary.highestQuizScore}%`
                    : t('progress.no_quizzes')}
                </div>
              </div>
            </div>

            {/* Section 1: My Enrolled Courses & Detailed Progress */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{t('progress.course_breakdown_title')}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{t('progress.course_breakdown_sub')}</p>
                </div>

                {reportData.courses.length > 1 && (
                  <div className="w-full sm:w-72">
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder={t('progress.filter_courses')}
                      className="w-full px-3.5 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 text-xs transition-all shadow-inner"
                    />
                  </div>
                )}
              </div>

              {reportData.courses.length === 0 ? (
                <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-12 text-center backdrop-blur-md">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-500 mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">{t('progress.not_enrolled_title')}</h3>
                  <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto mb-6">
                    {t('progress.not_enrolled_desc')}
                  </p>
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {t('progress.explore_directory')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 text-center text-gray-400">
                  {t('progress.no_matching_courses').replace('{search}', courseSearch)}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCourses.map((course) => {
                    const isExpanded = !!expandedCourses[course.documentId];

                    return (
                      <div 
                        key={course.documentId}
                        className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden transition-all shadow-lg hover:border-white/20 backdrop-blur-md"
                      >
                        {/* Course Card Header */}
                        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/70">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold text-white tracking-tight truncate">
                                {course.courseTitle}
                              </h3>
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
                                {course.courseType}
                              </span>
                              {course.courseTag && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  {course.courseTag}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                              {course.courseAuthor && (
                                <span>{t('progress.instructor_label')} <strong className="text-gray-300">{course.courseAuthor.username}</strong></span>
                              )}
                              <span>{t('progress.enrolled_label')} {new Date(course.enrolledAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>

                          {/* Progress Metrics & Action Buttons */}
                          <div className="flex flex-wrap items-center gap-4 self-end md:self-center">
                            <div className="text-right">
                              <div className="flex items-baseline justify-end gap-1.5">
                                <span className={`text-xl font-extrabold ${course.isFullyCompleted ? 'text-emerald-400' : 'text-cyan-400'}`}>
                                  {course.completionPercentage}%
                                </span>
                                <span className="text-xs text-gray-400">
                                  ({course.completedLessons}/{course.totalLessons} {t('progress.lessons_metric')})
                                </span>
                              </div>
                              <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                                <div 
                                  className={`h-full transition-all duration-500 ${course.isFullyCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-500'}`}
                                  style={{ width: `${course.completionPercentage}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Link
                                href={`/courses/${course.documentId}`}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                              >
                                <span>{course.isFullyCompleted ? t('progress.review_course') : t('progress.continue_btn')}</span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                              </Link>

                              <button
                                onClick={() => toggleCourseExpand(course.documentId)}
                                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <span>{isExpanded ? t('progress.hide_lessons') : t('progress.view_lessons')}</span>
                                <svg 
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Lesson Checklist Table */}
                        {isExpanded && (
                          <div className="border-t border-white/10 bg-slate-950/60 p-4 sm:p-6">
                            {course.lessons.length === 0 ? (
                              <p className="text-xs text-gray-500 text-center py-4">{t('progress.no_lessons')}</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="text-gray-400 border-b border-white/5 pb-2">
                                      <th className="py-2.5 px-3 font-semibold">{t('progress.th_order')}</th>
                                      <th className="py-2.5 px-3 font-semibold">{t('progress.th_lesson_title')}</th>
                                      <th className="py-2.5 px-3 font-semibold">{t('progress.th_duration')}</th>
                                      <th className="py-2.5 px-3 font-semibold">{t('progress.th_status')}</th>
                                      <th className="py-2.5 px-3 font-semibold">{t('progress.th_completed_date')}</th>
                                      <th className="py-2.5 px-3 font-semibold text-right">{t('progress.th_action')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    {course.lessons.map((lesson) => (
                                      <tr key={lesson.documentId || lesson.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-2.5 px-3 font-mono text-gray-400">
                                          {lesson.order}
                                        </td>
                                        <td className="py-2.5 px-3 font-medium text-slate-200">
                                          {lesson.title}
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-400 font-mono">
                                          {formatDuration(lesson.durationInSeconds)}
                                        </td>
                                        <td className="py-2.5 px-3">
                                          {lesson.completed ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30">
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                              </svg>
                                              {t('progress.status_completed')}
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-gray-400 text-[11px] border border-white/5">
                                              {t('progress.status_pending')}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px]">
                                          {lesson.completedAt 
                                            ? new Date(lesson.completedAt).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            : '—'}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                          <Link
                                            href={`/courses/${course.documentId}/lessons/${lesson.documentId}`}
                                            className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline inline-flex items-center gap-1"
                                          >
                                            <span>{lesson.completed ? t('progress.action_replay') : t('progress.action_watch')}</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                          </Link>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Quizzes & Assessment Performance */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{t('progress.quizzes_section_title')}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{t('progress.quizzes_section_sub')}</p>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {reportData.quizzes.length} {reportData.quizzes.length === 1 ? t('progress.attempt_single') : t('progress.attempts_count')}
                </span>
              </div>

              {reportData.quizzes.length === 0 ? (
                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 text-center text-gray-400 backdrop-blur-md">
                  <p className="text-sm">{t('progress.no_quizzes')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('progress.no_quizzes_desc')}</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950/80 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">{t('progress.th_quiz_title')}</th>
                          <th className="py-3 px-4">{t('progress.th_course')}</th>
                          <th className="py-3 px-4 text-center">{t('progress.th_score')}</th>
                          <th className="py-3 px-4 text-center">{t('progress.th_grade')}</th>
                          <th className="py-3 px-4 text-center">{t('progress.th_violations')}</th>
                          <th className="py-3 px-4 text-center">{t('progress.th_quiz_status')}</th>
                          <th className="py-3 px-4 text-right">{t('progress.th_date_taken')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {reportData.quizzes.map((quiz) => {
                          const isHigh = quiz.percentage >= 80;
                          const isMed = quiz.percentage >= 50 && quiz.percentage < 80;

                          return (
                            <tr key={quiz.documentId || quiz.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3.5 px-4 font-semibold text-white">
                                {quiz.quizTitle}
                              </td>
                              <td className="py-3.5 px-4 text-xs text-gray-300">
                                {quiz.courseTitle}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                                {quiz.score} / {quiz.totalQuestion}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  isHigh 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                    : isMed 
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}>
                                  {quiz.percentage}%
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {quiz.violationScore > 0 || quiz.violationsCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 font-semibold">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    -{quiz.violationScore} pts ({quiz.violationsCount} {t('progress.violations_alerts')})
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500">{t('progress.violations_none')}</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                                  quiz.status === 'submitted' 
                                    ? 'bg-emerald-500/10 text-emerald-400' 
                                    : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {quiz.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right text-xs text-gray-400 font-mono">
                                {new Date(quiz.submittedAt || quiz.startedAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
