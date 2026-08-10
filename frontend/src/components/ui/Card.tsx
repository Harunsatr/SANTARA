import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'bordered' | 'flat';
}

export function Card({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white border border-slate-200/80 shadow-sm rounded-2xl',
    glass: 'bg-white/80 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl',
    bordered: 'bg-white border-2 border-slate-200 rounded-2xl',
    flat: 'bg-slate-50 border border-slate-100 rounded-2xl',
  };

  return (
    <div className={cn(variants[variant], 'transition-all duration-150', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 pb-3 sm:p-6 sm:pb-4 flex flex-col gap-1', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg sm:text-xl font-bold text-slate-900 tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-slate-500 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'p-5 pt-3 sm:p-6 sm:pt-4 border-t border-slate-100 flex items-center justify-between gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  badge?: React.ReactNode;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  iconBgColor = 'bg-sky-50 text-sky-600',
  badge,
  className,
  ...props
}: StatsCardProps) {
  return (
    <Card className={cn('p-5 sm:p-6', className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </span>
          {description && (
            <span className="text-xs text-slate-500 mt-1">{description}</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {icon && (
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', iconBgColor)}>
              {icon}
            </div>
          )}
          {badge}
        </div>
      </div>
    </Card>
  );
}
