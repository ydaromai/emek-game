'use client';

import { motion } from 'motion/react';

interface FloatingAvatarProps {
  children: React.ReactNode;
  className?: string;
}

export default function FloatingAvatar({ children, className }: FloatingAvatarProps) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}
