'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

    const variants = {
      primary:
        'bg-sky-600 hover:bg-sky-700 text-white shadow-sm hover:shadow-sky-500/20 focus:ring-sky-500 border border-transparent',
      secondary:
        'bg-blue-900 hover:bg-blue-950 text-white shadow-sm focus:ring-blue-800 border border-transparent',
      outline:
        'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus:ring-sky-500 hover:border-slate-400',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-400 border border-transparent',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-rose-500/20 focus:ring-rose-500 border border-transparent',
      success:
        'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-emerald-500/20 focus:ring-emerald-500 border border-transparent',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
      md: 'text-sm px-4 py-2 min-h-[42px] gap-2',
      lg: 'text-base px-6 py-2.5 min-h-[48px] gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
