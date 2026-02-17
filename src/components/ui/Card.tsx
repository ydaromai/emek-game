import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl
        border border-deep-green/10
        shadow-sm shadow-deep-green/5
        p-5
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
