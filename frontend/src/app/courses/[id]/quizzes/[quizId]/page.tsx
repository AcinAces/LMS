'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

export default function QuizTakingPage() {
  const toast = useToast();
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const quizId = params.quizId as string;
  const { t } = useLanguage();

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(0);
  
  const [violationFlags, setViolationFlags] = useState({
    fullscreen: false,
    blur: false,
    visibility: false
  });
  
  const [violationScore, setViolationScore] = useState(0);
  const [violationsLog, setViolationsLog] = useState<{ msg: string; penalty: number; time: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showPreSubmitModal, setShowPreSubmitModal] = useState(false);
  const [showSubmissionSuccessModal, setShowSubmissionSuccessModal] = useState(false);
  const [solutionFilter, setSolutionFilter] = useState<'all' | 'correct' | 'incorrect' | 'flagged'>('all');

  const isSubmittedOrExitingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        const headers: any = {};
        if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quizzes/${quizId}?populate[questions][populate][0]=options`, { headers });
        if (res.ok) {
          const data = await res.json();
          const quizData = data.data;
          setQuiz(quizData);
          const duration = (quizData.timeLimit || 15) * 60;
          setTimeLeft(duration);
          setTotalDurationSeconds(duration);

          const savedProgress = localStorage.getItem(`quizProgress_${quizId}`);
          if (savedProgress) {
            try { setAnswers(JSON.parse(savedProgress)); } catch(e){}
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const reportViolation = useCallback(async (type: 'fullscreen' | 'blur' | 'visibility') => {
    if (!attemptId || completed || isSubmittedOrExitingRef.current || submitting) return;
    
    if (violationFlags[type]) return;
    
    let penalty = 0;
    let logMessage = '';
    if (type === 'fullscreen') { penalty = 2; logMessage = t('quiz.exit_fullscreen'); }
    if (type === 'blur') { penalty = 5; logMessage = t('quiz.minimize_screen'); }
    if (type === 'visibility') { penalty = 5; logMessage = t('quiz.change_tab'); }

    setViolationFlags(prev => ({ ...prev, [type]: true }));
    setViolationScore(prev => prev + penalty);
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setViolationsLog(prev => [{ msg: logMessage, penalty, time: timeStr }, ...prev]);
    
    toast.error(`⚠️ Security Alert: ${logMessage} (-${penalty} marks)`);

    try {
      const jwt = localStorage.getItem('jwt');
      const headers: any = {
        'Content-Type': 'application/json',
        ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
      };

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quiz-attempts/${attemptId}/violation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: { type }
        })
      });
      
    } catch (err) {
      console.error("Failed to sync violation to server", err);
    }
  }, [attemptId, completed, submitting, violationFlags, t, toast]);

  const violationCount = (violationFlags.fullscreen ? 1 : 0) + (violationFlags.blur ? 1 : 0) + (violationFlags.visibility ? 1 : 0);

  const submitQuiz = useCallback(async () => {
    if (!attemptId || isSubmittedOrExitingRef.current) return;
    isSubmittedOrExitingRef.current = true;
    setSubmitting(true);
    setShowPreSubmitModal(false);
    setShowSubmissionSuccessModal(true);
    
    const startTime = Date.now();

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }

      const jwt = localStorage.getItem('jwt');
      const headers: any = {
        'Content-Type': 'application/json',
        ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
      };

      const submitAnswers: Record<string, string> = {};
      let correctCount = 0;
      let incorrectCount = 0;

      if (quiz?.questions) {
        for (const q of quiz.questions) {
          const selectedOId = answers[q.id];
          if (selectedOId) {
            const selectedOpt = q.options?.find((o: any) => o.id === selectedOId);
            if (selectedOpt) {
              submitAnswers[q.documentId] = selectedOpt.documentId;
              if (selectedOpt.isCorrect) {
                correctCount++;
              } else {
                incorrectCount++;
              }
            }
          } else {
            incorrectCount++;
          }
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quiz-attempts/${attemptId}/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: { answers: submitAnswers }
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const serverRes = await res.json();
      const attemptData = serverRes.data;

      localStorage.removeItem(`quizProgress_${quizId}`);

      const timeSpent = totalDurationSeconds - timeLeft;
      setResultData({
        ...attemptData,
        correctCount,
        incorrectCount,
        timeSpent: timeSpent > 0 ? timeSpent : totalDurationSeconds,
        answersMap: answers
      });

      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 3000 - elapsed);
      
      setTimeout(() => {
        setShowSubmissionSuccessModal(false);
        setCompleted(true);
      }, delay);

      toast.success('Quiz submitted successfully!');
    } catch (err: any) {
      console.error("Submit failed", err);
      toast.error(err.message || "Failed to submit quiz");
      isSubmittedOrExitingRef.current = false;
      setShowSubmissionSuccessModal(false);
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, quiz, answers, quizId, totalDurationSeconds, timeLeft, toast]);

  useEffect(() => {
    if (violationCount >= 3 && started && !completed && !submitting && !isSubmittedOrExitingRef.current) {
      toast.error('Maximum violations reached (3/3). Exam automatically terminated.');
      submitQuiz();
    }
  }, [violationCount, started, completed, submitting, submitQuiz, toast]);

  useEffect(() => {
    if (!started || completed || isSubmittedOrExitingRef.current) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, completed, submitQuiz]);

  useEffect(() => {
    if (!started || completed || isSubmittedOrExitingRef.current) return;

    const handleFullscreenChange = () => {
      if (!isSubmittedOrExitingRef.current && !document.fullscreenElement) {
        reportViolation('fullscreen');
      }
    };

    const handleVisibilityChange = () => {
      if (!isSubmittedOrExitingRef.current && document.hidden) {
        reportViolation('visibility');
      }
    };

    const handleBlur = () => {
      if (!isSubmittedOrExitingRef.current) {
        reportViolation('blur');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [started, completed, reportViolation]);

  // Keyboard Shortcuts for swift answering
  useEffect(() => {
    if (!started || completed || showPreSubmitModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentQ = quiz?.questions?.[activeQuestionIndex];
      if (!currentQ) return;

      // Numbers 1-4
      if (['1', '2', '3', '4'].includes(e.key)) {
        const optionIndex = parseInt(e.key) - 1;
        const opt = currentQ.options?.[optionIndex];
        if (opt) handleOptionSelect(currentQ.id, opt.id);
      }
      // Letters A-D
      else if (['a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].includes(e.key)) {
        const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, A: 0, B: 1, C: 2, D: 3 };
        const optionIndex = map[e.key];
        const opt = currentQ.options?.[optionIndex];
        if (opt) handleOptionSelect(currentQ.id, opt.id);
      }
      // Arrow navigation
      else if (e.key === 'ArrowRight' || e.key === 'j') {
        if (activeQuestionIndex < (quiz.questions.length - 1)) {
          setActiveQuestionIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        if (activeQuestionIndex > 0) {
          setActiveQuestionIndex(prev => prev - 1);
        }
      }
      // F to flag
      else if (e.key === 'f' || e.key === 'F') {
        toggleFlag(currentQ.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, completed, showPreSubmitModal, activeQuestionIndex, quiz, answers]);

  const handleStart = async () => {
    try {
      setSubmitting(true);
      isSubmittedOrExitingRef.current = false;
      setActiveQuestionIndex(0);
      setAnswers({});
      setFlagged({});
      setViolationFlags({ fullscreen: false, blur: false, visibility: false });
      setViolationScore(0);
      setViolationsLog([]);

      const jwt = localStorage.getItem('jwt');
      const headers: any = {
        'Content-Type': 'application/json',
        ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quiz-attempts/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: { quizId }
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const responseData = await res.json();
      const attempt = responseData.data;

      setAttemptId(attempt.documentId || attempt.id);

      if (containerRef.current && !document.fullscreenElement) {
        await containerRef.current.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request ignored or failed:", err);
        });
      }

      setStarted(true);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to start quiz. Please ensure your browser allows fullscreen.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReEnterFullscreen = async () => {
    if (containerRef.current && !document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        toast.success("Fullscreen restored.");
      } catch (err) {
        toast.error("Could not activate fullscreen. Please click anywhere on the page first.");
      }
    }
  };

  const handleOptionSelect = (qId: number, oId: number) => {
    const newAnswers = { ...answers, [qId]: oId };
    setAnswers(newAnswers);
    localStorage.setItem(`quizProgress_${quizId}`, JSON.stringify(newAnswers));
  };

  const handleClearOption = (qId: number) => {
    const newAnswers = { ...answers };
    delete newAnswers[qId];
    setAnswers(newAnswers);
    localStorage.setItem(`quizProgress_${quizId}`, JSON.stringify(newAnswers));
  };

  const toggleFlag = (qId: number) => {
    setFlagged(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalQuestions = quiz?.questions?.length || 0;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16 bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Loading proctored examination...</p>
      </div>
    </div>
  );

  if (!quiz) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-16 bg-slate-950 text-white space-y-4">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-xl font-bold">{t('quiz.no_quizzes')}</h2>
      <Link href={`/courses/${courseId}/quizzes`} className="text-emerald-400 hover:underline text-sm">
        ← {t('quiz.back_to_quizzes')}
      </Link>
    </div>
  );

  // ----------------------------------------------------
  // ANIMATED QUIZ SUBMISSION CELEBRATION (3s TRANSITION)
  // ----------------------------------------------------
  if (showSubmissionSuccessModal) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
        <AnimatedBackground />
        
        <div className="relative z-10 w-full max-w-md bg-slate-900/95 border border-emerald-500/30 rounded-3xl p-8 sm:p-10 text-center shadow-2xl backdrop-blur-2xl animate-fade-in-up">
          
          {/* Pulsing ambient light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

          {/* Animated Success Badge */}
          <div className="relative z-10 mx-auto w-24 h-24 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" style={{ animationDuration: '2s' }} />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-4xl shadow-2xl shadow-emerald-500/30">
              <svg className="w-10 h-10 text-slate-950 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Title & Feedback */}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 relative z-10">
            Quiz Submitted! 🎉
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-8 relative z-10 max-w-xs mx-auto">
            Your responses have been recorded. Generating your performance scorecard...
          </p>

          {/* 3-Second Progress Fill Bar */}
          <div className="relative z-10 space-y-2.5">
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/10 p-0.5 shadow-inner">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
                style={{
                  animation: 'quizProgressFill 3s ease-out forwards'
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Response captured
              </span>
              <span>Results in 3s...</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 1. POST-EXAM RESULTS SCORECARD & SOLUTION REVIEW
  // ----------------------------------------------------
  if (completed && resultData) {
    const isPassed = (resultData.percentage ?? 0) >= 60;
    const finalScore = resultData.score ?? 0;
    const percentage = Math.round(resultData.percentage ?? 0);
    const penalty = resultData.violationScore ?? violationScore;

    const filteredQuestions = quiz.questions?.filter((q: any, idx: number) => {
      const selectedOId = answers[q.id];
      const correctOpt = q.options?.find((o: any) => o.isCorrect);
      const isCorrect = selectedOId && correctOpt && selectedOId === correctOpt.id;
      const isFlag = flagged[q.id];

      if (solutionFilter === 'correct') return isCorrect;
      if (solutionFilter === 'incorrect') return !isCorrect;
      if (solutionFilter === 'flagged') return isFlag;
      return true;
    });

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <AnimatedBackground />
        
        <div className="max-w-4xl mx-auto relative z-10 space-y-8 animate-fade-in-up">
          
          {/* Header Scorecard Banner */}
          <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden text-center sm:text-left">
            <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
              isPassed ? 'bg-emerald-500/15' : 'bg-rose-500/15'
            }`} />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10">
              <div className="space-y-3 max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono bg-white/5 border border-white/10 text-slate-300">
                  <span>{isPassed ? '🎉 Assessment Passed' : '📚 Needs Practice'}</span>
                  <span>•</span>
                  <span>{quiz.quizTitle}</span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  {isPassed ? t('quiz.passed') : t('quiz.failed')}
                </h1>
                
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {isPassed 
                    ? 'Congratulations on demonstrating strong competency in this subject! Review your questions below or proceed to the next chapter.' 
                    : 'You did not achieve the 60% threshold on this attempt. Review the detailed solutions below and retry when ready.'}
                </p>
              </div>

              {/* Circular Percentage Dial */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="42" 
                    className={isPassed ? 'stroke-emerald-500' : 'stroke-rose-500'} 
                    strokeWidth="8" 
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * Math.min(percentage, 100)) / 100}
                    strokeLinecap="round" 
                    fill="transparent"
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-white tracking-tight">{percentage}%</span>
                  <span className="text-[10px] font-mono uppercase text-slate-400">Score</span>
                </div>
              </div>
            </div>

            {/* Performance KPI Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
              <div className="bg-slate-950/80 rounded-2xl p-4 text-center border border-white/5 shadow-inner">
                <div className="text-2xl font-black text-emerald-400">{finalScore} / {totalQuestions}</div>
                <div className="text-[10px] font-mono uppercase text-slate-400 mt-0.5">{t('quiz.final_score')}</div>
              </div>
              <div className="bg-slate-950/80 rounded-2xl p-4 text-center border border-white/5 shadow-inner">
                <div className="text-2xl font-black text-cyan-400">{resultData.correctCount}</div>
                <div className="text-[10px] font-mono uppercase text-slate-400 mt-0.5">{t('quiz.correct_answers_count')}</div>
              </div>
              <div className="bg-slate-950/80 rounded-2xl p-4 text-center border border-white/5 shadow-inner">
                <div className="text-2xl font-black text-amber-400">{formatTime(resultData.timeSpent || 0)}</div>
                <div className="text-[10px] font-mono uppercase text-slate-400 mt-0.5">{t('quiz.time_spent')}</div>
              </div>
              <div className="bg-slate-950/80 rounded-2xl p-4 text-center border border-white/5 shadow-inner">
                <div className={`text-2xl font-black ${penalty > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  -{penalty} pts
                </div>
                <div className="text-[10px] font-mono uppercase text-slate-400 mt-0.5">{t('quiz.penalty_applied')}</div>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-white/10 relative z-10">
              <button
                type="button"
                onClick={() => {
                  isSubmittedOrExitingRef.current = false;
                  setShowSubmissionSuccessModal(false);
                  setCompleted(false);
                  setStarted(false);
                  setResultData(null);
                  setActiveQuestionIndex(0);
                  setAnswers({});
                  setFlagged({});
                  setViolationFlags({ fullscreen: false, blur: false, visibility: false });
                  setViolationScore(0);
                  setViolationsLog([]);
                  setTimeLeft(totalDurationSeconds);
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>🔄 {t('quiz.try_again')}</span>
              </button>

              <Link
                href={`/courses/${courseId}/quizzes`}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs sm:text-sm font-bold border border-white/10 transition-all cursor-pointer"
              >
                {t('quiz.back_to_quizzes')}
              </Link>

              <Link
                href={`/courses/${courseId}`}
                className="px-6 py-3 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-2xl text-xs sm:text-sm font-bold border border-white/5 transition-all ml-auto"
              >
                ← {t('quiz.back_to_course')}
              </Link>
            </div>
          </div>

          {/* Question Solutions Breakdown */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">{t('quiz.review_answers')}</h3>
                <p className="text-xs text-slate-400">Detailed breakdown of each question, your chosen option, and the correct answers.</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-white/10 rounded-2xl self-start">
                <button
                  onClick={() => setSolutionFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    solutionFilter === 'all' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('quiz.filter_all')}
                </button>
                <button
                  onClick={() => setSolutionFilter('correct')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    solutionFilter === 'correct' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  {t('quiz.filter_correct')}
                </button>
                <button
                  onClick={() => setSolutionFilter('incorrect')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    solutionFilter === 'incorrect' ? 'bg-rose-500/20 text-rose-300 shadow-sm' : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  {t('quiz.filter_incorrect')}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredQuestions?.map((q: any, idx: number) => {
                const selectedOId = answers[q.id];
                const selectedOpt = q.options?.find((o: any) => o.id === selectedOId);
                const correctOpt = q.options?.find((o: any) => o.isCorrect);
                const isCorrect = selectedOId && correctOpt && selectedOId === correctOpt.id;

                return (
                  <div 
                    key={q.id} 
                    className={`bg-slate-900/70 border rounded-3xl p-6 backdrop-blur-xl shadow-lg transition-all ${
                      isCorrect 
                        ? 'border-emerald-500/30' 
                        : 'border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                          isCorrect ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">Question {idx + 1}</span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        isCorrect ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {isCorrect ? '+1 Mark' : '0 Marks'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-5 leading-relaxed">
                      {q.questionText}
                    </h4>

                    <div className="space-y-2.5">
                      {q.options?.map((opt: any, oIndex: number) => {
                        const isSelected = selectedOId === opt.id;
                        const isThisCorrect = opt.isCorrect;
                        const letter = String.fromCharCode(65 + oIndex);

                        let optStyles = "bg-slate-950/60 border-white/5 text-slate-300";
                        if (isThisCorrect) {
                          optStyles = "bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-semibold";
                        } else if (isSelected && !isThisCorrect) {
                          optStyles = "bg-rose-500/15 border-rose-500/40 text-rose-200 font-semibold";
                        }

                        return (
                          <div 
                            key={opt.id} 
                            className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs sm:text-sm ${optStyles}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                                isThisCorrect 
                                  ? 'bg-emerald-500 text-slate-950' 
                                  : isSelected && !isThisCorrect 
                                    ? 'bg-rose-500 text-white' 
                                    : 'bg-white/5 text-slate-400'
                              }`}>
                                {letter}
                              </span>
                              <span>{opt.optionText}</span>
                            </div>

                            <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                                  Your Choice
                                </span>
                              )}
                              {isThisCorrect && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">
                                  Correct ✓
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. PRE-EXAM LOBBY & READINESS CHECKLIST
  // ----------------------------------------------------
  if (!started) {
    return (
      <div ref={containerRef} className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-24 px-4 sm:px-6">
        <AnimatedBackground />
        
        <div className="max-w-2xl mx-auto relative z-10 space-y-8 animate-fade-in-up">
          
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/20 mx-auto mb-6">
              📝
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              {quiz.quizTitle}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-8 max-w-lg mx-auto">
              {quiz.quizDescription || 'You are about to begin a proctored examination. Please review the requirements below before launching your session.'}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-slate-950/80 rounded-2xl p-3.5 text-center border border-white/5 shadow-inner">
                <div className="text-emerald-400 font-black text-xl">{totalQuestions}</div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">{t('quiz.questions')}</div>
              </div>
              <div className="bg-slate-950/80 rounded-2xl p-3.5 text-center border border-white/5 shadow-inner">
                <div className="text-cyan-400 font-black text-xl">{totalQuestions}</div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">{t('quiz.marks')}</div>
              </div>
              <div className="bg-slate-950/80 rounded-2xl p-3.5 text-center border border-white/5 shadow-inner">
                <div className="text-amber-400 font-black text-xl">{quiz.timeLimit || 15}</div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">{t('quiz.minutes')}</div>
              </div>
            </div>

            {/* Proctoring Warning Box */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-8 text-left space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
                <span>🛡️ {t('quiz.proctoring_warning')}</span>
              </div>
              <ul className="text-xs text-amber-200/90 space-y-2 list-disc list-inside leading-relaxed">
                <li>{t('quiz.p_rule1')}</li>
                <li>{t('quiz.p_rule2')}</li>
                <li>{t('quiz.p_rule3')}</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleStart}
              disabled={submitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-bold rounded-2xl transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('quiz.starting_session')}</span>
                </>
              ) : (
                <>
                  <span>🚀 {t('quiz.start_quiz')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. ACTIVE PROCTORED EXAM STAGE
  // ----------------------------------------------------
  const currentQ = quiz.questions?.[activeQuestionIndex];
  const isCurrentFlagged = currentQ && flagged[currentQ.id];
  const currentSelectedOId = currentQ && answers[currentQ.id];

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      
      {/* Top HUD Status Bar */}
      <header className="bg-slate-900/90 border-b border-white/10 px-4 sm:px-6 py-3.5 sticky top-0 z-40 backdrop-blur-xl shrink-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Quiz Title & Course */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
              Q
            </div>
            <div className="truncate">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate">{quiz.quizTitle}</h2>
              <p className="text-[10px] text-slate-400 font-mono truncate">Proctored Session</p>
            </div>
          </div>

          {/* Center Progress Metric */}
          <div className="hidden md:flex flex-col items-center gap-1 min-w-[200px]">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-white font-bold">{answeredCount} of {totalQuestions} answered</span>
              <span className="text-slate-500">({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Right Timer & Action Deck */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* Timer Badge */}
            <div className={`px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-inner border ${
              timeLeft < 60 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' 
                : timeLeft < 300 
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}>
              <span>⏱️</span>
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Re-enter Fullscreen Button (if lost) */}
            {!document.fullscreenElement && (
              <button
                type="button"
                onClick={handleReEnterFullscreen}
                className="hidden sm:flex px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all items-center gap-1 cursor-pointer"
                title="Restore Fullscreen"
              >
                <span>📺</span>
                <span>{t('quiz.enter_fullscreen')}</span>
              </button>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => setShowPreSubmitModal(true)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {t('quiz.submit_quiz')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: Left Question Area + Right Control Deck */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left Question Presentation Stage */}
        <main className="flex-1 flex flex-col justify-between space-y-6">
          {currentQ && (
            <div className="space-y-6">
              
              {/* Question Header Card */}
              <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
                      {t('quiz.question')} {activeQuestionIndex + 1} {t('quiz.of')} {totalQuestions}
                    </span>
                    <span className="text-xs font-mono text-slate-500">• 1 Mark</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFlag(currentQ.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                      isCurrentFlagged
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    <span>📌</span>
                    <span>{isCurrentFlagged ? t('quiz.unflag_question') : t('quiz.flag_question')}</span>
                  </button>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed pt-2">
                  {currentQ.questionText}
                </h3>
              </div>

              {/* Options Selectors */}
              <div className="space-y-3">
                {currentQ.options?.map((opt: any, oIndex: number) => {
                  const letter = String.fromCharCode(65 + oIndex);
                  const isSelected = currentSelectedOId === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleOptionSelect(currentQ.id, opt.id)}
                      className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer shadow-md ${
                        isSelected
                          ? 'bg-emerald-600/15 border-emerald-500 text-white shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                          : 'bg-slate-900/60 border-white/10 hover:border-white/25 hover:bg-slate-850 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-xl text-xs sm:text-sm font-mono font-bold flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                            : 'bg-slate-800 text-slate-300 border-white/10 group-hover:border-white/20'
                        }`}>
                          {letter}
                        </span>
                        <span className="text-xs sm:text-sm font-medium leading-relaxed">
                          {opt.optionText}
                        </span>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-500' 
                          : 'border-slate-600 group-hover:border-slate-400'
                      }`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-slate-950" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Toolbar Below Question */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleClearOption(currentQ.id)}
                  disabled={!currentSelectedOId}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-300 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                >
                  ✕ {t('quiz.clear_selection')}
                </button>

                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline-block">
                  Keyboard: 1-4 / A-D to select • ← → to navigate • F to flag
                </span>
              </div>
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={activeQuestionIndex === 0}
              className="px-5 py-3 rounded-2xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              ← {t('quiz.previous')}
            </button>

            {activeQuestionIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setActiveQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{t('quiz.next')}</span>
                <span>→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowPreSubmitModal(true)}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{t('quiz.submit_quiz')}</span>
                <span>✓</span>
              </button>
            )}
          </div>
        </main>

        {/* Right Sticky Control Deck */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6">
          
          {/* Question Palette Widget */}
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {t('quiz.question_palette')}
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {answeredCount}/{totalQuestions}
              </span>
            </div>

            {/* Grid Palette */}
            <div className="grid grid-cols-5 gap-2">
              {quiz.questions?.map((q: any, qIdx: number) => {
                const isAnswered = Boolean(answers[q.id]);
                const isFlag = Boolean(flagged[q.id]);
                const isCurrent = activeQuestionIndex === qIdx;

                let btnStyles = "bg-slate-950/80 text-slate-400 border-white/5 hover:border-white/20";
                if (isCurrent) {
                  btnStyles = "bg-cyan-500/20 text-cyan-300 border-cyan-400 ring-2 ring-cyan-500/40 font-bold";
                } else if (isFlag) {
                  btnStyles = "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold";
                } else if (isAnswered) {
                  btnStyles = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActiveQuestionIndex(qIdx)}
                    className={`h-10 rounded-xl border text-xs font-mono flex items-center justify-center transition-all cursor-pointer relative ${btnStyles}`}
                  >
                    <span>{qIdx + 1}</span>
                    {isFlag && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500" />
                <span>{t('quiz.answered')} ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-500" />
                <span>{t('quiz.flagged')} ({flaggedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500/40 border border-cyan-400" />
                <span>{t('quiz.current')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-white/10" />
                <span>{t('quiz.unanswered')} ({unansweredCount})</span>
              </div>
            </div>
          </div>

          {/* Proctor Guardian Security Monitor */}
          <div className="bg-slate-900/80 border border-rose-500/20 rounded-3xl p-5 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <span>🛡️ {t('quiz.proctor_guardian')}</span>
              </h4>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                {t('quiz.active_protection')}
              </span>
            </div>

            {/* Strike Gauge Meter */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{t('quiz.strikes')}</span>
                <span className={`font-bold ${violationCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {violationCount} / 3 Strikes
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 h-2">
                <div className={`rounded-full transition-all ${violationCount >= 1 ? 'bg-rose-500' : 'bg-slate-800'}`} />
                <div className={`rounded-full transition-all ${violationCount >= 2 ? 'bg-rose-500' : 'bg-slate-800'}`} />
                <div className={`rounded-full transition-all ${violationCount >= 3 ? 'bg-rose-500' : 'bg-slate-800'}`} />
              </div>

              <p className="text-[10px] text-slate-500 font-mono">
                {violationCount === 0 
                  ? 'No violations recorded.' 
                  : `${3 - violationCount} warning(s) before auto-cancel.`}
              </p>
            </div>

            {/* Rules Enforced List */}
            <ul className="text-xs font-mono space-y-2 text-slate-400">
              <li className={`flex items-center justify-between ${violationFlags.fullscreen ? 'text-rose-400 line-through' : ''}`}>
                <span>{t('quiz.exit_fullscreen')}</span>
                <span>-2 pts</span>
              </li>
              <li className={`flex items-center justify-between ${violationFlags.blur ? 'text-rose-400 line-through' : ''}`}>
                <span>{t('quiz.minimize_screen')}</span>
                <span>-5 pts</span>
              </li>
              <li className={`flex items-center justify-between ${violationFlags.visibility ? 'text-rose-400 line-through' : ''}`}>
                <span>{t('quiz.change_tab')}</span>
                <span>-5 pts</span>
              </li>
            </ul>

            {/* Security Logs Feed */}
            {violationsLog.length > 0 && (
              <div className="pt-3 border-t border-white/5 space-y-1.5">
                <p className="text-[10px] uppercase font-mono text-rose-400 font-bold">{t('quiz.server_logs')}</p>
                <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                  {violationsLog.map((log, lIdx) => (
                    <div key={lIdx} className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono text-rose-300 flex items-center justify-between">
                      <span>{log.msg}</span>
                      <span>{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Pre-Submission Summary Modal */}
      {showPreSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3.5 mb-4 text-emerald-400 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0">
                📋
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{t('quiz.pre_submit_summary')}</h3>
                <p className="text-xs text-slate-400">{t('quiz.submit_modal_desc')}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 my-6 relative z-10">
              <div className="bg-slate-950/80 rounded-2xl p-3.5 text-center border border-white/5">
                <div className="text-emerald-400 font-black text-xl">{answeredCount}</div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">{t('quiz.total_answered')}</div>
              </div>
              <div className="bg-slate-950/80 rounded-2xl p-3.5 text-center border border-white/5">
                <div className={`font-black text-xl ${unansweredCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {unansweredCount}
                </div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">{t('quiz.total_unanswered')}</div>
              </div>
              <div className="bg-slate-950/80 rounded-2xl p-3.5 text-center border border-white/5">
                <div className="text-cyan-400 font-black text-xl">{flaggedCount}</div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">{t('quiz.total_flagged')}</div>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs rounded-2xl mb-6 relative z-10 flex items-center gap-2">
                <span>⚠️</span>
                <span>You have {unansweredCount} unanswered question(s). Unanswered questions are marked as incorrect.</span>
              </div>
            )}

            <div className="flex items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => setShowPreSubmitModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl font-bold text-xs sm:text-sm transition-all border border-white/5 cursor-pointer"
              >
                {t('quiz.review_unanswered_btn')}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submitQuiz}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('quiz.submitting_server')}</span>
                  </>
                ) : (
                  <span>{t('quiz.confirm_submit_btn')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
