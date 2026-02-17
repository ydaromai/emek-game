'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id || label.replace(/\s+/g, '-').toLowerCase();

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-deep-green mb-1"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full min-h-[44px] px-4 py-3
            rounded-xl border-2 text-lg
            bg-white text-nature-text
            placeholder:text-deep-green/40
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-turquoise focus:border-turquoise
            ${error ? 'border-error' : 'border-deep-green/20'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
