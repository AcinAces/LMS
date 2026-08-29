'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DataTable, { ColumnDef } from '@/components/admin/DataTable';
import QuizBuilderModal from '@/components/admin/QuizBuilderModal';
import { useToast } from '@/context/ToastContext';

export default function AdminQuizzesPage() {
  const toast = useToast();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const fetchQuizzesAndData = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      
      const [quizzesRes, coursesRes, enrollmentsRes, attemptsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quizzes?populate[course]=true&populate[questions]=true&sort=createdAt:desc`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?pagination[limit]=1000`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/enrollments?populate=course&pagination[limit]=10000`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quiz-attempts?populate[quiz]=true&populate[student]=true&pagination[limit]=10000`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        })
      ]);
      
      const rawQuizzes = quizzesRes.ok ? (await quizzesRes.json()).data || [] : [];
      const rawCourses = coursesRes.ok ? (await coursesRes.json()).data || [] : [];
      const rawEnrollments = enrollmentsRes.ok ? (await enrollmentsRes.json()).data || [] : [];
      const rawAttempts = attemptsRes.ok ? (await attemptsRes.json()).data || [] : [];

      setCourses(rawCourses);

      const enriched = rawQuizzes.map((quiz: any) => {
        const courseDocId = quiz.course?.documentId;
        const courseId = quiz.course?.id;

        // Total students enrolled in the linked course
        const enrolledStudents = rawEnrollments.filter((e: any) =>
          (courseDocId && e.course?.documentId === courseDocId) ||
          (courseId && e.course?.id === courseId)
        ).length;

        // Attempts for this quiz
        const attemptsForQuiz = rawAttempts.filter((a: any) =>
          (quiz.documentId && a.quiz?.documentId === quiz.documentId) ||
          (quiz.id && a.quiz?.id === quiz.id)
        );

        // Unique students who attempted
        const uniqueStudentIds = new Set(
          attemptsForQuiz.map((a: any) => a.student?.documentId || a.student?.id || a.student).filter(Boolean)
        );
        const uniqueStudentsCount = uniqueStudentIds.size;

        const participationRate = enrolledStudents > 0
          ? Math.round((uniqueStudentsCount / enrolledStudents) * 100)
          : 0;

        const submittedAttempts = attemptsForQuiz.filter((a: any) => a.status === 'submitted');
        const avgScore = submittedAttempts.length > 0
          ? Math.round(
              submittedAttempts.reduce((acc: number, a: any) => {
                const pct = a.percentage !== undefined && a.percentage !== null
                  ? Number(a.percentage)
                  : (a.totalQuestion > 0 ? (Number(a.score || 0) / Number(a.totalQuestion)) * 100 : 0);
                return acc + pct;
              }, 0) / submittedAttempts.length
            )
          : null;

        const questionsCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;

        return {
          ...quiz,
          enrolledStudents,
          uniqueStudentsCount,
          totalAttempts: attemptsForQuiz.length,
          participationRate,
          averageScore: avgScore,
          questionsCount
        };
      });

      setQuizzes(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzesAndData();
  }, []);

  const columns: ColumnDef<any>[] = [
    { 
      key: 'quizTitle', 
      label: 'Quiz Title', 
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          {row.course?.documentId ? (
            <Link 
              href={`/courses/${row.course.documentId}/quizzes/${row.documentId}`}
              target="_blank"
              className="font-bold text-white hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 group/link"
              title="Open live quiz page in new tab"
            >
              <span>{row.quizTitle}</span>
              <svg className="w-3.5 h-3.5 opacity-40 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 transition-all text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          ) : (
            <span className="font-bold text-white">{row.quizTitle}</span>
          )}
          <span className="text-[11px] text-gray-500 font-mono">ID: {row.documentId?.substring(0, 8)}...</span>
        </div>
      )
    },
    { 
      key: 'course', 
      label: 'Linked Course', 
      render: (row) => row.course?.documentId ? (
        <Link 
          href={`/courses/${row.course.documentId}`}
          target="_blank"
          className="text-gray-300 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 text-xs"
        >
          <span>{row.course.courseTitle}</span>
          <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      ) : (
        <span className="text-gray-500 text-xs italic">Unassigned</span>
      )
    },
    { 
      key: 'participation', 
      label: 'Students Taken vs Total', 
      render: (row) => (
        <div className="flex flex-col gap-1 min-w-[140px]">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={row.uniqueStudentsCount > 0 ? "text-emerald-400" : "text-gray-400"}>
              {row.uniqueStudentsCount} / {row.enrolledStudents} Students
            </span>
            <span className="text-gray-400 text-[11px]">({row.participationRate}%)</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${row.participationRate}%` }}
            />
          </div>
        </div>
      )
    },
    { 
      key: 'averageScore', 
      label: 'Average Score', 
      render: (row) => row.averageScore !== null ? (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
          row.averageScore >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
          row.averageScore >= 50 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 
          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }`}>
          {row.averageScore}% Avg ({row.totalAttempts} {row.totalAttempts === 1 ? 'attempt' : 'attempts'})
        </span>
      ) : (
        <span className="text-xs text-gray-500">No attempts yet</span>
      )
    },
    { 
      key: 'specs', 
      label: 'Specs', 
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="text-purple-300 font-semibold">{row.timeLimit ? `${row.timeLimit} mins` : 'No limit'}</span>
          <span>·</span>
          <span>{row.questionsCount} Qs</span>
        </div>
      )
    }
  ];

  const handleDelete = async (row: any) => {
    if (!confirm(`Are you sure you want to delete quiz "${row.quizTitle}"?`)) return;
    
    try {
      const jwt = localStorage.getItem('jwt');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quizzes/${row.documentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (!res.ok) throw new Error('Failed to delete quiz');
      toast.success(`Quiz "${row.quizTitle}" deleted.`);
      fetchQuizzesAndData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete quiz');
    }
  };

  if (loading) return <div>Loading quizzes...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Quizzes</h1>
        <p className="text-gray-400">Build quizzes, monitor student completion rates, and analyze exam averages.</p>
      </div>

      <DataTable 
        title="Quizzes"
        columns={columns}
        data={quizzes}
        onAdd={() => { setEditingData(null); setIsBuilderOpen(true); }}
        onEdit={(row) => { 
          setEditingData(row); 
          setIsBuilderOpen(true); 
        }}
        onDelete={handleDelete}
        addLabel="New Quiz"
      />

      <QuizBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSuccess={() => { setIsBuilderOpen(false); fetchQuizzesAndData(); }}
        courses={courses}
        initialData={editingData}
      />
    </div>
  );
}
