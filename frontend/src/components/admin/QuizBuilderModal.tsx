'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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

  // Step 1 Data
  const [quizLength, setQuizLength] = useState(5);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [timeLimit, setTimeLimit] = useState(15);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');

  // Step 2 Data
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
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
          // if course was passed in initialData from the table:
          setSelectedCourse(initialData.course?.documentId || quiz.course?.documentId || '');
          
          if (quiz.questions && quiz.questions.length > 0) {
            setQuizLength(quiz.questions.length);
            const mappedQs = quiz.questions.map((q: any) => ({
              documentId: q.documentId,
              questionText: q.questionText,
              options: q.options?.length === 4 ? q.options.map((o: any) => ({
                documentId: o.documentId,
                optionText: o.optionText,
                isCorrect: o.isCorrect
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

  const handleNext = () => {
    if (!selectedCourse || !quizTitle) {
      alert("Please fill in course and title.");
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
    // Validate
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText || questions[i].questionText.trim() === '') {
        alert('Question ' + (i + 1) + ' is empty.');
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!questions[i].options[j].optionText || questions[i].options[j].optionText.trim() === '') {
          alert('Option ' + (j + 1) + ' in Question ' + (i + 1) + ' is empty.');
          return;
        }
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
            quizTitle,
            quizDescription,
            timeLimit,
            course: selectedCourse
          }
        })
      });
      if (!quizRes.ok) throw new Error("Failed to save quiz");
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
              questionText: q.questionText,
              quiz: quizId
            }
          })
        });
        if (!qRes.ok) throw new Error("Failed to save question");
        const qResData = await qRes.json();
        const questionId = q.documentId ? q.documentId : qResData.data.documentId;

        await Promise.all(q.options.map((o: any) => {
          const oMethod = o.documentId ? 'PUT' : 'POST';
          const oUrl = o.documentId 
            ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/mcq-options/` + o.documentId
            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/mcq-options`;

          return fetch(oUrl, {
            method: oMethod,
            headers,
            body: JSON.stringify({
              data: {
                optionText: o.optionText,
                isCorrect: o.isCorrect,
                question: questionId
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

      alert(isEditing ? 'Quiz updated successfully!' : 'Quiz published successfully!');
      window.location.reload();
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Error saving quiz. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] shadow-2xl relative flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gray-900 rounded-t-xl flex-shrink-0">
          <h2 className="text-xl font-bold text-white">
            {step === 1 ? (initialData?.documentId ? 'Step 1: Edit Quiz Settings' : 'Step 1: Quiz Settings') : 'Step 2: Quiz Questions'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {fetching ? (
            <div className="flex justify-center items-center py-20">
              <span className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></span>
            </div>
          ) : step === 1 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Quiz Length (Questions)</label>
                  <select 
                    value={quizLength} 
                    onChange={e => setQuizLength(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Target Course</label>
                  <select 
                    value={selectedCourse} 
                    onChange={e => setSelectedCourse(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Select a course...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.documentId}>{c.courseTitle}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Time Limit (Minutes)</label>
                <input 
                  type="number" 
                  value={timeLimit} 
                  onChange={e => setTimeLimit(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Quiz Title</label>
                <input 
                  type="text" 
                  value={quizTitle} 
                  onChange={e => setQuizTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g. Midterm Assessment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Quiz Description</label>
                <textarea 
                  value={quizDescription} 
                  onChange={e => setQuizDescription(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white h-24"
                  placeholder="Brief instructions for students..."
                />
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleNext}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Next: Edit Questions
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-black/30 p-6 rounded-lg border border-white/5">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-emerald-400 mb-2">Question {qIndex + 1}</label>
                    <textarea 
                      value={q.questionText}
                      onChange={e => handleQuestionChange(qIndex, e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white h-20"
                      placeholder="Enter question text..."
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-400">Options (Select the correct one)</label>
                    {q.options.map((opt: any, oIndex: number) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name={'correct-' + qIndex}
                          checked={opt.isCorrect}
                          onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                          className="w-5 h-5 text-emerald-500 bg-black/50 border-white/10 focus:ring-emerald-500 cursor-pointer"
                        />
                        <input 
                          type="text"
                          value={opt.optionText}
                          onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                          placeholder={'Option ' + (oIndex + 1)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-4 border-t border-white/10">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold"
                  disabled={loading}
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : null}
                  {initialData?.documentId ? 'Update Quiz' : 'Publish Quiz'}
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
