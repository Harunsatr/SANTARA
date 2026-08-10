'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  title = 'Gagal Memuat Data',
  message = 'Terjadi kendala saat menghubungkan ke server. Silakan periksa koneksi atau coba lagi.',
  onRetry,
  isRetrying = false,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-rose-200 bg-rose-50/40',
        className
      )}
      {...props}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-100/80 border border-rose-200 shadow-2xs flex items-center justify-center text-rose-600 mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 max-w-sm mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="border-rose-300 text-rose-800 hover:bg-rose-100/50"
        >
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
