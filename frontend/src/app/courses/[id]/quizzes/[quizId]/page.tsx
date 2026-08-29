'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/context/ToastContext';

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
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  const [violationFlags, setViolationFlags] = useState({
    fullscreen: false,
    blur: false,
    visibility: false
  });
  
  const [violationScore, setViolationScore] = useState(0);
  const [violationsLog, setViolationsLog] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

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
          setTimeLeft((quizData.timeLimit || 15) * 60);

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
    if (!attemptId) return;
    
    if (violationFlags[type]) return;
    
    let penalty = 0;
    let logMessage = '';
    if (type === 'fullscreen') { penalty = 2; logMessage = 'Exited full-screen'; }
    if (type === 'blur') { penalty = 5; logMessage = 'Minimized the screen'; }
    if (type === 'visibility') { penalty = 5; logMessage = 'Changed tab'; }

    setViolationFlags(prev => {
      const newFlags = { ...prev, [type]: true };
      return newFlags;
    });

    setViolationScore(prev => prev + penalty);
    setViolationsLog(prev => [`${logMessage} (-${penalty})`, ...prev]);

    try {
      const jwt = localStorage.getItem('jwt');
      const headers: any = {
        'Content-Type': 'application/json',
        ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quiz-attempts/${attemptId}/violation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: { type }
        })
      });
      
    } catch (err) {
      console.error("Failed to sync violation to server", err);
    }
  }, [attemptId, violationFlags]);

  const violationCount = (violationFlags.fullscreen ? 1 : 0) + (violationFlags.blur ? 1 : 0) + (violationFlags.visibility ? 1 : 0);

  const submitQuiz = useCallback(async () => {
    if (!attemptId) return;
    setSubmitting(true);
    
    try {
      const jwt = localStorage.getItem('jwt');
      const headers: any = {
        'Content-Type': 'application/json',
        ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
      };

      const submitAnswers: Record<string, string> = {};
      let totalQuestions = quiz?.questions?.length || 0;

      if (quiz?.questions) {
        for (const q of quiz.questions) {
          const selectedOId = answers[q.id];
          if (selectedOId) {
            const selectedOpt = q.options?.find((o: any) => o.id === selectedOId);
            if (selectedOpt) {
              submitAnswers[q.documentId] = selectedOpt.documentId;
            }
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

      const responseData = await res.json();
      const finalAttempt = responseData.data;

      localStorage.removeItem(`quizProgress_${quizId}`);
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      if (finalAttempt.violationsLog?.length >= 3) {
        toast.error('Exam Cancelled. You received 0 marks due to maximum violations.', 'Exam Terminated');
      } else {
        toast.success(`Final Score: ${finalAttempt.score}/${totalQuestions} (Violations Deducted: ${finalAttempt.violationScore})`, 'Quiz Submitted Successfully!');
      }
      
      setTimeout(() => {
        router.push(`/courses/${courseId}/quizzes`);
      }, 1000);

    } catch (err) {
      console.error(err);
      toast.error('Error submitting quiz. Please check your connection and try again.');
      setSubmitting(false);
    }
  }, [answers, quiz, attemptId, courseId, quizId, router, toast]);

  useEffect(() => {
    if (violationCount >= 3 && !submitting && attemptId) {
      toast.error("Maximum violations reached. Submitting quiz now...", "Exam Disqualified");
      setTimeout(() => {
        submitQuiz();
      }, 800);
    }
  }, [violationCount, submitting, submitQuiz, attemptId, toast]);

  useEffect(() => {
    if (!started || submitting || !attemptId) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) reportViolation('fullscreen');
    };
    const handleVisibilityChange = () => {
      if (document.hidden) reportViolation('visibility');
    };
    const handleBlur = () => {
      reportViolation('blur');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [started, submitting, attemptId, reportViolation]);

  useEffect(() => {
    if (!started || submitting) return;
    if (timeLeft <= 0) {
      submitQuiz();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [started, timeLeft, submitting, submitQuiz]);

  useEffect(() => {
    if (!started || submitting) return;
    const saveId = setInterval(() => {
      localStorage.setItem(`quizProgress_${quizId}`, JSON.stringify(answers));
    }, 10000);
    return () => clearInterval(saveId);
  }, [started, answers, quizId, submitting]);

  const handleStart = async () => {
    try {
      setSubmitting(true);
      const jwt = localStorage.getItem('jwt');
      const headers: any = {
        'Content-Type': 'application/json',
        ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quiz-attempts/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: { quizId: quiz.documentId } })
      });

      if (!res.ok) {
        throw new Error("Failed to start attempt on server");
      }
      
      const data = await res.json();
      setAttemptId(data.data.documentId);
      
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
      }
      setStarted(true);
      setSubmitting(false);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      toast.error("Failed to start quiz. Please try again and ensure your browser allows fullscreen mode.");
    }
  };

  const handleOptionSelect = (qId: number, oId: number) => {
    const newAnswers = { ...answers, [qId]: oId };
    setAnswers(newAnswers);
    localStorage.setItem(`quizProgress_${quizId}`, JSON.stringify(newAnswers));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16 bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 relative z-10"></div>
    </div>
  );

  if (!quiz) return (
    <div className="min-h-screen flex items-center justify-center pt-16 bg-gray-900 text-white">
      <h2>Quiz not found.</h2>
    </div>
  );

  return (
    <div ref={containerRef} className={`min-h-screen ${started ? 'bg-gray-900 text-white p-6' : 'bg-transparent pt-16'}`}>
      {!started && <AnimatedBackground />}
      
      {!started ? (
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 flex flex-col items-center">
          <div className="bg-black/60 backdrop-blur-md p-10 rounded-2xl border border-white/10 text-center">
            <h1 className="text-4xl font-extrabold text-white mb-4">{quiz.quizTitle}</h1>
            <p className="text-gray-400 mb-8">{quiz.quizDescription}</p>
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-lg mb-8 text-left">
              <p className="font-bold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Proctoring Warning
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Your browser will enter full-screen mode.</li>
                <li>Do not exit full-screen, minimize, or switch tabs.</li>
                <li>3 violations will end the exam automatically!</li>
              </ul>
            </div>
            <button
              onClick={handleStart}
              disabled={submitting}
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? 'Starting Session...' : t('quiz.start_quiz')}
            </button>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
          <div className="flex-1 overflow-y-auto pr-2 pb-20">
            <h1 className="text-3xl font-extrabold mb-8">{quiz.quizTitle}</h1>
            
            <div className="space-y-10">
              {quiz.questions?.map((q: any, index: number) => (
                <div key={q.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-6 flex gap-3">
                    <span className="text-emerald-500">{index + 1}.</span>
                    <span>{q.questionText}</span>
                  </h3>
                  <div className="space-y-3">
                    {q.options?.map((opt: any) => (
                      <label 
                        key={opt.id} 
                        className={`block p-4 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === opt.id ? 'bg-emerald-600/20 border-emerald-500' : 'bg-black/40 border-white/10 hover:border-emerald-500/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name={`question_${q.id}`} 
                            checked={answers[q.id] === opt.id}
                            onChange={() => handleOptionSelect(q.id, opt.id)}
                            className="w-5 h-5 text-emerald-500 bg-transparent border-gray-500 focus:ring-emerald-500 focus:ring-2"
                          />
                          <span className="text-gray-200">{opt.optionText}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 mb-8">
              <button
                onClick={() => {
                  if(confirm("Are you sure you want to submit your quiz early?")) {
                    submitQuiz();
                  }
                }}
                disabled={submitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {submitting ? 'Submitting to Server...' : t('quiz.submit_quiz')}
              </button>
            </div>
          </div>

          <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center sticky top-6">
              <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider font-bold">Time Remaining</div>
              <div className={`text-5xl font-mono font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 sticky top-48">
              <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Proctor Status
              </h3>
              
              <div className="mb-6 bg-red-950/50 p-4 rounded-lg text-center border border-red-900">
                <div className="text-sm text-red-300 uppercase tracking-widest mb-1">Violations</div>
                <div className="text-4xl font-extrabold text-red-500">{violationCount} / 3</div>
                
                <div className="mt-4 w-full bg-red-950 rounded-full h-2.5 border border-red-900 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${violationCount === 1 ? 'bg-yellow-500' : violationCount === 2 ? 'bg-orange-500' : violationCount >= 3 ? 'bg-red-500' : 'bg-transparent'}`}
                    style={{ width: `${(violationCount / 3) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-red-400 mt-2">
                  {violationCount >= 3 ? 'EXAM CANCELLED' : `${3 - violationCount} strikes remaining`}
                </div>
              </div>

              <div className="text-sm font-semibold text-gray-400 mb-2">Rules Enforced (Max 1 each):</div>
              <ul className="text-xs space-y-2 text-gray-400 mb-4">
                <li className={`flex items-center justify-between ${violationFlags.fullscreen ? 'text-red-500 line-through' : ''}`}>
                  <span>Exit full-screen</span>
                  <span>-2</span>
                </li>
                <li className={`flex items-center justify-between ${violationFlags.blur ? 'text-red-500 line-through' : ''}`}>
                  <span>Minimize Screen</span>
                  <span>-5</span>
                </li>
                <li className={`flex items-center justify-between ${violationFlags.visibility ? 'text-red-500 line-through' : ''}`}>
                  <span>Change tab</span>
                  <span>-5</span>
                </li>
              </ul>

              {violationsLog.length > 0 && (
                <div className="mt-4 border-t border-red-900/50 pt-4">
                  <div className="text-sm font-semibold text-red-400 mb-2">Server Logs:</div>
                  <div className="h-24 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {violationsLog.map((log, i) => (
                      <div key={i} className="text-xs text-red-300 bg-red-500/10 p-2 rounded flex items-center justify-between">
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
