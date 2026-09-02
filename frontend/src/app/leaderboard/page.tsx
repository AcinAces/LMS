'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useToast } from '@/context/ToastContext';

interface StudentLeaderboardItem {
  id: number;
  documentId: string;
  username: string;
  avatar: string | null;
  createdAt: string;
  rank: number;
  leaderboardPoints: number;
  metrics: {
    quizPoints: number;
    coursePoints: number;
    violationPenalty: number;
    retakePenalty: number;
  };
  quizPerformance: {
    totalMarks: number;
    highestScore: number;
    quizzesPassed: number;
    averagePercentage: number;
    totalQuizzesAttempted: number;
    uniqueQuizzesCount: number;
  };
  courseCompletion: {
    totalEnrolled: number;
    fullyCompletedCourses: number;
    totalLessonsCompleted: number;
  };
  violations: {
    totalViolationScore: number;
    totalViolationsCount: number;
  };
  retakes: {
    totalRetakesCount: number;
  };
}

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [loading, setLoading] = useState(true);
  const [top20, setTop20] = useState<StudentLeaderboardItem[]>([]);
  const [myRank, setMyRank] = useState<StudentLeaderboardItem | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'quiz' | 'course' | 'clean'>('all');
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const jwt = localStorage.getItem('jwt');
      const headers: any = {};
      if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/leaderboard`, {
        headers,
        cache: 'no-store'
      });

      if (res.ok) {
        const json = await res.json();
        setTop20(json.data?.top20 || []);
        setMyRank(json.data?.myRank || null);
        setTotalParticipants(json.data?.totalParticipants || 0);
      } else {
        toast.error('Failed to load leaderboard data');
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      toast.error('Error connecting to leaderboard service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Filter and search
  const filteredStudents = useMemo(() => {
    let result = [...top20];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => s.username?.toLowerCase().includes(q));
    }

    if (activeFilter === 'quiz') {
      result.sort((a, b) => b.quizPerformance.totalMarks - a.quizPerformance.totalMarks);
    } else if (activeFilter === 'course') {
      result.sort((a, b) => b.courseCompletion.fullyCompletedCourses - a.courseCompletion.fullyCompletedCourses || b.courseCompletion.totalLessonsCompleted - a.courseCompletion.totalLessonsCompleted);
    } else if (activeFilter === 'clean') {
      result = result.filter(s => s.violations.totalViolationScore === 0);
    }

    return result;
  }, [top20, searchQuery, activeFilter]);

  const top1 = top20[0] || null;
  const top2 = top20[1] || null;
  const top3 = top20[2] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <AnimatedBackground />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* ---------------------------------------------------- */}
        {/* HERO BANNER */}
        {/* ---------------------------------------------------- */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                {t('leaderboard.title')}
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {t('leaderboard.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFormulaModal(true)}
                className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs sm:text-sm font-bold border border-white/10 transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>ℹ️</span>
                <span>{t('leaderboard.scoring_formula_title')}</span>
              </button>

              <button
                type="button"
                onClick={fetchLeaderboard}
                disabled={loading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>🔄</span>
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Current Student's Rank Alert if Available */}
          {myRank && (
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-950/30 p-4 rounded-2xl border border-emerald-500/20">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-black text-lg">
                  #{myRank.rank}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {t('leaderboard.my_ranking')}: <span className="text-emerald-400">{myRank.username}</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Rank #{myRank.rank} of {totalParticipants}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {myRank.quizPerformance.quizzesPassed} Quizzes Passed • {myRank.courseCompletion.fullyCompletedCourses} Courses Finished • {myRank.violations.totalViolationScore} Penalty Pts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-auto sm:ml-0">
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">{myRank.leaderboardPoints} pts</div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">{t('leaderboard.points')}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* TOP 3 PODIUM HERO */}
        {/* ---------------------------------------------------- */}
        {!loading && top20.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-end pt-4 pb-2">
            
            {/* Rank 2 - Silver */}
            {top2 && (
              <div className="order-2 md:order-1 bg-slate-900/80 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-xl shadow-xl relative overflow-hidden flex flex-col items-center text-center transform md:translate-y-2 hover:-translate-y-1 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-400/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-black text-sm mb-3 border border-slate-500 shadow-md">
                  2
                </div>

                <div className="relative mb-3">
                  {top2.avatar ? (
                    <img src={top2.avatar} alt={top2.username} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-400 shadow-lg" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-400 text-slate-200 font-bold flex items-center justify-center text-xl shadow-lg">
                      {top2.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-2 -right-1 text-lg">🥈</span>
                </div>

                <h3 className="text-base font-bold text-white truncate max-w-[200px] mb-1">{top2.username}</h3>
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-3">{t('leaderboard.podium_second')}</span>

                <div className="text-2xl font-black text-slate-200 mb-4">{top2.leaderboardPoints} pts</div>

                <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-400">
                  <div className="bg-slate-950/60 p-2 rounded-xl">
                    <div className="text-white font-bold">{top2.quizPerformance.totalMarks}</div>
                    <div className="text-[9px] uppercase">Marks</div>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl">
                    <div className="text-white font-bold">{top2.courseCompletion.fullyCompletedCourses}</div>
                    <div className="text-[9px] uppercase">Courses</div>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 1 - Champion Gold */}
            {top1 && (
              <div className="order-1 md:order-2 bg-gradient-to-b from-emerald-950/50 via-slate-900/90 to-slate-900/90 border-2 border-emerald-500/50 rounded-3xl p-7 backdrop-blur-2xl shadow-2xl relative overflow-hidden flex flex-col items-center text-center transform md:-translate-y-4 hover:-translate-y-6 transition-all ring-1 ring-emerald-500/30">
                <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 flex items-center justify-center font-black text-lg mb-3 shadow-lg shadow-emerald-500/30 border border-white/20">
                  👑
                </div>

                <div className="relative mb-3">
                  {top1.avatar ? (
                    <img src={top1.avatar} alt={top1.username} className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-xl shadow-emerald-500/20" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-emerald-400 text-slate-950 font-black flex items-center justify-center text-2xl shadow-xl shadow-emerald-500/20">
                      {top1.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-2 -right-1 text-2xl">🥇</span>
                </div>

                <h3 className="text-lg font-extrabold text-white truncate max-w-[220px] mb-1">{top1.username}</h3>
                <span className="text-xs font-mono uppercase font-bold text-emerald-400 mb-3">{t('leaderboard.podium_first')}</span>

                <div className="text-3xl font-black text-emerald-400 mb-4">{top1.leaderboardPoints} pts</div>

                <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-emerald-500/20 text-[11px] font-mono text-slate-300">
                  <div className="bg-slate-950/80 p-2 rounded-xl border border-emerald-500/20">
                    <div className="text-emerald-400 font-bold">{top1.quizPerformance.totalMarks}</div>
                    <div className="text-[9px] uppercase text-slate-400">Marks</div>
                  </div>
                  <div className="bg-slate-950/80 p-2 rounded-xl border border-emerald-500/20">
                    <div className="text-cyan-400 font-bold">{top1.courseCompletion.fullyCompletedCourses}</div>
                    <div className="text-[9px] uppercase text-slate-400">Courses</div>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 3 - Bronze */}
            {top3 && (
              <div className="order-3 bg-slate-900/80 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-xl shadow-xl relative overflow-hidden flex flex-col items-center text-center transform md:translate-y-2 hover:-translate-y-1 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="w-8 h-8 rounded-full bg-amber-950/80 text-amber-300 flex items-center justify-center font-black text-sm mb-3 border border-amber-500/40 shadow-md">
                  3
                </div>

                <div className="relative mb-3">
                  {top3.avatar ? (
                    <img src={top3.avatar} alt={top3.username} className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-lg" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-amber-400 text-amber-300 font-bold flex items-center justify-center text-xl shadow-lg">
                      {top3.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-2 -right-1 text-lg">🥉</span>
                </div>

                <h3 className="text-base font-bold text-white truncate max-w-[200px] mb-1">{top3.username}</h3>
                <span className="text-[10px] font-mono uppercase font-bold text-amber-400 mb-3">{t('leaderboard.podium_third')}</span>

                <div className="text-2xl font-black text-amber-300 mb-4">{top3.leaderboardPoints} pts</div>

                <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-400">
                  <div className="bg-slate-950/60 p-2 rounded-xl">
                    <div className="text-white font-bold">{top3.quizPerformance.totalMarks}</div>
                    <div className="text-[9px] uppercase">Marks</div>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl">
                    <div className="text-white font-bold">{top3.courseCompletion.fullyCompletedCourses}</div>
                    <div className="text-[9px] uppercase">Courses</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* SEARCH & FILTER CONTROLS */}
        {/* ---------------------------------------------------- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('leaderboard.search_placeholder')}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-white/5 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'all' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('leaderboard.all_round_rank')}
            </button>
            <button
              onClick={() => setActiveFilter('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'quiz' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              {t('leaderboard.quiz_masters')}
            </button>
            <button
              onClick={() => setActiveFilter('course')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'course' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              {t('leaderboard.course_finishers')}
            </button>
            <button
              onClick={() => setActiveFilter('clean')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'clean' ? 'bg-amber-500/20 text-amber-300 shadow-sm' : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              {t('leaderboard.zero_violations')}
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TOP 20 LEADERBOARD TABLE */}
        {/* ---------------------------------------------------- */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl backdrop-blur-xl shadow-xl overflow-hidden">
          
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <p className="text-xs font-mono text-slate-400">{t('leaderboard.loading_leaderboard')}</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="text-4xl">🔍</div>
              <h3 className="text-base font-bold text-white">{t('leaderboard.no_students')}</h3>
              <p className="text-xs text-slate-400">{t('leaderboard.adjust_search')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                
                {/* Table Header */}
                <thead className="bg-slate-950/60 border-b border-white/10 text-[10px] font-mono uppercase text-slate-400">
                  <tr>
                    <th className="py-4 px-4 sm:px-6 w-16 text-center">{t('leaderboard.rank')}</th>
                    <th className="py-4 px-4 sm:px-6">{t('leaderboard.student')}</th>
                    <th className="py-4 px-4 sm:px-6 text-center">{t('leaderboard.points')}</th>
                    <th className="py-4 px-4 sm:px-6 text-center">{t('leaderboard.quiz_performance')}</th>
                    <th className="py-4 px-4 sm:px-6 text-center">{t('leaderboard.course_completion')}</th>
                    <th className="py-4 px-4 sm:px-6 text-center">{t('leaderboard.violations')}</th>
                    <th className="py-4 px-4 sm:px-6 text-center">{t('leaderboard.retakes')}</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-white/5 font-medium">
                  {filteredStudents.map((student, idx) => {
                    const isCurrentUser = myRank?.id === student.id;
                    const rank = student.rank;

                    let rankBadge = (
                      <span className="w-7 h-7 rounded-xl bg-slate-950 text-slate-400 border border-white/5 flex items-center justify-center font-mono font-bold text-xs mx-auto">
                        {rank}
                      </span>
                    );

                    if (rank === 1) {
                      rankBadge = (
                        <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 flex items-center justify-center font-bold text-sm mx-auto shadow-md shadow-emerald-500/30">
                          🥇
                        </span>
                      );
                    } else if (rank === 2) {
                      rankBadge = (
                        <span className="w-8 h-8 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm mx-auto border border-slate-500">
                          🥈
                        </span>
                      );
                    } else if (rank === 3) {
                      rankBadge = (
                        <span className="w-8 h-8 rounded-xl bg-amber-950/90 text-amber-300 flex items-center justify-center font-bold text-sm mx-auto border border-amber-500/40">
                          🥉
                        </span>
                      );
                    }

                    return (
                      <tr 
                        key={student.id} 
                        className={`transition-colors ${
                          isCurrentUser 
                            ? 'bg-emerald-950/30 hover:bg-emerald-950/40 ring-1 ring-emerald-500/30' 
                            : 'hover:bg-white/5'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          {rankBadge}
                        </td>

                        {/* Student Info */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            {student.avatar ? (
                              <img src={student.avatar} alt={student.username} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 text-emerald-400 font-bold flex items-center justify-center text-sm shrink-0">
                                {student.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{student.username}</span>
                                {isCurrentUser && (
                                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    {t('leaderboard.you')}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                Joined {new Date(student.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Leaderboard Points */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-base sm:text-lg font-black text-emerald-400">
                              {student.leaderboardPoints}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 uppercase">{t('leaderboard.pts')}</span>
                          </div>
                        </td>

                        {/* Quiz Performance */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-white">
                              {student.quizPerformance.totalMarks} {t('leaderboard.marks')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {student.quizPerformance.quizzesPassed} {t('leaderboard.passed')} ({student.quizPerformance.averagePercentage}%)
                            </span>
                          </div>
                        </td>

                        {/* Course Completion */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-cyan-300">
                              {student.courseCompletion.fullyCompletedCourses} {t('leaderboard.courses')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {student.courseCompletion.totalLessonsCompleted} {t('leaderboard.lessons')}
                            </span>
                          </div>
                        </td>

                        {/* Violations */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          {student.violations.totalViolationScore === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {t('leaderboard.clean_shield')}
                            </span>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="text-xs font-mono font-bold text-rose-400">
                                -{student.violations.totalViolationScore} pts
                              </span>
                              <span className="text-[10px] font-mono text-rose-300/70">
                                {student.violations.totalViolationsCount} {t('leaderboard.strikes')}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Retakes */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <span className={`text-xs font-mono font-bold ${
                            student.retakes.totalRetakesCount === 0 ? 'text-emerald-400' : 'text-slate-400'
                          }`}>
                            {student.retakes.totalRetakesCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* ---------------------------------------------------- */}
        {/* SCORING FORMULA MODAL */}
        {/* ---------------------------------------------------- */}
        {showFormulaModal && mounted && createPortal(
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
            onClick={() => setShowFormulaModal(false)}
          >
            <div 
              className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-2xl my-auto animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center text-xl shrink-0">
                    📊
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('leaderboard.scoring_formula_title')}</h3>
                    <p className="text-xs text-slate-400">How leaderboard points are computed across 4 pillars.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFormulaModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer shrink-0 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 relative z-10 text-xs sm:text-sm">
                <div className="p-3.5 bg-slate-950/80 border border-emerald-500/20 rounded-2xl space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>📝</span>
                    <span>Quiz Performance</span>
                  </div>
                  <p className="text-slate-300 text-xs">{t('leaderboard.formula_quiz')}</p>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-cyan-500/20 rounded-2xl space-y-1">
                  <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <span>🎓</span>
                    <span>Course Completion</span>
                  </div>
                  <p className="text-slate-300 text-xs">{t('leaderboard.formula_course')}</p>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-rose-500/20 rounded-2xl space-y-1">
                  <div className="font-bold text-rose-400 flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>Proctoring Violations</span>
                  </div>
                  <p className="text-slate-300 text-xs">{t('leaderboard.formula_violations')}</p>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-amber-500/20 rounded-2xl space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span>🔄</span>
                    <span>Retakes Factor</span>
                  </div>
                  <p className="text-slate-300 text-xs">{t('leaderboard.formula_retakes')}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 text-right relative z-10">
                <button
                  type="button"
                  onClick={() => setShowFormulaModal(false)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-emerald-500/20"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      </div>
    </div>
  );
}
