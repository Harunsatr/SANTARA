'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options = [],
      placeholder,
      id,
      containerClassName,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs sm:text-sm font-semibold text-slate-700 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              'w-full min-h-[44px] px-3.5 py-2 text-sm text-slate-900 bg-white border rounded-xl transition-all duration-150 appearance-none pr-10',
              'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500',
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer',
              error
                ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                : 'border-slate-300 hover:border-slate-400',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
        {!error && helperText && (
          <span className="text-xs text-slate-500">{helperText}</span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
