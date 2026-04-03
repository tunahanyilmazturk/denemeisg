import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';
    
    const variants = {
      primary: 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 dark:from-indigo-500 dark:to-indigo-400 dark:hover:from-indigo-600 dark:hover:to-indigo-500',
      secondary: 'bg-white/70 dark:bg-[#09090b]/70 backdrop-blur-sm text-slate-700 border border-slate-200/60 hover:bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:border-slate-700',
      danger: 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 hover:shadow-lg hover:shadow-red-500/25 dark:from-red-500 dark:to-red-400 dark:hover:from-red-600 dark:hover:to-red-500',
      ghost: 'bg-transparent hover:bg-slate-100/80 hover:text-slate-900 dark:hover:bg-slate-800/50 dark:hover:text-slate-100 text-slate-600 dark:text-slate-400',
      success: 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 dark:from-emerald-500 dark:to-emerald-400 dark:hover:from-emerald-600 dark:hover:to-emerald-500',
    };
    
    const sizes = {
      sm: 'h-9 px-4 text-sm gap-1.5',
      md: 'h-10 py-2 px-5 gap-2',
      lg: 'h-12 px-8 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
