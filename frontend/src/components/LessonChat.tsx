'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

interface LessonChatProps {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  lessonOrder: number;
  isAuthor: boolean;
}

interface Message {
  id: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: number; username: string; email: string; avatar?: string | null; role?: { type: string } };
  student?: { id: number; username: string; avatar?: string | null };
}

interface StudentThread {
  id: number;
  username: string;
  avatar?: string | null;
  hasUnread?: boolean;
}

export default function LessonChat({ lessonId, courseId, lessonTitle, lessonOrder, isAuthor }: LessonChatProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [students, setStudents] = useState<StudentThread[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const jwt = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = async (targetStudentId?: number | null) => {
    if (!jwt) return;
    try {
      const query = (isAuthor && targetStudentId) ? `?studentId=${targetStudentId}` : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-messages/chat/${lessonId}${query}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data || []);
        
        const unread = (json.data || []).filter((m: Message) => !m.isRead && m.sender?.id !== currentUser?.id).length;
        setUnreadCount(unread > 0 ? 1 : 0);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchStudents = async () => {
    if (!jwt || !isAuthor) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-messages/chat/${lessonId}/students`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (res.ok) {
        const json = await res.json();
        setStudents(json.data || []);
        if (!selectedStudentId) {
          const unreadStudents = (json.data || []).filter((s: StudentThread) => s.hasUnread).length;
          setUnreadCount(unreadStudents);
        }
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const markAsRead = async (targetStudentId?: number | null) => {
    if (!jwt) return;
    try {
      const body = (isAuthor && targetStudentId) ? JSON.stringify({ studentId: targetStudentId }) : '{}';
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-messages/chat/${lessonId}/read`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body
      });
      if (isAuthor) {
        fetchStudents();
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  useEffect(() => {
    if (isAuthor && !selectedStudentId) {
      fetchStudents();
    } else {
      fetchMessages(selectedStudentId);
    }

    pollIntervalRef.current = setInterval(() => {
      if (isAuthor && !selectedStudentId) {
        fetchStudents();
      } else {
        fetchMessages(selectedStudentId);
      }
    }, 8000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [lessonId, isAuthor, selectedStudentId]);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
      if (unreadCount > 0) {
        markAsRead(selectedStudentId);
      }
    }
  }, [isOpen, messages.length, unreadCount, selectedStudentId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !jwt || sending) return;
    
    const msgContent = newMessage;
    setNewMessage('');
    setSending(true);

    // Optimistic update
    setMessages(prev => [...prev, {
      id: Date.now(),
      content: msgContent,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: currentUser
    }]);
    
    try {
      const body = JSON.stringify({
        content: msgContent,
        ...(isAuthor && selectedStudentId ? { studentId: selectedStudentId } : {})
      });
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-messages/chat/${lessonId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body
      });
      
      if (res.ok) {
        fetchMessages(selectedStudentId);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
      fetchMessages(selectedStudentId);
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const filteredStudents = students.filter(s => 
    s.username.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const quickPrompts = [
    'Can you clarify this code step?',
    'I encountered an error with the compiler.',
    'Where can I find additional practice tasks?'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end animate-fade-in">
      {isOpen ? (
        <div 
          className="bg-slate-900/95 border border-white/15 shadow-2xl rounded-3xl w-[340px] sm:w-[420px] overflow-hidden flex flex-col backdrop-blur-2xl animate-fade-in-up relative" 
          style={{ height: '540px', maxHeight: '82vh' }}
        >
          {/* Top Gradient Accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          {/* Header */}
          <div className="bg-slate-950/80 px-5 py-4 border-b border-white/10 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm shadow-inner">
                {isAuthor ? '👨‍🏫' : '💬'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-sm tracking-wide">
                    {isAuthor && selectedStudent 
                      ? selectedStudent.username
                      : isAuthor 
                      ? 'Student Queries'
                      : 'Ask Course Author'}
                  </h3>
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-white/5 text-slate-400 border border-white/10">
                    Lesson {lessonOrder}
                  </span>
                </div>
                
                {isAuthor && selectedStudent ? (
                  <button 
                    onClick={() => setSelectedStudentId(null)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 mt-0.5 cursor-pointer"
                  >
                    ← {t('chat.back_to_students')}
                  </button>
                ) : (
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                    {lessonTitle}
                  </p>
                )}
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              title="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-950/40 custom-scrollbar space-y-4">
            
            {/* Instructor Student Selection View */}
            {isAuthor && !selectedStudentId ? (
              <div className="space-y-3">
                
                {/* Search Students */}
                {students.length > 3 && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search student..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                    />
                    <svg className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-slate-400 pb-1">
                  <span className="font-bold uppercase tracking-wider">{t('chat.select_student')}</span>
                  <span className="font-mono">{students.length} active threads</span>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 text-2xl flex items-center justify-center mx-auto text-slate-500">
                      📭
                    </div>
                    <p className="text-slate-400 text-xs font-semibold">{t('chat.no_questions')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`w-full text-left p-3.5 rounded-2xl transition-all border flex justify-between items-center cursor-pointer group ${
                          s.hasUnread 
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-white font-bold shadow-lg shadow-emerald-500/10' 
                            : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/80 hover:border-white/15 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {s.avatar ? (
                            <img 
                              src={s.avatar} 
                              alt={s.username} 
                              className="w-9 h-9 rounded-xl object-cover border border-emerald-500/40 shadow-sm shrink-0" 
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 ${
                              s.hasUnread 
                                ? 'bg-emerald-500 text-white border-emerald-400' 
                                : 'bg-white/5 text-slate-300 border-white/10'
                            }`}>
                              {s.username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                              {s.username}
                            </p>
                            <span className="text-[10px] text-slate-400">Student Question</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {s.hasUnread && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500 text-white rounded-full shadow-sm">
                              New
                            </span>
                          )}
                          <svg className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Message Thread Conversation */
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 text-2xl flex items-center justify-center mx-auto text-slate-500">
                      💡
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
                      {isAuthor ? t('chat.no_messages_staff') : t('chat.no_messages_student')}
                    </p>

                    {/* Quick Suggestion Chips for Students */}
                    {!isAuthor && (
                      <div className="pt-2 space-y-1.5 text-left">
                        <p className="text-[11px] text-slate-500 font-bold">Suggested questions:</p>
                        {quickPrompts.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => setNewMessage(prompt)}
                            className="w-full text-left p-2 rounded-xl text-[11px] text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition-all cursor-pointer truncate"
                          >
                            + {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender?.id === currentUser?.id;
                    const senderRole = msg.sender?.role?.type;
                    const isSenderInstructor = senderRole === 'instructor' || senderRole === 'admin' || senderRole === 'content_manager';
                    const senderAvatar = isMine ? currentUser?.avatar : msg.sender?.avatar;

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}>
                        <div className="flex items-center gap-1.5 px-1">
                          {senderAvatar && (
                            <img 
                              src={senderAvatar} 
                              alt="Avatar" 
                              className="w-4 h-4 rounded-full object-cover border border-white/15 inline-block" 
                            />
                          )}
                          <span className="text-[10px] font-bold text-slate-400">
                            {isMine ? 'You' : msg.sender?.username || 'User'}
                          </span>
                          {!isMine && isSenderInstructor && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Instructor
                            </span>
                          )}
                        </div>

                        <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed shadow-md ${
                          isMine 
                            ? 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-600/10' 
                            : 'bg-slate-800/90 text-slate-100 rounded-tl-none border border-white/10'
                        }`}>
                          {msg.content}
                        </div>

                        <span className="text-[9px] text-slate-500 font-mono px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Bar */}
          {(!isAuthor || selectedStudentId) && (
            <form onSubmit={handleSend} className="p-3 sm:p-4 bg-slate-950/90 border-t border-white/10 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={t('chat.type_message')}
                  className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 flex items-center justify-center cursor-pointer"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>{t('chat.send')} ➤</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Floating Launcher Pill */
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-2xl border border-emerald-400/40 rounded-2xl px-5 py-3.5 font-bold transition-all hover:scale-105 flex items-center gap-2.5 cursor-pointer shadow-emerald-500/20 group"
        >
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-sm shadow-inner group-hover:rotate-12 transition-transform">
            {isAuthor ? '👨‍🏫' : '💬'}
          </div>
          <span className="text-xs sm:text-sm tracking-wide">
            {isAuthor ? t('chat.student_queries') : t('chat.ask_authors')}
          </span>
          
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center rounded-full animate-pulse border-2 border-slate-950 shadow-md">
              {isAuthor ? `${unreadCount} new` : '!'}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
