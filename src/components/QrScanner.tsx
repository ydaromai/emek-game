'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Button from '@/components/ui/Button';

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
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        <div className="p-4 text-center">
          <h2 className="text-lg font-bold text-deep-green">סרקו קוד QR</h2>
          <p className="text-sm text-deep-green/60">כוונו את המצלמה אל קוד ה-QR בתחנה</p>
        </div>

        <div id="qr-reader" className="w-full" />

        {error && (
          <div className="p-4 text-center">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        <div className="p-4">
          <Button variant="outline" fullWidth onClick={onClose}>
            סגירה
          </Button>
        </div>
      </div>
    </div>
  );
}
