import { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export default function PageShell({ children, className = '' }: PageShellProps) {
  return (
    <main className={`min-h-screen px-4 py-6 max-w-lg mx-auto ${className}`}>
      {children}
    </main>
  );
}
