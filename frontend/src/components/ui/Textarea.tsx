'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      id,
      containerClassName,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs sm:text-sm font-semibold text-slate-700 select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-xl transition-all duration-150',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            error
              ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
              : 'border-slate-300 hover:border-slate-400',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
        {!error && helperText && (
          <span className="text-xs text-slate-500">{helperText}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
