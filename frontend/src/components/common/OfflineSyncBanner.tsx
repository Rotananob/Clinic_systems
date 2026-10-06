'use client';

import React, { useEffect, useState } from 'react';
import { syncManager, SyncStatusInfo } from '../../lib/syncManager';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export const OfflineSyncBanner: React.FC = () => {
  const { locale } = useI18n();
  const [status, setStatus] = useState<SyncStatusInfo>({
    state: 'SYNCED',
    isOnline: true,
    pendingCount: 0,
    lastSyncedAt: null,
  });
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await syncManager.syncPending();
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Only show banner if offline or has pending mutations or syncing or failed
  if (status.isOnline && status.pendingCount === 0 && status.state === 'SYNCED') {
    return null;
  }

  const isKm = locale === 'km';

  return (
    <div className={`w-full py-2 px-4 transition-colors text-xs md:text-sm font-medium border-b flex flex-wrap items-center justify-between gap-2 z-30 ${
      !status.isOnline
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
        : status.state === 'SYNCING' || isManualSyncing
        ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300'
        : status.state === 'SYNC_FAILED'
        ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
    }`}>
      <div className="flex items-center gap-2.5">
        {!status.isOnline ? (
          <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
        ) : status.state === 'SYNCING' || isManualSyncing ? (
          <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-blue-600" />
        ) : status.state === 'SYNC_FAILED' ? (
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
        ) : (
          <Database className="w-4 h-4 shrink-0 text-emerald-600" />
        )}

        <span>
          {!status.isOnline ? (
            isKm
              ? `របៀបក្រៅបណ្តាញ (Offline) - ទិន្នន័យត្រូវបានរក្សាទុកក្នុងឧបករណ៍ (${status.pendingCount} ការផ្លាស់ប្តូរ)`
              : `Offline Mode - Local-first active (${status.pendingCount} local changes pending)`
          ) : status.state === 'SYNCING' || isManualSyncing ? (
            isKm ? 'កំពុងធ្វើសមកាលកម្មទិន្នន័យទៅម៉ាស៊ីនបម្រើ...' : 'Synchronizing local changes to server...'
          ) : status.state === 'SYNC_FAILED' ? (
            isKm ? 'ការធ្វើសមកាលកម្មបានបរាជ័យ។ សូមព្យាយាមម្តងទៀត។' : 'Sync failed. Retry available.'
          ) : (
            isKm
              ? `មាន ${status.pendingCount} ទិន្នន័យបានរក្សាទុកក្នុងឧបករណ៍ រង់ចាំសមកាលកម្ម`
              : `${status.pendingCount} modifications saved locally, ready to sync`
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {status.lastSyncedAt && (
          <span className="text-[11px] opacity-75 hidden sm:inline">
            {isKm ? `សមកាលកម្មចុងក្រោយ: ${status.lastSyncedAt}` : `Last sync: ${status.lastSyncedAt}`}
          </span>
        )}

        {status.isOnline && (
          <button
            onClick={handleManualSync}
            disabled={isManualSyncing || status.state === 'SYNCING'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-3 h-3 ${isManualSyncing ? 'animate-spin' : ''}`} />
            <span>{isKm ? 'ធ្វើសមកាលកម្មឥឡូវ' : 'Sync Now'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
