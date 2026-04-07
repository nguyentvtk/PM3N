'use client';

import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 4000);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
}

const variantConfig: Record<ToastVariant, { icon: React.ReactNode; border: string; bg: string }> = {
  default: {
    icon: <Info className="size-4 text-blue-400" />,
    border: 'border-blue-500/30',
    bg: 'bg-[#131d35]',
  },
  success: {
    icon: <CheckCircle className="size-4 text-emerald-400" />,
    border: 'border-emerald-500/30',
    bg: 'bg-[#0d1f18]',
  },
  error: {
    icon: <AlertCircle className="size-4 text-red-400" />,
    border: 'border-red-500/30',
    bg: 'bg-[#1f0d0d]',
  },
  warning: {
    icon: <AlertTriangle className="size-4 text-amber-400" />,
    border: 'border-amber-500/30',
    bg: 'bg-[#1f1a0d]',
  },
  info: {
    icon: <Info className="size-4 text-blue-400" />,
    border: 'border-blue-500/30',
    bg: 'bg-[#0d1220]',
  },
};

function ToastItem({ toast: t, dismiss }: { toast: Toast; dismiss: (id: string) => void }) {
  const cfg = variantConfig[t.variant ?? 'default'];
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-xl animate-fade-in',
        cfg.bg,
        cfg.border
      )}
    >
      <span className="mt-0.5 shrink-0">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        {t.title && <p className="text-sm font-semibold text-slate-100">{t.title}</p>}
        {t.description && <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>}
      </div>
      <button
        onClick={() => dismiss(t.id)}
        className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
        title="Đóng"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
