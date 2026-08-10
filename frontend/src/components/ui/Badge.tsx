import React from 'react';
import { cn } from '@/lib/utils';
import { getNutritionStyle } from '@/lib/utils/nutrition';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral' | 'nutrition';
  nutritionStatus?: string | null;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'neutral',
  nutritionStatus,
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  if (variant === 'nutrition' || nutritionStatus) {
    const style = getNutritionStyle(nutritionStatus || (typeof children === 'string' ? children : ''));
    return (
      <span
        className={cn(
          'inline-flex items-center font-semibold rounded-full border shadow-2xs',
          style.badgeClass,
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: style.color }}
          />
        )}
        {children || style.label}
      </span>
    );
  }

  const variants = {
    primary: 'bg-sky-50 text-sky-700 border-sky-200',
    secondary: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border shadow-2xs',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0" />
      )}
      {children}
    </span>
  );
}
