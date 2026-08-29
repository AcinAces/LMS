'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global event bus for non-hook usage
type ToastListener = (toast: Omit<ToastItem, 'id'>) => void;
const listeners: Set<ToastListener> = new Set();

export const globalToast = {
  success: (message: string, title?: string, duration?: number) => {
    listeners.forEach(l => l({ type: 'success', message, title, duration }));
  },
  error: (message: string, title?: string, duration?: number) => {
    listeners.forEach(l => l({ type: 'error', message, title, duration }));
  },
  warning: (message: string, title?: string, duration?: number) => {
    listeners.forEach(l => l({ type: 'warning', message, title, duration }));
  },
  info: (message: string, title?: string, duration?: number) => {
    listeners.forEach(l => l({ type: 'info', message, title, duration }));
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, title?: string, duration: number = 4500) => {
    const id = Math.random().toString(36).substring(2, 9) + Date.now();
    const newToast: ToastItem = { id, type, message, title, duration };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const success = useCallback((message: string, title?: string, duration?: number) => {
    showToast('success', message, title || 'Success', duration);
  }, [showToast]);

  const error = useCallback((message: string, title?: string, duration?: number) => {
    showToast('error', message, title || 'Error', duration);
  }, [showToast]);

  const warning = useCallback((message: string, title?: string, duration?: number) => {
    showToast('warning', message, title || 'Warning', duration);
  }, [showToast]);

  const info = useCallback((message: string, title?: string, duration?: number) => {
    showToast('info', message, title || 'Info', duration);
  }, [showToast]);

  // Subscribe to globalToast
  useEffect(() => {
    const handler: ToastListener = ({ type, message, title, duration }) => {
      showToast(type, message, title, duration);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, dismiss }}>
      {children}
      {mounted && createPortal(<ToastContainer toasts={toasts} onDismiss={dismiss} />, document.body)}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div 
      aria-live="polite" 
      className="fixed top-4 right-4 z-[999999] flex flex-col gap-3 max-w-sm w-full pointer-events-none p-2 sm:p-0"
    >
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = toast.duration || 4500;

  useEffect(() => {
    if (isPaused) return;

    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          triggerDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, isPaused]);

  const triggerDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 200);
  };

  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          border: 'border-emerald-500/40',
          bg: 'bg-gradient-to-r from-emerald-950/90 to-gray-900/95',
          iconBg: 'bg-emerald-500/20 text-emerald-400',
          titleColor: 'text-emerald-300',
          progressBar: 'bg-emerald-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'error':
        return {
          border: 'border-rose-500/40',
          bg: 'bg-gradient-to-r from-rose-950/90 to-gray-900/95',
          iconBg: 'bg-rose-500/20 text-rose-400',
          titleColor: 'text-rose-300',
          progressBar: 'bg-rose-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
      case 'warning':
        return {
          border: 'border-amber-500/40',
          bg: 'bg-gradient-to-r from-amber-950/90 to-gray-900/95',
          iconBg: 'bg-amber-500/20 text-amber-400',
          titleColor: 'text-amber-300',
          progressBar: 'bg-amber-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'info':
      default:
        return {
          border: 'border-cyan-500/40',
          bg: 'bg-gradient-to-r from-cyan-950/90 to-gray-900/95',
          iconBg: 'bg-cyan-500/20 text-cyan-400',
          titleColor: 'text-cyan-300',
          progressBar: 'bg-cyan-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} p-4 shadow-2xl backdrop-blur-xl transition-all duration-200 ease-out transform ${
        isExiting ? 'opacity-0 translate-x-12 scale-95' : 'opacity-100 translate-x-0 scale-100 animate-fade-in-up'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className={`p-2 rounded-xl shrink-0 ${theme.iconBg}`}>
          {theme.icon}
        </div>

        <div className="flex-1 min-w-0 pr-2">
          {toast.title && (
            <h4 className={`text-sm font-bold tracking-tight mb-0.5 ${theme.titleColor}`}>
              {toast.title}
            </h4>
          )}
          <p className="text-xs text-gray-200 leading-relaxed break-words">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={triggerDismiss}
          className="text-gray-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-white/10 shrink-0"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Countdown progress line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
        <div 
          className={`h-full transition-all duration-75 ease-linear ${theme.progressBar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
