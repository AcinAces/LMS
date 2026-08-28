'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';

export default function CourseQuizzesPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { t } = useLanguage();
  
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [showViolations, setShowViolations] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        const headers: HeadersInit = {};
        if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses/${courseId}?populate=quizzes`, { headers });
        if (res.ok) {
          const data = await res.json();
          setQuizzes(data.data.quizzes || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [courseId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16 bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 relative z-10"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 px-6 pb-12">
      <AnimatedBackground />
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            {t('quiz.available_quizzes')}
          </h1>
          <Link href={`/courses/${courseId}`} className="text-gray-400 hover:text-white transition-colors">
            ← {t('quiz.back_to_course')}
          </Link>
        </div>

        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-6 mb-12 backdrop-blur-md">
          <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Important Quiz Rules & Instructions
          </h2>
          <ul className="space-y-2 text-blue-200 list-disc list-inside">
            <li>Ensure you have a stable internet connection during the Quiz period.</li>
            <li>Once started, the timer cannot be paused.</li>
            <li>Do not switch tabs or minimize the browser during the quiz.</li>
            <li>The quiz will be automatically submitted when the time limit is reached.</li>
            <li>
              The quiz will be proctored, <button onClick={() => setShowViolations(true)} className="text-blue-300 underline hover:text-blue-200">click here</button> to see violations.
            </li>
          </ul>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center text-gray-400 py-12 bg-black/40 rounded-xl border border-white/10">
            {t('quiz.no_quizzes')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.map((quiz: any) => (
              <div key={quiz.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-emerald-500/50 transition-all group backdrop-blur-sm flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {quiz.quizTitle}
                </h3>
                <p className="text-gray-400 text-sm mb-6 flex-1 line-clamp-3">
                  {quiz.quizDescription}
                </p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-black/40 rounded-lg p-3 text-center border border-white/5">
                    <div className="text-emerald-500 font-bold text-xl">{quiz.totalQuestion}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">{t('quiz.questions')}</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 text-center border border-white/5">
                    <div className="text-blue-500 font-bold text-xl">{quiz.totalQuestion}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Marks</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 text-center border border-white/5">
                    <div className="text-amber-500 font-bold text-xl">{quiz.timeLimit}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Minutes</div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedQuiz(quiz)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  {t('quiz.start_quiz')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <h3 className="text-xl font-bold text-white">Confirmation</h3>
            </div>
            <p className="text-gray-300 mb-8 leading-relaxed">
              This test will be proctored, are you sure you want to proceed?
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedQuiz(null)}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push(`/courses/${params.id}/quizzes/${selectedQuiz.documentId}`)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {showViolations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Proctor violations</h3>
              <button onClick={() => setShowViolations(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center justify-between">
                 <span className="text-gray-300">1. Exiting full-screen</span>
                 <span className="text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-md border border-red-500/20">-2 marks</span>
              </li>
              <li className="flex items-center justify-between">
                 <span className="text-gray-300">2. Minimizing the screen</span>
                 <span className="text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-md border border-red-500/20">-5 marks</span>
              </li>
              <li className="flex items-center justify-between">
                 <span className="text-gray-300">3. Changing tab</span>
                 <span className="text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-md border border-red-500/20">-5 marks</span>
              </li>
            </ul>
            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-8">
              <p className="text-red-400 text-sm font-bold flex items-center gap-2">
                 <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                 Accumulating all 3 violations will end the exam right away and award 0 marks. Each violation is counted only once.
              </p>
            </div>
            <button
              onClick={() => setShowViolations(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
            >
              I understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
