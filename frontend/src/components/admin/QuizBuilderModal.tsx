'use client';

import { useState } from 'react';

interface QuizBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courses: any[];
}

export default function QuizBuilderModal({ isOpen, onClose, onSuccess, courses }: QuizBuilderModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [quizLength, setQuizLength] = useState(5);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [timeLimit, setTimeLimit] = useState(15);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');

  const [questions, setQuestions] = useState<any[]>([]);

  const handleNext = () => {
    if (!selectedCourse || !quizTitle) {
      alert('Please fill in course and title.');
      return;
    }
    
    const initialQuestions = Array.from({ length: quizLength }).map(() => ({
      questionText: '',
      options: [
        { optionText: '', isCorrect: true },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false }
      ]
    }));
    setQuestions(initialQuestions);
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
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText) {
        alert(Question "$" + {i + 1} is empty.);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!questions[i].options[j].optionText) {
          alert(Option "$" + {j + 1} in Question "$" + {i + 1} is empty.);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const jwt = localStorage.getItem('jwt');
      const headers = { 
        'Authorization': "Bearer $" + {jwt},
        'Content-Type': 'application/json'
      };

      const quizRes = await fetch('http://localhost:1337/api/quizzes', {
        method: 'POST',
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
      if (!quizRes.ok) throw new Error('Failed to create quiz');
      const quizData = await quizRes.json();
      const quizId = quizData.data.documentId;

      for (const q of questions) {
        const qRes = await fetch('http://localhost:1337/api/quiz-questions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            data: {
              questionText: q.questionText,
              quiz: quizId
            }
          })
        });
        if (!qRes.ok) throw new Error('Failed to create question');
        const qData = await qRes.json();
        const questionId = qData.data.documentId;

        for (const o of q.options) {
          await fetch('http://localhost:1337/api/mcq-options', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              data: {
                optionText: o.optionText,
                isCorrect: o.isCorrect,
                question: questionId
              }
            })
          });
        }
      }

      setStep(1);
      setQuizTitle('');
      setQuizDescription('');
      setQuestions([]);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Error saving quiz. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-4xl shadow-2xl relative my-8">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gray-900 sticky top-0 z-10 rounded-t-xl">
          <h2 className="text-xl font-bold text-white">
            {step === 1 ? 'Step 1: Quiz Settings' : 'Step 2: Quiz Questions'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">&times;</button>
        </div>

        <div className="p-6">
          {step === 1 && (
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
                  Next: Add Questions
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
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
                          name={correct- + qIndex}
                          checked={opt.isCorrect}
                          onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                          className="w-5 h-5 text-emerald-500 bg-black/50 border-white/10 focus:ring-emerald-500 cursor-pointer"
                        />
                        <input 
                          type="text"
                          value={opt.optionText}
                          onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                          placeholder={Option  + (oIndex + 1)}
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
                  Publish Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
