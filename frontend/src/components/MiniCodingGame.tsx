'use client';

import React, { useState, useEffect } from 'react';

interface Question {
  id: number;
  language: string;
  langColor: string;
  code: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    language: 'JavaScript',
    langColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    code: `console.log(typeof NaN);`,
    options: ['"number"', '"NaN"', '"undefined"', '"object"'],
    correctIndex: 0,
    explanation: 'In JavaScript, NaN (Not-a-Number) is technically a numeric data type!'
  },
  {
    id: 2,
    language: 'Python',
    langColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    code: `nums = [1, 2, 3]\nprint(nums * 2)`,
    options: ['[2, 4, 6]', '[1, 2, 3, 1, 2, 3]', '[1, 2, 3, 2]', 'TypeError'],
    correctIndex: 1,
    explanation: 'Multiplying a Python list by an integer repeats the sequence.'
  },
  {
    id: 3,
    language: 'C++',
    langColor: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    code: `int a = 7;\nint b = 2;\nstd::cout << a / b;`,
    options: ['3.5', '3', '4', '3.0'],
    correctIndex: 1,
    explanation: 'Integer division in C++ truncates the fractional part towards zero.'
  },
  {
    id: 4,
    language: 'Algorithms',
    langColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    code: `// Time complexity of Binary Search on sorted array:\n// Best case: O(1)\n// Worst case: ?`,
    options: ['O(log N)', 'O(N)', 'O(N log N)', 'O(1)'],
    correctIndex: 0,
    explanation: 'Binary Search halves the search space in each step, taking O(log N) time.'
  },
  {
    id: 5,
    language: 'Python',
    langColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    code: `x = [1, 2, 3]\ny = x\ny.append(4)\nprint(len(x))`,
    options: ['3', '4', '1', 'None'],
    correctIndex: 1,
    explanation: 'Lists are reference types in Python, so modifying y modifies x.'
  },
  {
    id: 6,
    language: 'JavaScript',
    langColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    code: `const a = [1, 2] + [3, 4];\nconsole.log(typeof a);`,
    options: ['"object"', '"string"', '"array"', '"NaN"'],
    correctIndex: 1,
    explanation: 'The + operator converts both arrays to strings and concatenates them ("1,23,4").'
  }
];

export default function MiniCodingGame() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answered, setAnswered] = useState(false);

  const q = QUESTIONS[currentIdx];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOpt(idx);
    setAnswered(true);

    if (idx === q.correctIndex) {
      setScore(s => s + 10);
      setStreak(st => {
        const newSt = st + 1;
        if (newSt > bestStreak) setBestStreak(newSt);
        return newSt;
      });
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setAnswered(false);
    setCurrentIdx((currentIdx + 1) % QUESTIONS.length);
  };

  const getRank = (sc: number) => {
    if (sc >= 50) return { title: '🧙 10x Architect', color: 'text-amber-400' };
    if (sc >= 30) return { title: '🚀 Senior Dev', color: 'text-purple-400' };
    if (sc >= 10) return { title: '⚡ Junior Coder', color: 'text-emerald-400' };
    return { title: '🌱 Rookie Dev', color: 'text-slate-400' };
  };

  const rank = getRank(score);

  return (
    <div className="relative w-full max-w-2xl mx-auto mt-10 mb-4">
      {/* Ambient Glow */}
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />

      {/* Main Game Container */}
      <div className="relative z-10 bg-slate-950/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 hover:border-emerald-500/40 transition-all text-left">
        
        {/* Game Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎮</span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Quick Dev Quiz
              </h3>
              <p className="text-[11px] text-slate-400">Guess the output / solve the snippet</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono">
              <span>🔥</span>
              <span className="font-bold text-amber-400">{streak}</span>
              <span className="text-slate-500 text-[10px]">streak</span>
            </div>

            {/* Score Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-400">
              <span>{score} pts</span>
            </div>

            {/* Rank */}
            <div className={`hidden sm:block text-xs font-bold font-mono ${rank.color}`}>
              {rank.title}
            </div>
          </div>
        </div>

        {/* Question Header & Language Pill */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className={`px-2.5 py-0.5 rounded-md font-mono font-bold border ${q.langColor}`}>
              {q.language}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              Question {currentIdx + 1} of {QUESTIONS.length}
            </span>
          </div>

          {/* Code Snippet Box */}
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 sm:p-5 font-mono text-xs sm:text-sm text-slate-200 shadow-inner overflow-x-auto">
            <pre className="leading-relaxed">
              <code>{q.code}</code>
            </pre>
          </div>
        </div>

        {/* 4 Interactive Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q.options.map((opt, idx) => {
            const isSelected = selectedOpt === idx;
            const isCorrect = idx === q.correctIndex;

            let btnStyle = 'bg-slate-900/80 border-white/10 text-slate-200 hover:bg-slate-800 hover:border-emerald-500/30';
            
            if (answered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/20';
              } else if (isSelected) {
                btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold';
              } else {
                btnStyle = 'bg-slate-900/40 border-white/5 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={answered}
                className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm font-mono text-left transition-all flex items-center justify-between gap-2 cursor-pointer disabled:cursor-default ${btnStyle}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-black/40 flex items-center justify-center text-[11px] font-bold text-slate-400 border border-white/5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </div>

                {answered && isCorrect && (
                  <span className="text-emerald-400 font-bold text-sm">✔</span>
                )}
                {answered && isSelected && !isCorrect && (
                  <span className="text-rose-400 font-bold text-sm">✖</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback & Next Question Bar */}
        {answered && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in-up">
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className={selectedOpt === q.correctIndex ? 'text-emerald-400' : 'text-rose-400'}>
                {selectedOpt === q.correctIndex ? 'Correct! ' : 'Incorrect. '}
              </strong>
              {q.explanation}
            </p>

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <span>Next Question</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
