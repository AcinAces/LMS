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
  
  const [course, setCourse] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attemptsMap, setAttemptsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [showViolations, setShowViolations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchQuizzesAndAttempts = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const headers: HeadersInit = {};
        if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

        // 1. Fetch Course details with populated quizzes
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses/${courseId}?populate[quizzes][populate]=questions`, { headers });
        let courseData: any = null;
        let quizzesList: any[] = [];

        if (res.ok) {
          const data = await res.json();
          courseData = data.data;
          setCourse(courseData);
          if (Array.isArray(courseData?.quizzes)) {
            quizzesList = courseData.quizzes;
          }
        }

        const courseDocId = courseData?.documentId || courseId;
        const courseNumericId = courseData?.id;

        // 2. Fetch Quizzes for this course with questions explicitly populated
        try {
          const qRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quizzes?filters[$or][0][course][documentId][$eq]=${courseDocId}&filters[$or][1][course][id][$eq]=${courseNumericId || 0}&populate[questions]=true&sort=createdAt:asc`,
            { headers }
          );

          if (qRes.ok) {
            const qData = await qRes.json();
            if (Array.isArray(qData.data) && qData.data.length > 0) {
              quizzesList = qData.data;
            }
          }
        } catch (err) {
          console.warn('Could not fetch course quizzes:', err);
        }

        setQuizzes(quizzesList);

        // 3. Fetch User's Attempts for this course/quizzes
        if (jwt && user) {
          try {
            const attRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quiz-attempts?populate=quiz&sort=createdAt:desc`, { headers });
            if (attRes.ok) {
              const attData = await attRes.json();
              const attempts = attData.data || [];
              
              // Group best attempt per quiz
              const bestMap: Record<string, any> = {};
              attempts.forEach((att: any) => {
                const qDocId = att.quiz?.documentId || att.quiz?.id;
                if (!qDocId) return;

                if (!bestMap[qDocId]) {
                  bestMap[qDocId] = {
                    totalAttempts: 1,
                    latestAttempt: att,
                    bestScore: att.score ?? 0,
                    bestPercentage: att.percentage ?? 0,
                    lastSubmittedAt: att.submittedAt || att.createdAt,
                    status: att.status
                  };
                } else {
                  bestMap[qDocId].totalAttempts += 1;
                  if ((att.percentage ?? 0) > bestMap[qDocId].bestPercentage) {
                    bestMap[qDocId].bestScore = att.score;
                    bestMap[qDocId].bestPercentage = att.percentage;
                  }
                }
              });
              setAttemptsMap(bestMap);
            }
          } catch (e) {
            console.warn('Could not fetch quiz attempts history:', e);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzesAndAttempts();
  }, [courseId]);

  const filteredQuizzes = quizzes.filter(q => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (q.quizTitle && q.quizTitle.toLowerCase().includes(query)) ||
      (q.quizDescription && q.quizDescription.toLowerCase().includes(query))
    );
  });

  const totalQuizzes = quizzes.length;
  const completedQuizzes = Object.keys(attemptsMap).filter(k => attemptsMap[k]?.bestPercentage >= 60).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16 bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Loading course quizzes...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <AnimatedBackground />
      
      <div className="max-w-6xl mx-auto relative z-10 space-y-8 animate-fade-in-up">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/courses" className="hover:text-emerald-400 transition-colors">{t('footer.all_courses')}</Link>
            <span>/</span>
            <Link href={`/courses/${courseId}`} className="hover:text-emerald-400 transition-colors truncate max-w-[200px] sm:max-w-xs">
              {course?.title || 'Course'}
            </Link>
            <span>/</span>
            <span className="text-emerald-400 font-bold">{t('course_detail.quizzes_label')}</span>
          </div>
          <Link 
            href={`/courses/${courseId}`} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all shadow-sm"
          >
            <span>← {t('quiz.back_to_course')}</span>
          </Link>
        </div>

        {/* Hero Banner with Stats */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {t('quiz.proctored_assessments')}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {course?.title || 'Course'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                {t('quiz.available_quizzes')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                {t('quiz.quizzes_subtitle')}
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-center min-w-[100px] shadow-inner">
                <div className="text-2xl font-black text-emerald-400">{totalQuizzes}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{t('quiz.total_quizzes_label')}</div>
              </div>
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-center min-w-[100px] shadow-inner">
                <div className="text-2xl font-black text-cyan-400">{completedQuizzes}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{t('quiz.passed_label')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Anti-Cheat Guardian Information Card */}
        <div className="bg-slate-900/60 border border-cyan-500/20 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 text-xl font-bold">
                🛡️
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {t('quiz.instructions_title')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                  {t('quiz.proctor_info_desc')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowViolations(true)}
              className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>{t('quiz.click_violations')}</span>
              <span>↗</span>
            </button>
          </div>
        </div>

        {/* Quizzes Search & Filter Bar */}
        {quizzes.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('quiz.search_placeholder')}
                className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <span className="text-xs text-slate-400 font-mono self-end sm:self-center">
              {t('quiz.showing_quizzes_count', { filtered: filteredQuizzes.length, total: totalQuizzes })}
            </span>
          </div>
        )}

        {/* Quizzes Grid */}
        {filteredQuizzes.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-white/10 backdrop-blur-md space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-2xl text-slate-500">
              📝
            </div>
            <h3 className="text-lg font-bold text-white">
              {searchQuery ? t('quiz.no_matching') : t('quiz.no_quizzes')}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery 
                ? t('quiz.no_matching_desc', { query: searchQuery }) 
                : t('quiz.no_quizzes')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredQuizzes.map((quiz: any, index: number) => {
              const quizDocId = quiz.documentId || quiz.id;
              const attemptHistory = attemptsMap[quizDocId];
              const hasAttempted = Boolean(attemptHistory);
              const isPassed = attemptHistory && attemptHistory.bestPercentage >= 60;

              return (
                <div 
                  key={quiz.id || quizDocId || index} 
                  className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 sm:p-7 hover:border-emerald-500/40 transition-all group backdrop-blur-xl flex flex-col justify-between shadow-xl relative overflow-hidden"
                >
                  {/* Subtle Ambient Glow on Hover */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 group-hover:bg-emerald-500/10 rounded-full blur-2xl transition-all pointer-events-none" />

                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono font-bold text-slate-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-xl">
                        {t('quiz.assessment_num', { index: index + 1 })}
                      </span>
                      
                      {hasAttempted ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPassed 
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            {isPassed ? `${t('quiz.passed')} ✓` : t('quiz.attempted')}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded-lg border border-white/10">
                            {attemptHistory.bestPercentage}%
                          </span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-white/5">
                          {t('quiz.not_attempted')}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors leading-snug">
                      {quiz.quizTitle}
                    </h3>
                    
                    <p className="text-slate-400 text-xs sm:text-sm mb-6 line-clamp-3 leading-relaxed">
                      {quiz.quizDescription || 'Complete this proctored quiz to evaluate your retention and problem solving capabilities for this chapter.'}
                    </p>
                  </div>

                  <div>
                    {/* Metrics Bar */}
                    {(() => {
                      const questionCount = Array.isArray(quiz.questions) 
                        ? quiz.questions.length 
                        : (quiz.questionsCount ?? (quiz.totalQuestion || 0));
                      const maxMarks = questionCount;

                      return (
                        <div className="grid grid-cols-3 gap-2.5 mb-6">
                          <div className="bg-slate-950/80 rounded-2xl p-3 text-center border border-white/5 shadow-inner">
                            <div className="text-emerald-400 font-black text-lg">{questionCount}</div>
                            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{t('quiz.questions')}</div>
                          </div>
                          <div className="bg-slate-950/80 rounded-2xl p-3 text-center border border-white/5 shadow-inner">
                            <div className="text-cyan-400 font-black text-lg">{maxMarks}</div>
                            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{t('quiz.marks')}</div>
                          </div>
                          <div className="bg-slate-950/80 rounded-2xl p-3 text-center border border-white/5 shadow-inner">
                            <div className="text-amber-400 font-black text-lg">{quiz.timeLimit || 15}</div>
                            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{t('quiz.minutes')}</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Launch Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedQuiz(quiz)}
                      className={`w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                        hasAttempted
                          ? 'bg-slate-800 hover:bg-slate-700 text-white hover:text-emerald-300 border border-white/10 shadow-slate-900/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 hover:shadow-emerald-500/30'
                      }`}
                    >
                      <span>{hasAttempted ? `🔄 ${t('quiz.retake')}` : `▶ ${t('quiz.start_quiz')}`}</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation & Pre-Check Modal */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3.5 mb-4 text-amber-400 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
                🛡️
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{t('quiz.confirm_title')}</h3>
                <p className="text-xs text-amber-300/90 font-mono">{t('quiz.proctor_init_subtitle')}</p>
              </div>
            </div>

            <div className="space-y-4 my-6 relative z-10">
              <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-2">
                <p className="text-xs text-slate-300 font-semibold">{selectedQuiz.quizTitle}</p>
                {(() => {
                  const selQCount = Array.isArray(selectedQuiz.questions) 
                    ? selectedQuiz.questions.length 
                    : (selectedQuiz.questionsCount ?? (selectedQuiz.totalQuestion || 0));
                  return (
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                      <span>⏱️ {selectedQuiz.timeLimit || 15} {t('quiz.minutes')}</span>
                      <span>•</span>
                      <span>📝 {selQCount} {t('quiz.questions')}</span>
                      <span>•</span>
                      <span>🎯 {selQCount} {t('quiz.marks')}</span>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2 text-xs text-amber-200">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span>⚠️ {t('quiz.anti_cheat_checklist')}</span>
                </p>
                <ul className="space-y-1.5 list-disc list-inside text-amber-200/90">
                  <li>{t('quiz.p_rule1')}</li>
                  <li>{t('quiz.p_rule2')}</li>
                  <li>{t('quiz.p_rule3')}</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => setSelectedQuiz(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl font-bold text-xs sm:text-sm transition-all border border-white/5 cursor-pointer"
              >
                {t('quiz.cancel')}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/courses/${courseId}/quizzes/${selectedQuiz.documentId || selectedQuiz.id}`)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t('quiz.proceed')}</span>
                <span>🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring Violations Modal */}
      {showViolations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold">
                  ⚠️
                </div>
                <h3 className="text-xl font-bold text-white">{t('quiz.violations_title')}</h3>
              </div>
              <button 
                onClick={() => setShowViolations(false)} 
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📺</span>
                  <span className="text-xs sm:text-sm text-slate-200">{t('quiz.v_fullscreen')}</span>
                </div>
                <span className="text-rose-400 font-mono font-bold text-xs bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
                  {t('quiz.v_fullscreen_penalty')}
                </span>
              </li>
              <li className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🪟</span>
                  <span className="text-xs sm:text-sm text-slate-200">{t('quiz.v_minimize')}</span>
                </div>
                <span className="text-rose-400 font-mono font-bold text-xs bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
                  {t('quiz.v_minimize_penalty')}
                </span>
              </li>
              <li className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📑</span>
                  <span className="text-xs sm:text-sm text-slate-200">{t('quiz.v_tabs')}</span>
                </div>
                <span className="text-rose-400 font-mono font-bold text-xs bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
                  {t('quiz.v_tabs_penalty')}
                </span>
              </li>
            </ul>

            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl mb-6">
              <p className="text-rose-300 text-xs font-medium leading-relaxed flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">⚠️</span>
                <span>{t('quiz.violations_warning')}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowViolations(false)}
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-600/20 cursor-pointer"
            >
              {t('quiz.i_understand')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
