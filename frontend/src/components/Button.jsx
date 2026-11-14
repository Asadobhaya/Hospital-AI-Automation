// src/components/Button.jsx — Standardized Accessible Action Button
import React from 'react';
import { clsx } from 'clsx';

const variants = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700 shadow-sm border border-primary-500/30 focus-visible:ring-primary-400',
  secondary:
    'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white active:bg-slate-850 border border-slate-700 focus-visible:ring-slate-400',
  danger:
    'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-sm border border-rose-500/30 focus-visible:ring-rose-400',
  outline:
    'bg-transparent text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700 focus-visible:ring-slate-400',
  ghost:
    'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent focus-visible:ring-slate-400',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[36px]',
  md: 'px-4 py-2.5 text-sm rounded-xl min-h-[44px]',
  lg: 'px-5 py-3 text-base rounded-xl min-h-[48px]',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        baseClasses,
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {loading ? (
        <span
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
          aria-hidden="true"
        />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : null}

      <span>{children}</span>

      {!loading && Icon && iconPosition === 'right' ? (
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : null}
    </button>
  );
}
