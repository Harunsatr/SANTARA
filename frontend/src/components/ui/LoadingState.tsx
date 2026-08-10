import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  variant?: 'spinner' | 'card' | 'table';
  rows?: number;
}

export function LoadingState({
  text = 'Memuat data...',
  variant = 'spinner',
  rows = 4,
  className,
  ...props
}: LoadingStateProps) {
  if (variant === 'card') {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)} {...props}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col gap-3', className)} {...props}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center gap-3',
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-600">{text}</p>
    </div>
  );
}
