'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2 text-sm font-medium text-deep-green">
          <span>{label}</span>
          <span>{current} מתוך {total}</span>
        </div>
      )}
      <div className="w-full h-3 bg-deep-green/10 rounded-full overflow-hidden">
        {/*
          Using scaleX instead of width for the fill to avoid layout thrashing.
          transform-origin: right — the bar grows from right to left in RTL,
          matching the visual expectation of a progress fill in Hebrew UI.
          The inner wrapper is sized to the full track width; scaleX shrinks
          it visually while width: 100% keeps the layout stable.
        */}
        <div
          className="h-full w-full bg-turquoise rounded-full animate-fill-bar"
          style={{
            transform: `scaleX(${percentage / 100})`,
            transformOrigin: 'right',
          }}
        />
      </div>
    </div>
  );
}
