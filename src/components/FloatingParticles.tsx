'use client';

import { motion, useReducedMotion } from 'motion/react';

const EMOJIS = ['🍃', '🌿', '🌱', '🍀', '✨', '🦋'];

// Deterministic particle data — no Math.random for SSR/client match
const PARTICLES = [
  { emoji: EMOJIS[0], x: 8,  delay: 0,   duration: 10, size: 18 },
  { emoji: EMOJIS[1], x: 22, delay: 2.5, duration: 12, size: 22 },
  { emoji: EMOJIS[2], x: 35, delay: 1.2, duration: 9,  size: 16 },
  { emoji: EMOJIS[3], x: 48, delay: 4.0, duration: 13, size: 20 },
  { emoji: EMOJIS[4], x: 60, delay: 0.8, duration: 11, size: 14 },
  { emoji: EMOJIS[5], x: 75, delay: 3.5, duration: 8,  size: 24 },
  { emoji: EMOJIS[0], x: 88, delay: 5.0, duration: 14, size: 16 },
  { emoji: EMOJIS[1], x: 15, delay: 6.5, duration: 10, size: 28 },
  { emoji: EMOJIS[4], x: 42, delay: 7.2, duration: 12, size: 18 },
  { emoji: EMOJIS[3], x: 55, delay: 1.8, duration: 9,  size: 22 },
  { emoji: EMOJIS[5], x: 70, delay: 3.0, duration: 13, size: 20 },
  { emoji: EMOJIS[2], x: 92, delay: 5.5, duration: 11, size: 16 },
];

export default function FloatingParticles() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1] pointer-events-none overflow-hidden"
      aria-hidden="true"
      data-testid="floating-particles"
    >
      {/* Blur blobs for depth */}
      <div className="absolute top-10 -right-10 w-[200px] h-[200px] rounded-full bg-[#4ecdc4]/10 blur-3xl" />
      <div className="absolute bottom-20 -left-[60px] w-[250px] h-[250px] rounded-full bg-[#1a8a6e]/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#2ecc71]/5 blur-3xl" />

      {/* Floating particles */}
      {PARTICLES.map((particle, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: -30,
            fontSize: particle.size,
            willChange: 'transform',
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, 60, -40, 60, 0],
            rotate: [0, 360],
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'linear',
            repeat: Infinity,
          }}
        >
          {particle.emoji}
        </motion.div>
      ))}
    </div>
  );
}
