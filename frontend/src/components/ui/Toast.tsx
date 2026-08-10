'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
}

export function Toast({
  type = 'success',
  title,
  message,
  onClose,
}: ToastProps) {
  const types = {
    success: {
      bg: 'bg-white border-emerald-200 text-slate-800 shadow-lg',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-white border-rose-200 text-slate-800 shadow-lg',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-white border-sky-200 text-slate-800 shadow-lg',
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
    },
  };

  const cur = types[type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-2xl border max-w-sm w-full transition-all animate-in fade-in slide-in-from-top-2 duration-200',
        cur.bg
      )}
    >
      {cur.icon}
      <div className="flex-1 flex flex-col gap-0.5">
        {title && <h5 className="text-sm font-bold text-slate-900">{title}</h5>}
        <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
