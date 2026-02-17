'use client';

import { useEffect, useRef, useState } from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  pulse?: boolean;
}

export default function ProgressBar({ current, total, label, pulse }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  // Key-flip pattern: when pulse fires, bump the key to remount the bar
  // and re-trigger the fill animation, giving visual feedback for progress change.
  const [pulseKey, setPulseKey] = useState(0);
  const prevCurrent = useRef(current);

  useEffect(() => {
    if (pulse && current !== prevCurrent.current) {
      setPulseKey((k) => k + 1);
      prevCurrent.current = current;
    }
  }, [current, pulse]);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2 text-sm font-medium text-deep-green">
          <span>{label}</span>
          <span>{current} מתוך {total}</span>
        </div>
      )}
      <div
        className={`w-full h-3 bg-deep-green/10 rounded-full overflow-hidden ${pulse && pulseKey > 0 ? 'animate-pulse-once' : ''}`}
      >
        <div
          key={pulseKey}
          className="h-full w-full bg-turquoise rounded-full animate-fill-bar progress-shimmer"
          style={{
            '--fill-target': `${percentage / 100}`,
            transformOrigin: 'right',
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
