'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/context/ToastContext';

interface QuizBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courses: any[];
  initialData?: any;
}

export default function QuizBuilderModal({ isOpen, onClose, onSuccess, courses, initialData }: QuizBuilderModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  const [fetching, setFetching] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Step 1 Data
  const [quizLength, setQuizLength] = useState(5);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [timeLimit, setTimeLimit] = useState<number | string>(15);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');

  // Step 2 Data
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setValidationError('');
      if (initialData?.documentId) {
        setFetching(true);
        const jwt = localStorage.getItem('jwt');
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quizzes/` + initialData.documentId + '?populate[questions][populate][0]=options', {
          headers: { 'Authorization': 'Bearer ' + jwt }
        })
        .then(res => res.json())
        .then(data => {
          const quiz = data.data;
          setQuizTitle(quiz.quizTitle || '');
          setQuizDescription(quiz.quizDescription || '');
          setTimeLimit(quiz.timeLimit || 15);
          setSelectedCourse(initialData.course?.documentId || quiz.course?.documentId || '');
          
          if (quiz.questions && quiz.questions.length > 0) {
            setQuizLength(quiz.questions.length);
            const mappedQs = quiz.questions.map((q: any) => ({
              documentId: q.documentId,
              questionText: q.questionText,
              options: q.options?.length === 4 ? q.options.map((o: any) => ({
                documentId: o.documentId,
                optionText: o.optionText,
                isCorrect: !!o.isCorrect
              })) : [
                { optionText: '', isCorrect: true },
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false }
              ]
            }));
            setQuestions(mappedQs);
          } else {
            setQuizLength(5);
            setQuestions(Array.from({ length: 5 }).map(() => ({
              questionText: '',
              options: [
                { optionText: '', isCorrect: true },
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false }
              ]
            })));
          }
        })
        .catch(err => {
          console.error(err);
          setValidationError('Failed to load quiz details.');
        })
        .finally(() => setFetching(false));
      } else {
        setQuizTitle('');
        setQuizDescription('');
        setTimeLimit(15);
        setSelectedCourse('');
        setQuizLength(5);
        setQuestions(Array.from({ length: 5 }).map(() => ({
          questionText: '',
          options: [
            { optionText: '', isCorrect: true },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false }
          ]
        })));
      }
    }
  }, [initialData, isOpen]);

  const toast = useToast();

  const handleNext = () => {
    setValidationError('');
    if (!selectedCourse) {
      const msg = "Target Course is required.";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }
    if (!quizTitle.trim() || quizTitle.trim().length < 3) {
      const msg = "Quiz Title must be at least 3 characters long.";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }
    const parsedTime = Number(timeLimit);
    if (!timeLimit || isNaN(parsedTime) || parsedTime <= 0 || !Number.isInteger(parsedTime)) {
      const msg = "Time Limit must be a positive integer greater than 0 (e.g. 15).";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }
    if (parsedTime > 300) {
      const msg = "Time Limit cannot exceed 300 minutes.";
      setValidationError(msg);
      toast.warning(msg);
      return;
    }
    
    let updatedQs = [...questions];
    if (quizLength > updatedQs.length) {
      const diff = quizLength - updatedQs.length;
      const newQs = Array.from({ length: diff }).map(() => ({
        questionText: '',
        options: [
          { optionText: '', isCorrect: true },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }
        ]
      }));
      updatedQs = [...updatedQs, ...newQs];
    } else if (quizLength < updatedQs.length) {
      updatedQs = updatedQs.slice(0, quizLength);
    }
    setQuestions(updatedQs);
    setStep(2);
  };

  const handleQuestionChange = (qIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].questionText = text;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex].optionText = text;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qIndex: number, correctOIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.forEach((opt: any, i: number) => {
      opt.isCorrect = (i === correctOIndex);
    });
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    setValidationError('');
    // Strict Validation
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText || questions[i].questionText.trim().length < 3) {
        const msg = `Question ${i + 1} prompt is too short (min 3 characters).`;
        setValidationError(msg);
        toast.warning(msg);
        return;
      }
      let hasCorrect = false;
      for (let j = 0; j < 4; j++) {
        if (!questions[i].options[j].optionText || questions[i].options[j].optionText.trim() === '') {
          const msg = `Option ${j + 1} in Question ${i + 1} cannot be empty.`;
          setValidationError(msg);
          toast.warning(msg);
          return;
        }
        if (questions[i].options[j].isCorrect) {
          hasCorrect = true;
        }
      }
      if (!hasCorrect) {
        const msg = `Please select which option is correct for Question ${i + 1}.`;
        setValidationError(msg);
        toast.warning(msg);
        return;
      }
    }

    setLoading(true);
    try {
      const jwt = localStorage.getItem('jwt');
      const headers = { 
        'Authorization': 'Bearer ' + jwt,
        'Content-Type': 'application/json'
      };

      const isEditing = !!initialData?.documentId;
      const quizMethod = isEditing ? 'PUT' : 'POST';
      const quizUrl = isEditing 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quizzes/` + initialData.documentId
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quizzes`;

      // 1. Create/Update Quiz
      const quizRes = await fetch(quizUrl, {
        method: quizMethod,
        headers,
        body: JSON.stringify({
          data: {
            quizTitle: quizTitle.trim(),
            quizDescription: quizDescription.trim(),
            timeLimit: Number(timeLimit),
            ...(selectedCourse ? { course: { connect: [selectedCourse] } } : {})
          }
        })
      });
      if (!quizRes.ok) {
        const errData = await quizRes.json();
        throw new Error(errData.error?.message || "Failed to save quiz");
      }
      const quizData = await quizRes.json();
      const quizId = isEditing ? initialData.documentId : quizData.data.documentId;

      // 2. Create/Update Questions & Options
      await Promise.all(questions.map(async (q) => {
        const qMethod = q.documentId ? 'PUT' : 'POST';
        const qUrl = q.documentId 
          ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quiz-questions/` + q.documentId
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quiz-questions`;

        const qRes = await fetch(qUrl, {
          method: qMethod,
          headers,
          body: JSON.stringify({
            data: {
              questionText: q.questionText.trim(),
              quiz: { connect: [quizId] }
            }
          })
        });
        if (!qRes.ok) {
          const errData = await qRes.json();
          throw new Error(errData.error?.message || "Failed to save question");
        }
        const qResData = await qRes.json();
        const questionId = q.documentId ? q.documentId : qResData.data.documentId;

        await Promise.all(q.options.map((o: any) => {
          const oMethod = o.documentId ? 'PUT' : 'POST';
          const oUrl = o.documentId 
            ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quiz-answers/` + o.documentId
            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quiz-answers`;

          return fetch(oUrl, {
            method: oMethod,
            headers,
            body: JSON.stringify({
              data: {
                answerText: o.optionText.trim(),
                isCorrect: !!o.isCorrect,
                question: { connect: [questionId] }
              }
            })
          });
        }));
      }));

      if (!isEditing) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quizzes/` + quizId + '/actions/publish', {
          method: 'POST',
          headers
        });
      }

      toast.success(isEditing ? 'Quiz updated successfully!' : 'Quiz published successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "Error saving quiz. Check console for details.";
      setValidationError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gray-900 rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">
              {step === 1 
                ? (initialData?.documentId ? 'Edit Quiz: Settings' : 'Create Quiz: Step 1 Settings') 
                : (initialData?.documentId ? 'Edit Quiz: Questions & Options' : 'Create Quiz: Step 2 Questions')}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 1 ? 'Configure time limits, target curriculum, and exam structure' : 'Author multiple choice questions and designate correct options'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {validationError && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          {fetching ? (
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <span className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></span>
              <p className="text-sm text-gray-400">Loading quiz questions and options...</p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">
                    Target Course <span className="text-red-400">*</span>
                  </label>
                  <select 
                    required
                    value={selectedCourse} 
                    onChange={e => setSelectedCourse(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none [&>option]:bg-gray-900"
                  >
                    <option value="">Select a course to evaluate...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.documentId}>{c.courseTitle}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <span>Select which course curriculum this quiz evaluates</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">
                    Quiz Length (Questions) <span className="text-red-400">*</span>
                  </label>
                  <select 
                    value={quizLength} 
                    onChange={e => setQuizLength(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none [&>option]:bg-gray-900"
                  >
                    <option value={5}>5 Multiple Choice Questions</option>
                    <option value={10}>10 Multiple Choice Questions</option>
                    <option value={15}>15 Multiple Choice Questions</option>
                    <option value={20}>20 Multiple Choice Questions</option>
                  </select>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <span>Total number of multiple-choice questions in this exam</span>
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-200">
                  Time Limit (Minutes) <span className="text-red-400">*</span>
                </label>
                <input 
                  type="number" 
                  min={1}
                  max={300}
                  step={1}
                  required
                  placeholder="e.g. 15"
                  value={timeLimit} 
                  onKeyDown={e => {
                    if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={e => setTimeLimit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span>Positive integer in minutes (1–300). Cannot be 0, negative, or decimal.</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-200">
                  Quiz Title <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  minLength={3}
                  maxLength={120}
                  value={quizTitle} 
                  onChange={e => setQuizTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Midterm Assessment: Graph Algorithms & Dynamic Programming"
                />
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span>Clear and concise quiz title (3–120 characters)</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-200">
                  Quiz Instructions / Description (Optional)
                </label>
                <textarea 
                  rows={3}
                  value={quizDescription} 
                  onChange={e => setQuizDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all min-h-[90px]"
                  placeholder="Instructions for students (e.g. 1 point per question, fullscreen proctoring enabled, no negative marking)..."
                />
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span>Optional exam guidelines and syllabus coverage shown to students before starting</span>
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10">
                <button 
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <span>Next: Author Questions</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-black/40 p-5 rounded-xl border border-white/10 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-bold text-emerald-400">
                        Question {qIndex + 1} of {questions.length} <span className="text-red-400">*</span>
                      </label>
                      <span className="text-xs text-gray-500 font-mono">Single Choice MCQ</span>
                    </div>
                    <textarea 
                      required
                      minLength={3}
                      value={q.questionText}
                      onChange={e => handleQuestionChange(qIndex, e.target.value)}
                      className="w-full px-3.5 py-2 bg-black/60 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all min-h-[70px]"
                      placeholder={`Enter the question prompt for question #${qIndex + 1}...`}
                    />
                    <p className="text-xs text-gray-400">Question prompt statement (min 3 characters)</p>
                  </div>
                  
                  <div className="space-y-2.5 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Answer Options (Select the correct radio button)
                      </label>
                      <span className="text-xs text-gray-400">4 options required</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt: any, oIndex: number) => (
                        <div 
                          key={oIndex} 
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            opt.isCorrect 
                              ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30' 
                              : 'bg-black/50 border-white/10'
                          }`}
                        >
                          <input 
                            type="radio" 
                            id={`q-${qIndex}-opt-${oIndex}`}
                            name={`correct-radio-${qIndex}`}
                            checked={!!opt.isCorrect}
                            onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                            className="w-4 h-4 text-emerald-500 bg-black/50 border-white/20 focus:ring-emerald-500 cursor-pointer"
                          />
                          <input 
                            type="text"
                            required
                            value={opt.optionText}
                            onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                            className="flex-1 bg-transparent border-none text-white placeholder-gray-500 text-sm outline-none"
                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          />
                          {opt.isCorrect && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0">
                              Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-4 border-t border-white/10 sticky bottom-0 bg-gray-900 py-2">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-sm transition-all"
                  disabled={loading}
                >
                  &larr; Back to Settings
                </button>
                <button 
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Saving Quiz...</span>
                    </>
                  ) : (
                    <span>{initialData?.documentId ? 'Save Changes' : 'Publish Quiz'}</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
