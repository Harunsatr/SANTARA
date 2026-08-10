import React from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50',
        className
      )}
      {...props}
    >
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-400 mb-4">
        {icon || <FolderOpen className="w-7 h-7 text-slate-400" />}
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
