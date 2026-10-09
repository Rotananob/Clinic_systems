'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';

export const PwaRegister = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const { locale } = useTranslation();

  useEffect(() => {
    // Register Service Worker for offline-first support
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
    <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-4 z-40 bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fade-in text-xs sm:text-sm max-w-[92vw] sm:max-w-md">
      <div className="flex items-center gap-2 min-w-0">
        <Download className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-medium truncate">
          {locale === 'km' ? 'ដំឡើងកម្មវិធីសម្រាប់ប្រើប្រាស់ Offline' : 'Install App for Offline Access'}
        </span>
      </div>
      <button
        onClick={handleInstallClick}
        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs transition shrink-0"
      >
        {locale === 'km' ? 'ដំឡើង' : 'Install'}
      </button>
      <button
        onClick={() => setIsInstallable(false)}
        className="text-slate-400 hover:text-white text-xs ml-1 shrink-0"
      >
        {locale === 'km' ? 'បិទ' : 'Dismiss'}
      </button>
    </div>
  );
};
