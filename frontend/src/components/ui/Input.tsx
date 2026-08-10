'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs sm:text-sm font-semibold text-slate-700 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            className={cn(
              'w-full min-h-[44px] px-3.5 py-2 text-sm text-slate-900 bg-white border rounded-xl transition-all duration-150',
              'placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500',
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
              error
                ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                : 'border-slate-300 hover:border-slate-400',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
        {!error && helperText && (
          <span className="text-xs text-slate-500">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
