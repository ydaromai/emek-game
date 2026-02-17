'use client';

type SpinnerSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<SpinnerSize, { width: number; height: number }> = {
  sm: { width: 16, height: 16 },
  md: { width: 24, height: 24 },
  lg: { width: 32, height: 32 },
};

interface NatureSpinnerProps {
  size?: SpinnerSize;
}

export default function NatureSpinner({ size = 'md' }: NatureSpinnerProps) {
  const { width, height } = sizeMap[size];

  return (
    <svg
      className="nature-spinner"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="טוען..."
      role="status"
    >
      <path
        d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M12 6C12 6 6 8 6 12C6 16 12 18 12 18C12 18 18 16 18 12C18 8 12 6 12 6Z"
        fill="currentColor"
        opacity="0.4"
      />
    </svg>
  );
}
