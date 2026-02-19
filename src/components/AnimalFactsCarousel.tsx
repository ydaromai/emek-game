'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Fact {
  icon: string;
  title: string;
  text: string;
}

export default function AnimalFactsCarousel({ facts }: { facts: Fact[] }) {
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const fact = facts[idx];

  const goTo = (newIdx: number) => {
    setDirection(newIdx > idx ? 1 : -1);
    setIdx(newIdx);
  };

  const prev = () => {
    if (idx > 0) goTo(idx - 1);
  };

  const next = () => {
    if (idx < facts.length - 1) goTo(idx + 1);
  };

  return (
    <div className="animate-enter-3 space-y-4">
      {/* Card container */}
      <div className="relative bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-[#1a8a6e]/10 min-h-[220px] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={idx}
            initial={{ x: direction * 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -200, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="flex flex-col items-center justify-center text-center h-full"
          >
            <span className="text-3xl mb-3">{fact.icon}</span>
            <h2 className="text-lg font-bold text-deep-green mb-2">{fact.title}</h2>
            <p className="text-deep-green/75 leading-relaxed">{fact.text}</p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {facts.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={idx === 0}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 shadow-md flex items-center justify-center transition-opacity ${
                idx === 0 ? 'opacity-30 cursor-default' : 'opacity-100'
              }`}
              aria-label="עובדה קודמת"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4l6 6-6 6" stroke="#2F5D50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={next}
              disabled={idx === facts.length - 1}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 shadow-md flex items-center justify-center transition-opacity ${
                idx === facts.length - 1 ? 'opacity-30 cursor-default' : 'opacity-100'
              }`}
              aria-label="עובדה הבאה"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4l-6 6 6 6" stroke="#2F5D50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {facts.length > 1 && (
        <div className="flex justify-center gap-2">
          {facts.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === idx ? 'bg-turquoise scale-110' : 'bg-deep-green/15'
              }`}
              aria-label={`עובדה ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
