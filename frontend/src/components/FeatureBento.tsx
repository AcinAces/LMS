'use client';

import React from 'react';
import Link from 'next/link';

export default function FeatureBento() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-slate-950/80 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '2.5s' }} />

      <div className="max-w-7xl mx-auto relative z-10 space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Built for Modern Developers & Students
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Everything you need to master data structures, build production applications, take anti-cheat examinations, and get direct author guidance.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Anti-Cheat & Proctoring Engine (Span 2 on desktop) */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-emerald-500/40 transition-all duration-500 group shadow-xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                  🛡️
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Proctoring V2
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                  AI Proctoring & Anti-Cheat Quizzes
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed max-w-xl">
                  Real-time exam security with automated fullscreen tracking, tab switch monitors, minimize penalty calculations, and instant auto-submit on strike threshold.
                </p>
              </div>

              {/* Interactive Visual Element */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Proctor Status: SECURE
                  </span>
                  <span className="text-emerald-400 font-bold">0 / 3 Strikes</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-full rounded-full transition-all" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 text-center pt-1">
                  <div className="bg-white/5 py-1.5 rounded-lg border border-white/5">Fullscreen: Locked</div>
                  <div className="bg-white/5 py-1.5 rounded-lg border border-white/5">Tab Focus: Active</div>
                  <div className="bg-white/5 py-1.5 rounded-lg border border-white/5">Timer Sync: Live</div>
                </div>
              </div>
            </div>

            <div className="pt-6 relative z-10 flex items-center justify-between text-xs text-emerald-400 font-bold">
              <span>Explore Exam Curriculum</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>

          {/* Card 2: Interactive Web Monaco IDE */}
          <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-cyan-500/40 transition-all duration-500 group shadow-xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-2xl text-cyan-400 shadow-inner group-hover:scale-110 transition-transform">
                  💻
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Monaco Engine
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                  In-Browser Code IDE
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                  Write, debug, and test code in C++, Python, JavaScript, and Java with Monaco editor and instant server runtime output.
                </p>
              </div>

              {/* IDE Visual Mock */}
              <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-3 font-mono text-[11px] text-slate-300 space-y-1.5 shadow-inner">
                <div className="text-slate-500">// main.py</div>
                <div><span className="text-purple-400">def</span> <span className="text-amber-300">solve</span>():</div>
                <div className="pl-3 text-emerald-400">return &quot;Accepted!&quot;</div>
              </div>
            </div>

            <Link href="/ide" className="pt-6 relative z-10 flex items-center justify-between text-xs text-cyan-400 font-bold group-hover:underline">
              <span>Open Code Playground</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          {/* Card 3: 1-to-1 Instructor Mentorship */}
          <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-purple-500/40 transition-all duration-500 group shadow-xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl text-purple-400 shadow-inner group-hover:scale-110 transition-transform">
                  💬
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Direct Threads
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-purple-300 transition-colors">
                  1-to-1 Author Queries
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                  Ask questions directly inside each lesson with private, isolated messaging threads strictly connecting you and the course author.
                </p>
              </div>

              {/* Chat bubble mock */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3 space-y-2 text-xs">
                <div className="bg-emerald-500/15 text-emerald-300 p-2 rounded-xl text-[11px] rounded-br-none ml-auto max-w-[85%]">
                  How does the Dijkstra priority queue handle visited nodes?
                </div>
                <div className="bg-white/5 text-slate-300 p-2 rounded-xl text-[11px] rounded-bl-none mr-auto max-w-[85%]">
                  It uses lazy deletion by checking if dist &gt; minDistance!
                </div>
              </div>
            </div>

            <div className="pt-6 relative z-10 flex items-center justify-between text-xs text-purple-400 font-bold">
              <span>Interactive Lesson Chats</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>

          {/* Card 4: Detailed Progress & Analytics Dashboard (Span 2 on desktop) */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-emerald-500/40 transition-all duration-500 group shadow-xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-2xl text-teal-400 shadow-inner group-hover:scale-110 transition-transform">
                  📊
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Granular KPIs
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-teal-300 transition-colors">
                  Live Learning Progress & Completion Metrics
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed max-w-xl">
                  Granular curriculum watch times, module completion badges, quiz attempt breakdowns, and progress tracking for students and instructors.
                </p>
              </div>

              {/* Progress metrics mock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-950/80 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-emerald-400 font-extrabold text-lg">94%</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Completion</div>
                </div>
                <div className="bg-slate-950/80 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-cyan-400 font-extrabold text-lg">18 / 20</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Lessons</div>
                </div>
                <div className="bg-slate-950/80 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-purple-400 font-extrabold text-lg">92.5%</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Avg Score</div>
                </div>
                <div className="bg-slate-950/80 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-amber-400 font-extrabold text-lg">Active</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Streak</div>
                </div>
              </div>
            </div>

            <Link href="/courses" className="pt-6 relative z-10 flex items-center justify-between text-xs text-teal-400 font-bold group-hover:underline">
              <span>Start Tracking Progress</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
