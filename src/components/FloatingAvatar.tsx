'use client';

import { motion, useReducedMotion } from 'motion/react';

interface FloatingAvatarProps {
  children: React.ReactNode;
  className?: string;
}

export default function FloatingAvatar({ children, className }: FloatingAvatarProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      animate={prefersReducedMotion ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}
