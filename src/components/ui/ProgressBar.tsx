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
        <div
          className="h-full bg-turquoise rounded-full transition-all duration-700 ease-out animate-fill-bar"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
