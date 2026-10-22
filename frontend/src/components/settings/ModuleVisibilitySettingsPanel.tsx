'use client';

import React, { useState, useEffect } from 'react';
import {
  OPTIONAL_MODULES,
  getHiddenModules,
  setModuleHidden,
  applyStandardKhmerClinicPreset,
  resetAllModulesVisible,
} from '../../lib/module-visibility';
import { useTranslation } from '../../context/I18nContext';
import {
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
} from 'lucide-react';

export const ModuleVisibilitySettingsPanel: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const [hiddenList, setHiddenList] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setHiddenList(getHiddenModules());
    const handler = () => {
      setHiddenList(getHiddenModules());
    };
    window.addEventListener('krupet-modules-changed', handler);
    return () => window.removeEventListener('krupet-modules-changed', handler);
  }, []);

  const handleToggle = (path: string) => {
    const isCurrentlyHidden = hiddenList.includes(path);
    setModuleHidden(path, !isCurrentlyHidden);
    setToastMessage(
      isKm
        ? `បានកែសម្រួលភាពមើលឃើញនៃ ${path} រួចរាល់។`
        : `Updated visibility for ${path}.`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyPreset = () => {
    const list = applyStandardKhmerClinicPreset();
    setHiddenList(list);
    setToastMessage(
      isKm
        ? 'បានកំណត់សម្រាប់គ្លីនិកខ្មែរទូទៅដោយជោគជ័យ។ ម៉ូឌុលស្មុគស្មាញត្រូវបានលាក់ពី Menu។'
        : 'Applied Standard Khmer Clinic preset. Advanced specialized modules are now hidden.'
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResetAll = () => {
    resetAllModulesVisible();
    setHiddenList([]);
    setToastMessage(
      isKm
        ? 'បានបង្ហាញម៉ូឌុលទាំងអស់ឡើងវិញពេញលេញ។'
        : 'All modules restored to visible.'
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-teal-800" />
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              {isKm
                ? 'ការកំណត់ភាពមើលឃើញនៃមុខងារ & ផ្ទាំងគ្រប់គ្រង'
                : 'Module Visibility & Dashboard Customization'}
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            {isKm
              ? 'សម្រាប់គ្លីនិកខ្មែរទូទៅ លោកអ្នកអាចបិទ ឬលាក់មុខងារស្មុគស្មាញដែលមិនចាំបាច់ ដើម្បីធ្វើឱ្យផ្ទាំងការងារកាន់តែស្រាល សាមញ្ញ និងងាយស្រួលប្រើប្រាស់។'
              : 'Customize which specialized modules appear in your sidebar and dashboard to simplify daily operations for standard clinics.'}
          </p>
        </div>

        {/* Quick Action Presets */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleApplyPreset}
            className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isKm ? 'កំណត់សម្រាប់គ្លីនិកខ្មែរទូទៅ' : 'Standard Khmer Clinic Preset'}</span>
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isKm ? 'បង្ហាញទាំងអស់' : 'Show All'}</span>
          </button>
        </div>
      </div>

      {/* Modules List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OPTIONAL_MODULES.map((mod) => {
          const isHidden = hiddenList.includes(mod.path);
          return (
            <div
              key={mod.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                isHidden
                  ? 'bg-stone-50 border-stone-200 opacity-75'
                  : 'bg-white border-teal-800/30 shadow-xs'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-stone-900">
                    {isKm ? mod.nameKh : mod.nameEn}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      isHidden
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {isHidden
                      ? (isKm ? 'បានលាក់ពី Menu' : 'Hidden')
                      : (isKm ? 'បង្ហាញក្នុង Menu' : 'Visible')}
                  </span>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed font-sans">
                  {isKm ? mod.descKh : mod.descEn}
                </p>
                <div className="text-[10px] font-mono text-stone-400 pt-0.5">
                  Route: {mod.path}
                </div>
              </div>

              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => handleToggle(mod.path)}
                className={`p-2 rounded-xl border transition-colors shrink-0 cursor-pointer ${
                  isHidden
                    ? 'bg-white hover:bg-stone-100 text-stone-600 border-stone-300'
                    : 'bg-teal-800 hover:bg-teal-900 text-white border-teal-900 shadow-2xs'
                }`}
                title={isHidden ? 'Click to show in menu' : 'Click to hide from menu'}
              >
                {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
