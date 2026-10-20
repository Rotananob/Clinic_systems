'use client';

import { useEffect, useRef } from 'react';

export interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxIntervalMs?: number;
  preventDefaultOnScan?: boolean;
}

export function useBarcodeScanner({
  onScan,
  minChars = 4,
  maxIntervalMs = 50,
  preventDefaultOnScan = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // When Enter or Tab is pressed, check if buffer contains a barcode
      if (event.key === 'Enter' || event.key === 'Tab') {
        const barcode = bufferRef.current.trim();
        if (barcode.length >= minChars) {
          if (preventDefaultOnScan) {
            event.preventDefault();
          }
          onScan(barcode);
        }
        bufferRef.current = '';
        return;
      }

      // Printable single characters only
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        // If interval is larger than maxIntervalMs, human is likely typing manually; reset buffer
        if (interval > maxIntervalMs && bufferRef.current.length > 0) {
          bufferRef.current = '';
        }
        bufferRef.current += event.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, minChars, maxIntervalMs, preventDefaultOnScan]);
}
