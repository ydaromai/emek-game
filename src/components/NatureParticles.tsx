'use client';

// NatureParticles — ambient floating particle layer.
// Particles are pure CSS shapes (no emoji). The entire layer has
// pointer-events: none so it never interferes with UI interactions.
// Respects prefers-reduced-motion: the container gets the
// .particles-reduced-motion class which sets display:none via a
// CSS media query defined in globals.css.

interface Particle {
  id: number;
  shape: 'leaf' | 'circle' | 'teardrop';
  color: string;
  size: number;        // px
  top: string;         // initial vertical position (%)
  left: string;        // initial horizontal position (%)
  duration: string;    // animation-duration (s)
  delay: string;       // animation-delay (s)
  opacity: number;
}

// Seeded set of particles — deterministic so SSR and client match.
// Values derived manually to avoid Math.random on the server.
const LEAF_PARTICLES: Particle[] = [
  // --- leaves (clip-path polygon) ---
  { id: 1,  shape: 'leaf',     color: '#2F5D50', size: 9,  top: '5%',  left: '12%', duration: '13s', delay: '0s',    opacity: 0.22 },
  { id: 2,  shape: 'leaf',     color: '#4DB6AC', size: 7,  top: '15%', left: '72%', duration: '11s', delay: '1.5s',  opacity: 0.18 },
  { id: 3,  shape: 'leaf',     color: '#2F5D50', size: 8,  top: '2%',  left: '45%', duration: '14s', delay: '3s',    opacity: 0.20 },
  { id: 4,  shape: 'leaf',     color: '#E8D8B9', size: 6,  top: '8%',  left: '88%', duration: '10s', delay: '0.8s',  opacity: 0.25 },
  // --- circles ---
  { id: 5,  shape: 'circle',   color: '#4DB6AC', size: 8,  top: '3%',  left: '28%', duration: '12s', delay: '2s',    opacity: 0.20 },
  { id: 6,  shape: 'circle',   color: '#E8D8B9', size: 6,  top: '10%', left: '60%', duration: '9s',  delay: '4s',    opacity: 0.28 },
  { id: 7,  shape: 'circle',   color: '#2F5D50', size: 10, top: '1%',  left: '5%',  duration: '15s', delay: '1s',    opacity: 0.15 },
  // --- teardrops ---
  { id: 8,  shape: 'teardrop', color: '#4DB6AC', size: 8,  top: '6%',  left: '82%', duration: '11s', delay: '3.5s',  opacity: 0.22 },
  { id: 9,  shape: 'teardrop', color: '#2F5D50', size: 7,  top: '4%',  left: '38%', duration: '13s', delay: '0.5s',  opacity: 0.18 },
  { id: 10, shape: 'teardrop', color: '#E8D8B9', size: 9,  top: '12%', left: '55%', duration: '10s', delay: '4.5s',  opacity: 0.20 },
];

// Particles filtered per variant
function getParticles(variant: 'leaves' | 'water' | 'mixed'): Particle[] {
  if (variant === 'leaves') {
    return LEAF_PARTICLES.filter((p) => p.shape === 'leaf');
  }
  if (variant === 'water') {
    return LEAF_PARTICLES.filter((p) => p.shape === 'circle' || p.shape === 'teardrop');
  }
  return LEAF_PARTICLES; // mixed — all 10
}

function getShapeStyle(particle: Particle): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: particle.size,
    height: particle.size,
    top: particle.top,
    left: particle.left,
    opacity: particle.opacity,
    backgroundColor: particle.color,
    animationDuration: particle.duration,
    animationDelay: particle.delay,
    // GPU hint
    willChange: 'transform',
  };

  if (particle.shape === 'leaf') {
    return {
      ...base,
      // Simple leaf: asymmetric clip-path polygon
      clipPath: 'polygon(50% 0%, 100% 35%, 80% 100%, 20% 100%, 0% 35%)',
    };
  }

  if (particle.shape === 'circle') {
    return {
      ...base,
      borderRadius: '50%',
    };
  }

  // teardrop: tall border-radius trick
  return {
    ...base,
    height: particle.size * 1.4,
    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
  };
}

interface NatureParticlesProps {
  variant?: 'leaves' | 'water' | 'mixed';
}

export default function NatureParticles({ variant = 'mixed' }: NatureParticlesProps) {
  const particles = getParticles(variant);

  return (
    <div
      // pointer-events-none fixed inset-0 overflow-hidden z-0
      // .nature-particles-reduced-motion hides the whole thing when
      // prefers-reduced-motion: reduce is active (see globals.css)
      className="nature-particles pointer-events-none fixed inset-0 overflow-hidden z-0"
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="particle-float"
          style={getShapeStyle(particle)}
        />
      ))}
    </div>
  );
}
