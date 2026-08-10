import React from 'react';
import { cn } from '@/lib/utils';
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
}

export function Alert({
  className,
  variant = 'info',
  title,
  children,
  onClose,
  ...props
}: AlertProps) {
  const variants = {
    info: {
      container: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
      titleColor: 'text-sky-950',
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-950',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-950',
    },
    error: {
      container: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
      titleColor: 'text-rose-950',
    },
  };

  const current = variants[variant];

  return (
    <div
      className={cn(
        'p-4 rounded-xl border flex items-start gap-3 text-sm leading-relaxed shadow-2xs',
        current.container,
        className
      )}
      role="alert"
      {...props}
    >
      {current.icon}
      <div className="flex-1 flex flex-col gap-0.5">
        {title && (
          <h4 className={cn('font-semibold tracking-tight', current.titleColor)}>
            {title}
          </h4>
        )}
        <div className="text-xs sm:text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100 p-0.5 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
}
