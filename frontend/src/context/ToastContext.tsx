'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, message, title }]);

      setTimeout(() => {
        dismiss(id);
      }, 4500);
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string, title?: string) => addToast('success', message, title),
    [addToast],
  );

  const error = useCallback(
    (message: string, title?: string) => addToast('error', message, title),
    [addToast],
  );

  const info = useCallback(
    (message: string, title?: string) => addToast('info', message, title),
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ success, error, info, dismiss }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-200 animate-in slide-in-from-top-3 fade-in flex items-start gap-3 ${
                isSuccess
                  ? 'bg-[#FDFBF7]/95 border-emerald-300 text-stone-900 shadow-emerald-950/5'
                  : isError
                  ? 'bg-[#FDFBF7]/95 border-rose-300 text-stone-900 shadow-rose-950/5'
                  : 'bg-[#FDFBF7]/95 border-sky-300 text-stone-900 shadow-sky-950/5'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isSuccess
                    ? 'bg-emerald-100 text-emerald-800'
                    : isError
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                {isError && <AlertCircle className="w-4 h-4" />}
                {!isSuccess && !isError && <Info className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                {t.title && (
                  <p className="text-xs font-bold text-stone-900 tracking-tight leading-snug">
                    {t.title}
                  </p>
                )}
                <p className="text-xs text-stone-700 leading-relaxed font-medium mt-0.5">
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
