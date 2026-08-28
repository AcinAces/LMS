import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

interface LessonChatProps {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  lessonOrder: number;
  isStaff: boolean;
}

interface Message {
  id: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: number; username: string; email: string; role?: { type: string } };
  student?: { id: number; username: string };
}

interface StudentThread {
  id: number;
  username: string;
  hasUnread?: boolean;
}

export default function LessonChat({ lessonId, courseId, lessonTitle, lessonOrder, isStaff }: LessonChatProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [students, setStudents] = useState<StudentThread[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const jwt = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // Polling ref to prevent strict mode double-polling issues
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = async (targetStudentId?: number | null) => {
    if (!jwt) return;
    try {
      const query = (isStaff && targetStudentId) ? `?studentId=${targetStudentId}` : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-messages/chat/${lessonId}${query}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data);
        
        // Calculate unread
        const unread = json.data.filter((m: Message) => !m.isRead && m.sender?.id !== currentUser?.id).length;
        setUnreadCount(unread > 0 ? 1 : 0); // Display 1 flag for any number of unreads
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchStudents = async () => {
    if (!jwt || !isStaff) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-messages/chat/${lessonId}/students`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (res.ok) {
        const json = await res.json();
        setStudents(json.data);
        if (!selectedStudentId) {
          const unreadStudents = json.data.filter((s: StudentThread) => s.hasUnread).length;
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
      const body = (isStaff && targetStudentId) ? JSON.stringify({ studentId: targetStudentId }) : '{}';
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-messages/chat/${lessonId}/read`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body
      });
      if (isStaff) {
        fetchStudents();
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  useEffect(() => {
    if (isStaff && !selectedStudentId) {
      fetchStudents();
    } else {
      fetchMessages(selectedStudentId);
    }

    pollIntervalRef.current = setInterval(() => {
      if (isStaff && !selectedStudentId) {
        fetchStudents();
      } else {
        fetchMessages(selectedStudentId);
      }
    }, 10000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [lessonId, isStaff, selectedStudentId]);

  useEffect(() => {
    // If opened, scroll to bottom and mark read
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
    if (!newMessage.trim() || !jwt) return;
    
    const msgContent = newMessage;
    setNewMessage('');

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
        ...(isStaff && selectedStudentId ? { studentId: selectedStudentId } : {})
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
      } else {
        // Revert on failure (simplified)
        fetchMessages(selectedStudentId);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      fetchMessages(selectedStudentId);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="bg-gray-900 border border-gray-700 shadow-xl rounded-xl w-80 sm:w-96 overflow-hidden flex flex-col" style={{ height: '500px', maxHeight: '80vh' }}>
          {/* Header */}
          <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-bold text-white">
                {isStaff && selectedStudentId 
                  ? `${students.find(s => s.id === selectedStudentId)?.username || 'Student'} - ${t('chat.queries_title')}`
                  : `${t('lesson.back_to')} ${lessonOrder} - ${t('chat.questions_title')}`}
              </h3>
              {isStaff && selectedStudentId && (
                <button 
                  onClick={() => setSelectedStudentId(null)}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  &larr; {t('chat.back_to_students')}
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Body */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-black/40">
            {isStaff && !selectedStudentId ? (
              <div className="space-y-2">
                <p className="text-gray-400 text-sm mb-4">{t('chat.select_student')}</p>
                {students.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">{t('chat.no_questions')}</p>
                ) : (
                  students.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudentId(s.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors border flex justify-between items-center ${
                        s.hasUnread 
                          ? 'bg-gray-700 border-emerald-500 text-white font-medium' 
                          : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <span>{s.username}</span>
                      {s.hasUnread && <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>}
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-sm italic text-center mt-4">
                    {isStaff ? t('chat.no_messages_staff') : t('chat.no_messages_student')}
                  </p>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender?.id === currentUser?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                          isMine ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-100 rounded-bl-none'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 px-1">
                          {msg.sender?.username || 'User'} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {(!isStaff || selectedStudentId) && (
            <form onSubmit={handleSend} className="p-3 bg-gray-800 border-t border-gray-700 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={t('chat.type_message')}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors"
                >
                  {t('chat.send')}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg border border-emerald-400/30 rounded-full px-5 py-3 font-semibold transition-transform hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          {isStaff ? t('chat.student_queries') : t('chat.ask_authors')}
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full animate-pulse border-2 border-gray-900">
              {isStaff ? unreadCount : '!'}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

