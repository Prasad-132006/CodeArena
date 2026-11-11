'use client';

import React, { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#FFA116] text-[#0D1117] font-semibold hover:bg-[#e5911a] active:bg-[#cc8116] focus-visible:ring-[#FFA116]',
  secondary:
    'border border-[#273244] bg-transparent text-[#F0F3F6] hover:border-[#FFA116] hover:text-[#FFA116] focus-visible:ring-[#FFA116]',
  ghost:
    'bg-transparent text-[#929BA8] hover:text-[#F0F3F6] hover:bg-[#1C2532] focus-visible:ring-[#273244]',
  danger:
    'bg-[#EF4743] text-white font-semibold hover:bg-[#d63c38] active:bg-[#c03530] focus-visible:ring-[#EF4743]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
export { Button };
export type { ButtonProps, ButtonVariant };
