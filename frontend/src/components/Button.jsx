// src/components/Button.jsx — Standardized Accessible Action Button (Medical Blue & White)
import React from 'react';
import { clsx } from 'clsx';

const variants = {
  primary:
    'bg-[#2F78C8] text-white hover:bg-[#2462A5] active:bg-[#1C4C82] shadow-sm border border-[#2F78C8] focus-visible:ring-[#175DB5]',
  secondary:
    'bg-white text-[#173A5E] hover:bg-[#EDF4FB] hover:text-[#173A5E] active:bg-[#E7F1FB] border border-[#DFE6EE] shadow-sm focus-visible:ring-[#175DB5]',
  danger:
    'bg-[#B42318] text-white hover:bg-[#9B1D14] active:bg-[#831810] shadow-sm border border-[#B42318] focus-visible:ring-[#B42318]',
  outline:
    'bg-transparent text-[#4B5D6B] hover:text-[#173A5E] hover:bg-[#EDF4FB] border border-[#DFE6EE] focus-visible:ring-[#175DB5]',
  ghost:
    'bg-transparent text-[#617181] hover:text-[#172B3A] hover:bg-[#EDF4FB] border border-transparent focus-visible:ring-[#175DB5]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-md min-h-[36px]',
  md: 'px-4 py-2 text-sm rounded-lg min-h-[40px]',
  lg: 'px-5 py-2.5 text-base rounded-lg min-h-[44px]',
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
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

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
