'use client';

// LetterReveal — 3D card-flip animation that reveals a Hebrew letter.
// When `isNew` is true (first scan), the card flips from a "?" front face
// to the letter on the back face, with a glow burst and scatter particles.
// When `isNew` is false (repeat visit), the letter is shown immediately
// without any animation.
//
// All animations are GPU-composited (transform + opacity only) and
// respect prefers-reduced-motion via CSS classes in globals.css.

interface LetterRevealProps {
  letter: string;
  isNew: boolean;
}

// Scatter particle configuration — deterministic positions for SSR safety.
// Each particle flies outward in a different direction after the flip completes.
const SCATTER_PARTICLES = [
  { id: 1, color: '#2F5D50', size: 5, tx: -24, ty: -28 },
  { id: 2, color: '#4DB6AC', size: 4, tx: 26,  ty: -22 },
  { id: 3, color: '#E8D8B9', size: 6, tx: -30, ty: 10  },
  { id: 4, color: '#2F5D50', size: 4, tx: 28,  ty: 14  },
  { id: 5, color: '#4DB6AC', size: 5, tx: -14, ty: 30  },
  { id: 6, color: '#E8D8B9', size: 4, tx: 16,  ty: 28  },
  { id: 7, color: '#2F5D50', size: 5, tx: -8,  ty: -32 },
  { id: 8, color: '#4DB6AC', size: 4, tx: 10,  ty: -30 },
] as const;

export default function LetterReveal({ letter, isNew }: LetterRevealProps) {
  // No animation — show letter directly
  if (!isNew) {
    return (
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-turquoise text-white text-3xl font-bold">
        {letter}
      </div>
    );
  }

  // Animated reveal: 3D card flip + glow burst + scatter particles
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ perspective: '600px' }}
    >
      {/* Glow burst — radial gradient that scales up and fades out */}
      <div
        className="letter-reveal-glow absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(77,182,172,0.6) 0%, transparent 70%)',
          willChange: 'transform, opacity',
        }}
        aria-hidden="true"
      />

      {/* 3D flip card container */}
      <div
        className="letter-reveal-card relative w-16 h-16"
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {/* Front face — question mark */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full bg-deep-green text-white text-3xl font-bold"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          ?
        </div>

        {/* Back face — the letter */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full bg-turquoise text-white text-3xl font-bold"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {letter}
        </div>
      </div>

      {/* Scatter particles — fly outward after flip completes */}
      {SCATTER_PARTICLES.map((p) => (
        <span
          key={p.id}
          className="letter-reveal-particle absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            top: '50%',
            left: '50%',
            marginTop: -(p.size / 2),
            marginLeft: -(p.size / 2),
            // Custom properties for the scatter direction
            '--scatter-tx': `${p.tx}px`,
            '--scatter-ty': `${p.ty}px`,
            willChange: 'transform, opacity',
          } as React.CSSProperties}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
