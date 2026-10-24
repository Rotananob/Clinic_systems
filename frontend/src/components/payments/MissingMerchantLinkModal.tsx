'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../context/I18nContext';
import {
  CreditCard,
  AlertCircle,
  ArrowRight,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface MissingMerchantLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToSettings?: () => void;
  customMessage?: string;
}

export const MissingMerchantLinkModal: React.FC<MissingMerchantLinkModalProps> = ({
  isOpen,
  onClose,
  onGoToSettings,
  customMessage,
}) => {
  const router = useRouter();
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  if (!isOpen) return null;

  const handleGoToSettings = () => {
    onClose();
    if (onGoToSettings) {
      onGoToSettings();
    } else {
      router.push('/settings?tab=khqr');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#FAF8F5] border border-[#DDD5C5] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 text-stone-900 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
              <CreditCard className="w-6 h-6 text-amber-800" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider mb-1">
                {isKm ? 'ការទូទាត់ប្រាក់ KHQR' : 'KHQR Payment'}
              </span>
              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                {isKm ? 'មិនទាន់បានភ្ជាប់ ABA Merchant Link' : 'ABA Merchant Link Not Connected'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-200/70 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
          <p>
            {customMessage ||
              (isKm
                ? 'លោកអ្នកមិនទាន់បានបញ្ចូល ABA Merchant Link ក្នុងប្រព័ន្ធនៅឡើយទេ។ ដើម្បីអាចបង្កើត Dynamic KHQR និងទទួលការទូទាត់ប្រាក់ពីអ្នកជំងឺចូលគណនីគ្លីនិករបស់លោកអ្នកផ្ទាល់បាន សូមភ្ជាប់តំណភ្ជាប់ ABA Merchant Link ជាមុនសិន។'
                : 'You have not connected your ABA Merchant Link yet. To generate dynamic KHQR codes and receive patient payments directly into your clinic account, please connect your ABA Merchant Link first.')}
          </p>

          {/* Quick 3-Step Instruction Box */}
          <div className="bg-[#EFE9DF] border border-[#D9D0C0] p-4 rounded-2xl space-y-2 text-[11px] text-stone-700">
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-teal-800 shrink-0" />
              <span>
                {isKm
                  ? 'របៀបយកតំណភ្ជាប់ឥតគិតថ្លៃក្នុង ABA Mobile App:'
                  : 'How to get your free link in ABA Mobile App:'}
              </span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-stone-600 pl-1">
              <li>
                {isKm
                  ? 'បើកកម្មវិធី ABA Mobile App ចូលទៅកាន់ Services រួចជ្រើសរើស ABA Merchant / PayWay'
                  : 'Open ABA Mobile App, go to Services and choose ABA Merchant / PayWay'}
              </li>
              <li>
                {isKm
                  ? 'ចម្លងយក Merchant Payment Link របស់អ្នក ឧទាហរណ៍ https://link.payway.com.kh/...'
                  : 'Copy your Merchant Payment Link, for example https://link.payway.com.kh/...'}
              </li>
              <li>
                {isKm
                  ? 'ចូលទៅកាន់ Settings - ការកំណត់ ក្នុងផ្ទាំង KHQR Integration រួច Paste និងចុច Save'
                  : 'Go to Settings page in KHQR Integration tab, paste the link and click Save'}
              </li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-[#EAE3D4] flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors cursor-pointer text-center"
          >
            {isKm ? 'បិទ' : 'Close'}
          </button>

          <button
            type="button"
            onClick={handleGoToSettings}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isKm ? 'ទៅកាន់ទំព័រភ្ជាប់ Link ឥឡូវនេះ' : 'Go to Connect Link Now'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
