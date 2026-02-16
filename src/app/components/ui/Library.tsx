import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Badge Component
export const Badge: React.FC<{
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
  className?: string;
}> = ({ variant = 'neutral', children, className }) => {
  const variants = {
    success: 'bg-app-teal-accent/10 text-app-teal-accent border-app-teal-accent/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    danger: 'bg-app-red-alert/10 text-app-red-alert border-app-red-alert/20',
    neutral: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

// Button Component
export const Button: React.FC<{
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}> = ({ variant = 'primary', size = 'md', children, onClick, className, disabled }) => {
  const variants = {
    primary: 'bg-app-teal-accent text-black hover:bg-app-teal-accent/90 shadow-[0_0_20px_rgba(52,211,153,0.2)]',
    secondary: 'bg-app-surface-2 text-app-text-primary border border-app-border hover:bg-zinc-800',
    danger: 'bg-app-red-alert/10 text-app-red-alert border border-app-red-alert/20 hover:bg-app-red-alert/20',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
};

// Card Component
export const PanelCard: React.FC<{
  title?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon: Icon, children, className }) => (
  <div className={cn("bg-app-surface border border-app-border rounded-2xl md:rounded-[1.5rem] p-5 md:p-8 card-shadow", className)}>
    {title && (
      <div className="flex items-center gap-3 mb-5 md:mb-8 border-b border-app-border pb-4 md:pb-6">
        {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6 text-app-teal-accent" />}
        <h3 className="text-lg md:text-xl font-bold text-app-text-primary tracking-tight">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

export const StatsCard: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
}> = ({ label, value, icon: Icon, trend }) => (
  <div className="bg-app-surface border border-app-border rounded-2xl md:rounded-[1.5rem] p-4 md:p-8 card-shadow hover-glow transition-all duration-300">
    <div className="flex justify-between items-start mb-3 md:mb-6">
      <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-app-surface-2 border border-app-border text-app-text-secondary shadow-inner">
        <Icon size={20} className="md:w-6 md:h-6" />
      </div>
      {trend && (
        <span className={cn(
          "text-[11px] font-bold px-2.5 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50",
          trend.positive ? "text-app-teal-accent" : "text-app-red-alert"
        )}>
          {trend.value}
        </span>
      )}
    </div>
    <p className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] md:tracking-[0.2em] text-app-text-secondary font-bold mb-1 md:mb-2">{label}</p>
    <p className="text-xl md:text-3xl font-bold text-app-text-primary tracking-tight">{value}</p>
  </div>
);
