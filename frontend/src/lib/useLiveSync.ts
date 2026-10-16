'use client';

import { useEffect, useRef } from 'react';

/**
 * useLiveSync
 * Hook that triggers a real-time refresh whenever:
 * 1. An optimistic offline mutation occurs locally (clinic_data_changed).
 * 2. Background queue completes syncing with the server (clinic_data_synced).
 * 3. The device regains internet connection (online).
 * Eliminates the need for manual page reloads or refreshes.
 */
export function useLiveSync(callback: () => void | Promise<void>) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    let debounceTimer: any = null;

    const triggerRefresh = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          savedCallback.current();
        } catch (err) {
          console.error('Error during live sync update:', err);
        }
      }, 80);
    };

    window.addEventListener('clinic_data_synced', triggerRefresh);
    window.addEventListener('clinic_data_changed', triggerRefresh);
    window.addEventListener('online', triggerRefresh);

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('clinic_data_synced', triggerRefresh);
      window.removeEventListener('clinic_data_changed', triggerRefresh);
      window.removeEventListener('online', triggerRefresh);
    };
  }, []);
}
