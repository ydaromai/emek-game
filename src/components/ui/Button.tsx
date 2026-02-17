'use client';

import { ButtonHTMLAttributes, forwardRef, useCallback, useRef } from 'react';
import NatureSpinner from './NatureSpinner';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-deep-green text-white hover:bg-gradient-to-br hover:from-deep-green hover:to-nature-dark active:bg-nature-dark',
  secondary: 'bg-turquoise text-white hover:bg-turquoise/90 active:bg-turquoise/80',
  outline: 'border-2 border-deep-green text-deep-green bg-transparent hover:bg-deep-green/5 active:bg-deep-green/10',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', fullWidth = false, isLoading = false, className = '', disabled, children, onClick, ...props }, ref) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (isLoading || disabled) return;

      // Create ripple at click coordinates
      const button = buttonRef.current;
      if (button) {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        button.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      }

      onClick?.(e);
    }, [isLoading, disabled, onClick]);

    return (
      <button
        ref={(node) => {
          buttonRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        disabled={disabled || isLoading}
        className={`
          min-h-[44px] min-w-[44px] px-6 py-3
          rounded-xl font-medium text-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-turquoise focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-[0.97]
          relative overflow-hidden
          ${variantStyles[variant]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        onClick={handleClick}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <NatureSpinner size="sm" />
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
