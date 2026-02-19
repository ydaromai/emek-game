interface SectionDividerProps {
  variant?: 'wave' | 'leaves';
}

/**
 * Decorative section divider with animated SVG draw effect.
 * - `wave`: gentle sine wave path in turquoise
 * - `leaves`: 3-4 small leaf silhouettes spread across width
 */
export default function SectionDivider({ variant = 'wave' }: SectionDividerProps) {
  return (
    <div className="w-full h-6" aria-hidden="true">
      {variant === 'wave' ? <WaveDivider /> : <LeavesDivider />}
    </div>
  );
}

function WaveDivider() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 1200 24"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 12 C100 4, 200 20, 300 12 S500 4, 600 12 S800 20, 900 12 S1100 4, 1200 12"
        stroke="#4DB6AC"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-svg-draw"
        pathLength="1"
      />
    </svg>
  );
}

function LeavesDivider() {
  /* Four small leaf silhouettes evenly distributed across the width */
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 1200 24"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Leaf 1 — ~15% */}
      <path
        d="M170 12 C174 6, 182 4, 186 8 C190 12, 186 18, 180 18 C176 18, 172 16, 170 12Z"
        stroke="#4DB6AC"
        strokeWidth="1.5"
        className="animate-svg-draw"
        pathLength="1"
        style={{ animationDelay: '0s' }}
      />
      {/* Leaf 2 — ~38% */}
      <path
        d="M450 12 C454 6, 462 4, 466 8 C470 12, 466 18, 460 18 C456 18, 452 16, 450 12Z"
        stroke="#4DB6AC"
        strokeWidth="1.5"
        className="animate-svg-draw"
        pathLength="1"
        style={{ animationDelay: '0.15s' }}
      />
      {/* Leaf 3 — ~62% */}
      <path
        d="M730 12 C734 6, 742 4, 746 8 C750 12, 746 18, 740 18 C736 18, 732 16, 730 12Z"
        stroke="#4DB6AC"
        strokeWidth="1.5"
        className="animate-svg-draw"
        pathLength="1"
        style={{ animationDelay: '0.3s' }}
      />
      {/* Leaf 4 — ~85% */}
      <path
        d="M1010 12 C1014 6, 1022 4, 1026 8 C1030 12, 1026 18, 1020 18 C1016 18, 1012 16, 1010 12Z"
        stroke="#4DB6AC"
        strokeWidth="1.5"
        className="animate-svg-draw"
        pathLength="1"
        style={{ animationDelay: '0.45s' }}
      />
    </svg>
  );
}
