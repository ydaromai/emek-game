import { ReactNode } from 'react';

interface TipBoxProps {
  icon?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Styled tip/hint container with nature theme.
 * Supports RTL layout automatically via flexbox direction.
 * Accepts className for stagger animation integration (e.g. `animate-enter-3`).
 */
export default function TipBox({
  icon = '\u{1F33F}',
  children,
  className = '',
}: TipBoxProps) {
  return (
    <div
      className={`
        bg-turquoise/5 border border-turquoise/20 rounded-xl p-4
        animate-tip-glow
        flex items-start gap-3
        ${className}
      `}
    >
      <span className="animate-emoji-bounce text-lg shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
