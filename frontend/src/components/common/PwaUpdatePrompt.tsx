'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';

export const PwaUpdatePrompt: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if auto-update is enabled (default true)
    const isAutoUpdateEnabled = localStorage.getItem('krupet_auto_update_enabled') !== 'false';
    if (!isAutoUpdateEnabled) return;

    // Listen for custom trigger or service worker update
    const handleUpdateFound = () => {
      setShowPrompt(true);
    };

    window.addEventListener('krupet-update-available', handleUpdateFound);

    // Register service worker update check if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowPrompt(true);
              }
            });
          }
        });
      });
    }

    return () => {
      window.removeEventListener('krupet-update-available', handleUpdateFound);
    };
  }, []);

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
      }
    } catch (e) {
      console.debug('Cache refresh skipped:', e);
    } finally {
      window.location.reload();
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full p-4 bg-white rounded-3xl border-2 border-teal-800 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-teal-800" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
              {isKm ? 'កំណែថ្មី' : 'NEW VERSION'}
            </span>
            <span className="text-xs font-bold text-stone-900">
              {isKm ? 'កំណែអាប់ដេតថ្មីមានរួចរាល់' : 'Update Available'}
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            {isKm
              ? 'KruPet មានមុខងារថ្មីៗ និងដំណោះស្រាយសុវត្ថិភាព។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីធ្វើបច្ចុប្បន្នភាពឥឡូវនេះ។'
              : 'A new version of KruPet is available with enhancements. Click below to apply update.'}
          </p>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleApplyUpdate}
              disabled={isUpdating}
              className="flex-1 py-2 px-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isKm ? 'ធ្វើបច្ចុប្បន្នភាពឥឡូវនេះ' : 'Update Now'}</span>
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              {isKm ? 'ពេលក្រោយ' : 'Later'}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowPrompt(false)}
          className="p-1 text-stone-400 hover:text-stone-700 rounded-lg shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
