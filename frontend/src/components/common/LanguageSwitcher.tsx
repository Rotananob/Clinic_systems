'use client';

import React from 'react';
import { useTranslation } from '../../context/I18nContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { locale, toggleLocale } = useTranslation();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors shadow-sm"
      title={locale === 'en' ? 'ប្តូរទៅជាភាសាខ្មែរ (Switch to Khmer)' : 'Switch to English'}
    >
      <Globe className="w-3.5 h-3.5 text-slate-500" />
      <span className="font-semibold">{locale === 'en' ? 'EN' : 'ខ្មែរ'}</span>
      <span className="text-[10px] text-slate-400">|</span>
      <span className="text-[10px] text-slate-500">{locale === 'en' ? 'ខ្មែរ' : 'EN'}</span>
    </button>
  );
};
