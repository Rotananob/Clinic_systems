'use client';

import React from 'react';
import { AlertTriangle, Sparkles, Trash2, X, ShieldAlert, ArrowRight, Download } from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';

interface PatientQuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  maxLimit: number;
  planTier: string;
  onOpenUpgrade: () => void;
  onOpenDeleteManager: () => void;
  onExportCsv?: () => void;
}

export const PatientQuotaExceededModal: React.FC<PatientQuotaExceededModalProps> = ({
  isOpen,
  onClose,
  currentCount,
  maxLimit,
  planTier,
  onOpenUpgrade,
  onOpenDeleteManager,
  onExportCsv,
}) => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  if (!isOpen) return null;

  const planName =
    planTier === 'FREE'
      ? (isKm ? 'គម្រោងសាកល្បង - Free Starter' : 'Free Starter Plan')
      : planTier === 'STARTER_5'
      ? (isKm ? 'គម្រោងស្ដង់ដារ - Clinic Starter 5$/mo' : 'Clinic Starter $5/mo')
      : planTier === 'PRO_8'
      ? (isKm ? 'គម្រោងវិជ្ជាជីវៈ - Polyclinic Pro 8$/mo' : 'Polyclinic Pro $8/mo')
      : planTier;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 sm:p-7 space-y-6 relative overflow-hidden">
        {/* Top close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              {isKm ? 'កម្រិតកំណត់គណនីពេញ' : 'ACCOUNT QUOTA REACHED'}
            </span>
            <h2 className="text-lg font-bold text-stone-900 mt-1">
              {isKm ? 'កម្រិតកំណត់អ្នកជំងឺពេញ' : 'Patient Account Limit Reached'}
            </h2>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              {planName}: {currentCount.toLocaleString()} / {maxLimit.toLocaleString()} {isKm ? 'នាក់' : 'patients'}
            </p>
          </div>
        </div>

        {/* Informative Explanation */}
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          {isKm
            ? `លោកអ្នកបានចុះឈ្មោះអ្នកជំងឺដល់កម្រិតកំណត់អតិបរមា ${maxLimit.toLocaleString()} នាក់នៃគម្រោងរបស់អ្នកហើយ។ ដើម្បីអាចចុះឈ្មោះអ្នកជំងឺថ្មីបន្តទៀត លោកអ្នកមានជម្រើស ២ ដូចខាងក្រោម៖`
            : `You have reached your maximum limit of ${maxLimit.toLocaleString()} registered patients for this account. To register new patients, please choose one of the options below:`}
        </p>

        {/* Two Options */}
        <div className="space-y-3">
          {/* Option 1: Upgrade Plan */}
          <div className="p-4 rounded-2xl border-2 border-teal-800 bg-teal-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-950 uppercase tracking-wide">
                {isKm ? 'ជម្រើសទី ១ - ដំឡើងគម្រោងសេវាកម្ម' : 'Option 1: Upgrade Plan'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-800 text-white">
                {isKm ? 'ណែនាំ' : 'Recommended'}
              </span>
            </div>
            <p className="text-xs text-teal-900">
              {planTier === 'PRO_8'
                ? (isKm
                    ? 'ដំឡើងទៅគម្រោង Hospital Enterprise ១២$/ខែ ដើម្បីទទួលបានការចុះឈ្មោះអ្នកជំងឺមិនកំណត់ចំនួន។'
                    : 'Upgrade to Hospital Enterprise $12/mo for unlimited patient registration.')
                : (isKm
                    ? 'ដំឡើងទៅគម្រោងបន្ទាប់ ដើម្បីទទួលបានកូតាចុះឈ្មោះអ្នកជំងឺបន្ថែមរហូតដល់ ៨,០០០ នាក់ ឬមិនកំណត់។'
                    : 'Upgrade to next tier to unlock up to 8,000 patients or unlimited registration.')}
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenUpgrade();
              }}
              className="w-full mt-1 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isKm ? 'ដំឡើងគម្រោងឥឡូវនេះ' : 'Upgrade Plan Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Option 2: Delete Old Patients */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-[#FAF7F2] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                {isKm ? 'ជម្រើសទី ២ - លុបទិន្នន័យចាស់ដែលលែងប្រើ' : 'Option 2: Delete Inactive Patient Records'}
              </span>
              <span className="text-[10px] text-stone-500 font-mono">
                {isKm ? 'លុបម្ដង ១ ឬដល់ ១០ នាក់' : 'Delete 1 to 10 at once'}
              </span>
            </div>
            <p className="text-xs text-stone-600">
              {isKm
                ? 'ប្រសិនបើលោកអ្នកមិនចង់ដំឡើងគម្រោងទេ លោកអ្នកអាចលុបទិន្នន័យអ្នកជំងឺចាស់ៗដែលលែងមកពិនិត្យចេញពីប្រព័ន្ធ ដើម្បីទុកកន្លែងទំនេរសម្រាប់អ្នកជំងឺថ្មី។'
                : 'If you prefer not to upgrade, you can delete old or inactive patient records to free up quota.'}
            </p>
            <div className="flex items-center gap-2 pt-1">
              {onExportCsv && (
                <button
                  type="button"
                  onClick={onExportCsv}
                  className="py-2 px-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>{isKm ? 'Export CSV ជាមុន' : 'Backup to CSV First'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDeleteManager();
                }}
                className="flex-1 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isKm ? 'ជ្រើសរើសអ្នកជំងឺដើម្បីលុប' : 'Select Patients to Delete'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Critical Permanent Loss Warning Banner */}
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-800">
            <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{isKm ? 'ការព្រមានសំខាន់អំពីការលុបទិន្នន័យ' : 'CRITICAL PERMANENT ERASURE NOTICE'}</span>
          </div>
          <p className="text-[11px] text-rose-800/90 leading-relaxed">
            {isKm
              ? 'ការព្រមានសំខាន់៖ សកម្មភាពលុបនេះ គឺលុបទិន្នន័យអ្នកជំងឺជាអចិន្ត្រៃយ៍ចេញពី Database របស់យើងជារៀងរហូត។ សូមប្រាកដថាអ្នកបាន Export ទាញយកឯកសារ Excel ឬកត់ត្រាទុកនៅក្រៅរួចរាល់ មុនពេលសម្រេចចិត្តលុប។'
              : 'Important Notice: Deleting patient records permanently erases them from our database forever. Ensure you have exported an Excel/CSV backup or copied notes externally before confirming deletion.'}
          </p>
        </div>
      </div>
    </div>
  );
};
