'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (url: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Only handle URLs from our app
          if (decodedText.includes('/scan/')) {
            scanner.stop().catch(() => {});
            onScan(decodedText);
          }
        },
        () => {} // ignore scan failures
      )
      .catch((err) => {
        if (err.toString().includes('NotAllowedError')) {
          setError('יש לאשר גישה למצלמה כדי לסרוק קודי QR');
        } else {
          setError('לא ניתן להפעיל את המצלמה. נסו לסרוק ישירות עם אפליקציית המצלמה.');
        }
      });

    return () => {
      try {
        if (scanner.isScanning) {
          scanner.stop().catch(() => {});
        }
      } catch {
        // Scanner may not be running — safe to ignore
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Inline keyframes for scan animations */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(200px); }
        }
        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0; }
        }
      `}</style>

      {/* Header with gradient */}
      <div className="relative bg-gradient-to-b from-[#1a2e1a] to-transparent p-5 pt-8 text-center z-10">
        <button
          onClick={onClose}
          className="absolute top-6 left-4 text-white text-2xl leading-none p-2"
          aria-label="סגירה"
        >
          &#x2715;
        </button>
        <h2 className="text-lg font-bold text-white">סרקו קוד QR</h2>
        <p className="text-sm text-white/70">כוונו את המצלמה אל קוד ה-QR בתחנה</p>
      </div>

      {/* Scan area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Camera feed */}
        <div id="qr-reader" className="absolute inset-0 w-full h-full" />

        {/* Scan frame container */}
        <div className="relative w-64 h-64 z-10">
          {/* Pulse ring */}
          <div
            className="absolute inset-0 border-2 border-[#4ecdc4] rounded-3xl"
            style={{ animation: 'pulseRing 2s ease-in-out infinite' }}
          />

          {/* Corner brackets — top-left */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
          {/* Corner brackets — top-right */}
          <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
          {/* Corner brackets — bottom-left */}
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
          {/* Corner brackets — bottom-right */}
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />

          {/* Scanning line */}
          <div
            className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#4ecdc4] to-transparent shadow-[0_0_15px_#4ecdc4]"
            style={{ animation: 'scanLine 2.5s ease-in-out infinite' }}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="px-6 pb-2 text-center z-10">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Bottom buttons */}
      <div className="p-6 pb-8 z-10 space-y-3">
        <button
          onClick={onClose}
          className="w-full bg-white/10 backdrop-blur border border-white/20 text-white py-3 rounded-xl text-base font-medium"
        >
          סגירה
        </button>
      </div>
    </div>
  );
}
