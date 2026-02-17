'use client';

import confetti from 'canvas-confetti';

const COLORS = ['#2F5D50', '#4DB6AC', '#E8D8B9', '#D4A843', '#B3E5FC'];

export function fireConfetti(): void {
  if (typeof window === 'undefined') return;

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Burst 1 (0ms): center, 80 particles, spread 70
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.5, y: 0.6 },
    colors: COLORS,
  });

  // Burst 2 (300ms): origin left (0.2, 0.6), 40 particles, spread 50
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { x: 0.2, y: 0.6 },
      colors: COLORS,
    });
  }, 300);

  // Burst 3 (600ms): origin right (0.8, 0.6), 40 particles, spread 50
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { x: 0.8, y: 0.6 },
      colors: COLORS,
    });
  }, 600);
}
