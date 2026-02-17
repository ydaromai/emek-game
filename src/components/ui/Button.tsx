'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-deep-green text-white hover:bg-nature-dark active:bg-nature-dark',
  secondary: 'bg-turquoise text-white hover:bg-turquoise/90 active:bg-turquoise/80',
  outline: 'border-2 border-deep-green text-deep-green bg-transparent hover:bg-deep-green/5 active:bg-deep-green/10',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', fullWidth = false, className = '', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          min-h-[44px] min-w-[44px] px-6 py-3
          rounded-xl font-medium text-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-turquoise focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
