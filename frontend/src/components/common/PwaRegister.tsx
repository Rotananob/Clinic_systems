'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export const PwaRegister = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[PWA] ServiceWorker registration failed:', error);
        });
    }

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setInstallPrompt(null);
  };

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fade-in text-sm">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-emerald-400" />
        <span className="font-medium">Install App for Offline Access</span>
      </div>
      <button
        onClick={handleInstallClick}
        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs transition"
      >
        Install
      </button>
      <button
        onClick={() => setIsInstallable(false)}
        className="text-slate-400 hover:text-white text-xs ml-1"
      >
        Dismiss
      </button>
    </div>
  );
};
