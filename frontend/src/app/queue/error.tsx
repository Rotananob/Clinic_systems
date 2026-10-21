'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, RotateCcw, Home, AlertTriangle, Bug } from 'lucide-react';

export default function QueueErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for diagnostic telemetry
    console.error('[QueueErrorBoundary] Caught client-side error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
        {/* Error Icon Badge */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
          <AlertTriangle className="w-8 h-8 text-rose-600" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            បញ្ហាផ្ទុកក្ដារជួរអ្នកជំងឺ (Queue Screen Issue)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            មានបញ្ហាបច្ចេកទេសតូចមួយបានកើតឡើងអំឡុងពេលបង្ហាញក្ដារជួរ។ ទិន្នន័យអ្នកជំងឺទាំងអស់ត្រូវបានរក្សាទុកដោយសុវត្ថិភាព។
          </p>
          <p className="text-xs text-slate-400">
            A temporary client exception occurred while rendering the queue screen. Patient records and tokens remain secure.
          </p>
        </div>

        {/* Error Details (Expandable) */}
        {error?.message && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-left">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-500 mb-1">
              <Bug className="w-3.5 h-3.5 text-slate-400" />
              <span>Diagnostic Information:</span>
            </div>
            <pre className="text-[11px] font-mono text-rose-700 break-words whitespace-pre-wrap bg-white p-2 rounded-lg border border-slate-100 max-h-28 overflow-y-auto">
              {error.message}
              {error.digest ? `\nDigest: ${error.digest}` : ''}
            </pre>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ព្យាយាមឡើងវិញ (Try Again)</span>
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>ផ្ទុកឡើងវិញ (Reload)</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>ទំព័រដើម (Dashboard)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
