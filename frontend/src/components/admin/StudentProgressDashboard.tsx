'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/context/ToastContext';

interface StudentSummary {
  id: number;
  documentId: string;
  username: string;
  email: string;
  createdAt: string;
  enrolledCoursesCount: number;
  enrolledCourseTitles?: string[];
}

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

interface StudentProgressDashboardProps {
  role: 'admin' | 'content_manager' | 'instructor';
  title?: string;
  subtitle?: string;
}

export default function StudentProgressDashboard({
  role,
  title = 'Student Progress Reports',
  subtitle = 'Monitor enrolled students, track curriculum completion, and inspect quiz performance.'
}: StudentProgressDashboardProps) {
  const toast = useToast();
  
  // List State
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Student & Report State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<StudentReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Accordion state for expanded course lesson details
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  const fetchEnrolledStudents = async () => {
    setLoadingList(true);
    try {
      const jwt = localStorage.getItem('jwt');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/student-reports/students`, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || errJson.message || `Server error (${res.status})`);
      }

      const json = await res.json();
      setStudents(json.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error fetching student list');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchEnrolledStudents();
  }, []);

  const handleSelectStudent = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setLoadingReport(true);
    setReportData(null);
    setExpandedCourses({});

    try {
      const jwt = localStorage.getItem('jwt');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/student-reports/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to fetch student detailed report');
      }

      const json = await res.json();
      setReportData(json.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error loading report');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleBackToList = () => {
    setSelectedStudentId(null);
    setReportData(null);
  };

  const toggleCourseExpand = (courseDocId: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseDocId]: !prev[courseDocId]
    }));
  };

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(s => 
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.enrolledCourseTitles && s.enrolledCourseTitles.some(t => t.toLowerCase().includes(q)))
    );
  }, [students, searchQuery]);

  // Format seconds to mm:ss
  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ==========================================
  // RENDER DETAILED REPORT VIEW
  // ==========================================
  if (selectedStudentId) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/10 text-sm font-medium transition-all shadow-sm hover:scale-105 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Students List
            </button>
            <span className="text-gray-500 hidden sm:inline">|</span>
            <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Student Progress Report
            </span>
          </div>

          <button
            onClick={() => handleSelectStudent(selectedStudentId)}
            disabled={loadingReport}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <svg className={`w-3.5 h-3.5 ${loadingReport ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>

        {loadingReport && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Generating comprehensive student analytics report...</p>
          </div>
        )}

        {!loadingReport && reportData && (
          <>
            {/* Student Profile Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl font-black shadow-inner">
                    {reportData.student.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        {reportData.student.username}
                      </h2>
                      <span className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                        Enrolled Student
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-0.5">{reportData.student.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Member since: {new Date(reportData.student.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {role === 'instructor' && (
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-300">
                    <span className="text-gray-400">Report Scope:</span> <span className="font-semibold text-emerald-400">Your Authored Courses</span>
                  </div>
                )}
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Enrolled Courses */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enrolled Courses</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{reportData.summary.totalEnrolledCourses}</span>
                  <span className="text-xs text-gray-400">
                    ({reportData.summary.fullyCompletedCourses} completed)
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${reportData.summary.totalEnrolledCourses > 0 ? (reportData.summary.fullyCompletedCourses / reportData.summary.totalEnrolledCourses) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Metric 2: Overall Completion Rate */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Overall Completion</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400">{reportData.summary.overallCompletionRate}%</span>
                  <span className="text-xs text-gray-400">avg across courses</span>
                </div>
                <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${reportData.summary.overallCompletionRate}%` }}
                  />
                </div>
              </div>

              {/* Metric 3: Lessons Completed */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lessons Watched</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{reportData.summary.totalCompletedLessonsCount}</span>
                  <span className="text-xs text-gray-400">/ {reportData.summary.totalLessonsCount} total</span>
                </div>
                <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500" 
                    style={{ width: `${reportData.summary.totalLessonsCount > 0 ? (reportData.summary.totalCompletedLessonsCount / reportData.summary.totalLessonsCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Metric 4: Quiz Performance */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Quiz Score</span>
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
                    ({reportData.summary.submittedQuizzesCount} taken)
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  {reportData.summary.submittedQuizzesCount > 0 
                    ? `Highest Score: ${reportData.summary.highestQuizScore}%`
                    : 'No quizzes submitted yet'}
                </div>
              </div>
            </div>

            {/* Section 1: Enrolled Courses & Detailed Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Course Progress Breakdown</h3>
                  <p className="text-xs text-gray-400">Detailed lesson completion tracking for each enrolled course.</p>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {reportData.courses.length} {reportData.courses.length === 1 ? 'Course' : 'Courses'}
                </span>
              </div>

              {reportData.courses.length === 0 ? (
                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 text-center text-gray-400">
                  No courses found for this student under your viewing scope.
                </div>
              ) : (
                <div className="space-y-4">
                  {reportData.courses.map((course) => {
                    const isExpanded = !!expandedCourses[course.documentId];

                    return (
                      <div 
                        key={course.documentId}
                        className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden transition-all shadow-lg hover:border-white/20"
                      >
                        {/* Course Card Header */}
                        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/70">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-lg font-bold text-white tracking-tight truncate">
                                {course.courseTitle}
                              </h4>
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
                                <span>Instructor: <strong className="text-gray-300">{course.courseAuthor.username}</strong></span>
                              )}
                              <span>Enrolled: {new Date(course.enrolledAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>

                          {/* Progress Metrics & Toggle */}
                          <div className="flex items-center gap-6 self-end md:self-center">
                            <div className="text-right">
                              <div className="flex items-baseline justify-end gap-1.5">
                                <span className={`text-xl font-extrabold ${course.isFullyCompleted ? 'text-emerald-400' : 'text-cyan-400'}`}>
                                  {course.completionPercentage}%
                                </span>
                                <span className="text-xs text-gray-400">
                                  ({course.completedLessons}/{course.totalLessons} Lessons)
                                </span>
                              </div>
                              <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                                <div 
                                  className={`h-full transition-all duration-500 ${course.isFullyCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-500'}`}
                                  style={{ width: `${course.completionPercentage}%` }}
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => toggleCourseExpand(course.documentId)}
                              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{isExpanded ? 'Hide Lessons' : 'View Lessons'}</span>
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

                        {/* Expandable Lesson Checklist Table */}
                        {isExpanded && (
                          <div className="border-t border-white/10 bg-slate-950/60 p-4 sm:p-6">
                            {course.lessons.length === 0 ? (
                              <p className="text-xs text-gray-500 text-center py-4">No lessons in this course yet.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="text-gray-400 border-b border-white/5 pb-2">
                                      <th className="py-2.5 px-3 font-semibold">#</th>
                                      <th className="py-2.5 px-3 font-semibold">Lesson Title</th>
                                      <th className="py-2.5 px-3 font-semibold">Duration</th>
                                      <th className="py-2.5 px-3 font-semibold">Status</th>
                                      <th className="py-2.5 px-3 font-semibold text-right">Completion Date</th>
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
                                              Completed
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-gray-400 text-[11px] border border-white/5">
                                              Pending
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-gray-400 font-mono text-[11px]">
                                          {lesson.completedAt 
                                            ? new Date(lesson.completedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            : '—'}
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
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Quizzes & Assessment Records</h3>
                  <p className="text-xs text-gray-400">Exam scores, attempts, and proctoring violation logs.</p>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {reportData.quizzes.length} {reportData.quizzes.length === 1 ? 'Attempt' : 'Attempts'}
                </span>
              </div>

              {reportData.quizzes.length === 0 ? (
                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 text-center text-gray-400">
                  No quizzes or exam records taken by this student yet.
                </div>
              ) : (
                <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950/80 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Quiz Title</th>
                          <th className="py-3 px-4">Course</th>
                          <th className="py-3 px-4 text-center">Score</th>
                          <th className="py-3 px-4 text-center">Grade / %</th>
                          <th className="py-3 px-4 text-center">Violations</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Date Taken</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {reportData.quizzes.map((quiz) => {
                          const isHigh = quiz.percentage >= 80;
                          const isMed = quiz.percentage >= 60 && quiz.percentage < 80;

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
                                    -{quiz.violationScore} pts ({quiz.violationsCount} alerts)
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500">None</span>
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
                                {new Date(quiz.submittedAt || quiz.startedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
    );
  }

  // ==========================================
  // RENDER ENROLLED STUDENTS DIRECTORY VIEW
  // ==========================================
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
        </div>

        <button
          onClick={fetchEnrolledStudents}
          disabled={loadingList}
          className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
        >
          <svg className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Students
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 shadow-lg backdrop-blur-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search enrolled students by username, email, or course title..."
            className="w-full pl-11 pr-10 py-3 bg-slate-950/70 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Student List View */}
      {loadingList ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading enrolled students directory...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-500 mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">No Enrolled Students Found</h3>
          <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
            {searchQuery 
              ? `No student matching "${searchQuery}" was found. Try clearing your search term.`
              : role === 'instructor' 
              ? 'No students are currently enrolled in any of your courses.'
              : 'There are no students enrolled in any courses across the platform.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1 text-xs text-gray-400 font-medium">
            <span>Showing {filteredStudents.length} enrolled {filteredStudents.length === 1 ? 'student' : 'students'}</span>
            <span>Click any student to view their full progress report</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => {
              const studentKey = student.documentId || String(student.id);

              return (
                <div
                  key={studentKey}
                  onClick={() => handleSelectStudent(studentKey)}
                  className="bg-slate-900 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/10 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-3.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg group-hover:scale-105 transition-transform shadow-inner">
                        {student.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-white text-base tracking-tight truncate group-hover:text-emerald-400 transition-colors">
                          {student.username}
                        </h4>
                        <p className="text-xs text-gray-400 truncate">{student.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {student.enrolledCoursesCount} {student.enrolledCoursesCount === 1 ? 'Course Enrolled' : 'Courses Enrolled'}
                      </span>
                    </div>

                    {student.enrolledCourseTitles && student.enrolledCourseTitles.length > 0 && (
                      <div className="space-y-1 mb-4">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Enrolled In:</span>
                        <div className="flex flex-wrap gap-1">
                          {student.enrolledCourseTitles.slice(0, 2).map((title, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-gray-300 truncate max-w-full">
                              {title}
                            </span>
                          ))}
                          {student.enrolledCourseTitles.length > 2 && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-white/5 text-gray-500">
                              +{student.enrolledCourseTitles.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400 group-hover:text-emerald-400 font-semibold transition-colors">
                    <span>View Comprehensive Report</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
