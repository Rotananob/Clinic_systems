'use client';

import { QRCodeSVG } from 'qrcode.react';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Building2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Stethoscope,
  Globe,
  Link as LinkIcon,
  HelpCircle,
  QrCode,
  RefreshCw,
} from 'lucide-react';

interface FirstTimeClinicSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const CLINIC_SPECIALTIES = [
  {
    id: 'General Medical Clinic',
    nameKh: 'គ្លីនិកទូទៅ & វេជ្ជសាស្ត្រគ្រួសារ (General Practice)',
    nameEn: 'General Medical Clinic',
    descKh: 'ពិគ្រោះជំងឺទូទៅ កត់ត្រា SOAP និងចេញវេជ្ជបញ្ជា',
  },
  {
    id: 'Dental & Oral Surgery Clinic',
    nameKh: 'គ្លីនិកទន្តសាស្ត្រ & ធ្មេញ (Dental & Oral Surgery)',
    nameEn: 'Dental & Oral Surgery Clinic',
    descKh: 'គំនូសធ្មេញ Odontogram ៣២ គ្រាប់ និងផែនការព្យាបាលធ្មេញ',
  },
  {
    id: 'Pharmacy & Community Drugstore',
    nameKh: 'ឱសថស្ថាន & ហាងលក់ថ្នាំ (Pharmacy & Drugstore)',
    nameEn: 'Pharmacy & Community Drugstore',
    descKh: 'គ្រប់គ្រងស្តុកឱសថ បើកថ្នាំ និងគិតលុយ KHQR POS',
  },
  {
    id: 'Polyclinic & Outpatient Center',
    nameKh: 'មន្ទីរសម្រាកព្យាបាល & ពហុព្យាបាល (Polyclinic)',
    nameEn: 'Polyclinic & Outpatient Center',
    descKh: 'ពហុឯកទេស មានគ្រែសម្រាក និងបន្ទប់ពិគ្រោះច្រើន',
  },
  {
    id: 'Pediatric & Child Health',
    nameKh: 'គ្លីនិកកុមារ & វ៉ាក់សាំង (Pediatrics)',
    nameEn: 'Pediatric & Child Health',
    descKh: 'វ៉ាក់សាំងកុមារ បន្ទាត់លូតលាស់ WHO និងកម្រិតថ្នាំតាមគីឡូ',
  },
  {
    id: "Maternity & Women's Health",
    nameKh: "គ្លីនិកសម្ភព & រោគស្ត្រី (Maternity & Women's Health)",
    nameEn: "Maternity & Women's Health",
    descKh: 'តាមដានផ្ទៃពោះ ANC គណនាថ្ងៃសម្រាល និងរូបភាពអេកូ',
  },
  {
    id: 'Dermatology & Aesthetic Clinic',
    nameKh: 'គ្លីនិកសើស្បែក & សម្រស់ (Dermatology)',
    nameEn: 'Dermatology & Aesthetic Clinic',
    descKh: 'ព្យាបាលជំងឺសើស្បែក ឡាស៊ែរ និងសេវាកម្មសម្រស់',
  },
  {
    id: 'Eye & ENT Specialty Clinic',
    nameKh: 'គ្លីនិកចក្ខុរោគ & ច្រមុះបំពង់ក (Eye & ENT)',
    nameEn: 'Eye & ENT Specialty Clinic',
    descKh: 'ពិនិត្យភ្នែក វាស់កម្រិតគំហើញ និងជំងឺត្រចៀក ច្រមុះ បំពង់ក',
  },
];

export const FirstTimeClinicSetupModal: React.FC<FirstTimeClinicSetupModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const router = useRouter();
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const { user, refreshProfile } = useAuth();

  const [clinicNameKh, setClinicNameKh] = useState(user?.tenant?.clinicNameKh || '');
  const [clinicNameEn, setClinicNameEn] = useState(
    user?.tenant?.clinicNameEn && user.tenant.clinicNameEn !== 'New Clinic'
      ? user.tenant.clinicNameEn
      : ''
  );
  const [clinicType, setClinicType] = useState(
    user?.tenant?.clinicType || 'General Medical Clinic'
  );
  const [paywayPaymentUrl, setPaywayPaymentUrl] = useState(
    user?.tenant?.paywayPaymentUrl || ''
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testingKhqr, setTestingKhqr] = useState(false);
  const [testKhqrResult, setTestKhqrResult] = useState<any | null>(null);
  const [testKhqrError, setTestKhqrError] = useState<string | null>(null);

  const handleTestKhqr = async () => {
    if (!paywayPaymentUrl.trim()) {
      setTestKhqrError(
        isKm
          ? 'សូមបញ្ចូល ABA Merchant Link មុននឹងតេស្តបង្កើត QR'
          : 'Please enter your ABA Merchant Link first.'
      );
      return;
    }
    setTestingKhqr(true);
    setTestKhqrError(null);
    try {
      const res = await api.tenants.testMerchantKhqr({
        paywayPaymentUrl: paywayPaymentUrl.trim(),
        merchantName: clinicNameEn.trim() || undefined,
        merchantCity: 'Phnom Penh',
      });
      if (res.success) {
        setTestKhqrResult(res);
      }
    } catch (err: any) {
      setTestKhqrError(err.message || 'Failed to generate test KHQR.');
    } finally {
      setTestingKhqr(false);
    }
  };

  if (!isOpen) return null;

  // Live slug generation
  const liveSlug = clinicNameEn
    ? clinicNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'clinic'
    : 'your-clinic';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!clinicNameKh.trim()) {
      setErrorMsg(
        isKm
          ? 'សូមបញ្ចូលឈ្មោះគ្លីនិកជាភាសាខ្មែរ។'
          : 'Please enter your clinic name in Khmer.'
      );
      return;
    }

    if (!clinicNameEn.trim()) {
      setErrorMsg(
        isKm
          ? 'សូមបញ្ចូលឈ្មោះគ្លីនិកជាអក្សរឡាតាំង (English)។'
          : 'Please enter your clinic name in English.'
      );
      return;
    }

    if (!paywayPaymentUrl.trim()) {
      setErrorMsg(
        isKm
          ? 'សូម Paste តំណភ្ជាប់ ABA Merchant Link ដើម្បីដំណើរការប្រព័ន្ធបង់ប្រាក់ KHQR។'
          : 'Please paste your ABA Merchant Link to activate dynamic KHQR payments.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await api.tenants.updateProfile({
        clinicNameKh: clinicNameKh.trim(),
        clinicNameEn: clinicNameEn.trim(),
        clinicType,
        paywayPaymentUrl: paywayPaymentUrl.trim(),
        merchantName: clinicNameEn.trim(),
      });

      if (res.success) {
        // Synchronize local session
        try {
          const userStr = localStorage.getItem('clinic_user');
          if (userStr) {
            const parsed = JSON.parse(userStr);
            parsed.tenant = {
              ...(parsed.tenant || {}),
              ...res.tenant,
              isOnboarded: true,
            };
            localStorage.setItem('clinic_user', JSON.stringify(parsed));
          }
        } catch {}

        await refreshProfile();
        onComplete();

        // Redirect based on specialty
        const typeLower = clinicType.toLowerCase();
        if (typeLower.includes('dental') || typeLower.includes('ធ្មេញ')) {
          router.push('/dental');
        } else if (typeLower.includes('pharmacy') || typeLower.includes('ឱសថ')) {
          router.push('/prescriptions');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete clinic setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#FDFBF7] rounded-3xl shadow-2xl border border-[#E7E1D4] z-10 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E7E1D4] bg-[#F7F3EA] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-stone-900 text-lg">X-Clinic</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold border border-teal-200 font-mono">
                  Initial Setup
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {isKm
                  ? 'រៀបចំ និងដំណើរការគ្លីនិករបស់អ្នកលើ X-Clinic ត្រឹមតែ ១ នាទី'
                  : 'Configure clinic identity and paste your free ABA Merchant link in 1 minute'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 touch-scroll flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Clinic Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-[#EAE3D4]">
              <span className="w-6 h-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-sm font-bold text-stone-900">
                {isKm ? 'ព័ត៌មានអត្តសញ្ញាណគ្លីនិក' : 'Clinic Identity & Brand Name'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {isKm ? 'ឈ្មោះគ្លីនិកជាភាសាខ្មែរ' : 'Clinic Name (Khmer)'} *
                </label>
                <input
                  type="text"
                  required
                  value={clinicNameKh}
                  onChange={(e) => setClinicNameKh(e.target.value)}
                  placeholder="ឧ. គ្លីនិកពិគ្រោះព្យាបាលជំងឺទូទៅ និងសម្ភព..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#DDD5C5] rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-teal-700 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {isKm ? 'ឈ្មោះគ្លីនិកជាអក្សរឡាតាំង (English)' : 'Clinic Name (English)'} *
                </label>
                <input
                  type="text"
                  required
                  value={clinicNameEn}
                  onChange={(e) => setClinicNameEn(e.target.value)}
                  placeholder="e.g. Central Care Polyclinic"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#DDD5C5] rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-teal-700 shadow-2xs"
                />
                <div className="mt-1 text-[11px] text-stone-500 font-mono flex items-center gap-1">
                  <span>Subdomain:</span>
                  <span className="font-semibold text-teal-800">{liveSlug}.clinic.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Clinic Specialty Classification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#EAE3D4]">
              <span className="w-6 h-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-sm font-bold text-stone-900">
                {isKm ? 'ជ្រើសរើសប្រភេទឯកទេសគ្លីនិក' : 'Select Clinic Specialty'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CLINIC_SPECIALTIES.map((spec) => {
                const isSelected = clinicType === spec.id;
                return (
                  <div
                    key={spec.id}
                    onClick={() => setClinicType(spec.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-700 shadow-xs'
                        : 'bg-white border-[#E7E1D4] hover:border-[#D5CDBD]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">
                        {isKm ? spec.nameKh : spec.nameEn}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-teal-800 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                      {isKm ? spec.descKh : spec.nameEn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: ABA Free Merchant Link (PayWay KHQR) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#EAE3D4]">
              <span className="w-6 h-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-sm font-bold text-stone-900">
                {isKm ? 'ភ្ជាប់ ABA Merchant Link (ឥតគិតថ្លៃ)' : 'Connect Free ABA Merchant Link'}
              </h3>
            </div>

            {/* ABA Guide Instruction Box */}
            <div className="bg-[#F0EAE0] border border-[#DFD6C6] p-4 rounded-2xl space-y-2.5 text-xs text-stone-700">
              <div className="flex items-center gap-2 font-bold text-teal-900">
                <CreditCard className="w-4 h-4 text-teal-800" />
                <span>
                  {isKm
                    ? 'របៀបយក Link ឥតគិតថ្លៃក្នុង ABA Mobile App ត្រឹមតែ ១ នាទី:'
                    : 'How to get your free link in ABA Mobile app in 1 minute:'}
                </span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-stone-600 pl-1 leading-relaxed">
                <li>{isKm ? 'បើកកម្មវិធី ABA Mobile App លើទូរស័ព្ទដៃរបស់អ្នក' : 'Open ABA Mobile App on your phone'}</li>
                <li>{isKm ? 'ចូលទៅកាន់ Services រួចជ្រើសរើស ABA Merchant / PayWay' : 'Go to Services and select ABA Merchant / PayWay'}</li>
                <li>
                  {isKm
                    ? 'ចម្លងយក Merchant Payment Link របស់អ្នក (ឧ. https://link.payway.com.kh/...) រួច Paste ក្នុងប្រអប់ខាងក្រោម'
                    : 'Copy your Merchant Payment Link (e.g. https://link.payway.com.kh/...) and paste below'}
                </li>
              </ol>
              <div className="pt-1 text-[11px] text-emerald-800 font-medium">
                {isKm
                  ? 'គ្រាន់តែ Paste Link នេះ ប្រព័ន្ធ X-Clinic នឹង generate Dynamic KHQR ជូនគ្លីនិកភ្លាមៗស្របតាម Plan Limit របស់លោកអ្នក។'
                  : 'With just this link, X-Clinic automatically generates dynamic KHQR codes according to your plan limit.'}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  {isKm ? 'តំណភ្ជាប់ ABA Merchant Link (PayWay URL)' : 'ABA Merchant Link (PayWay URL)'} *
                </label>
                <button
                  type="button"
                  onClick={handleTestKhqr}
                  disabled={testingKhqr || !paywayPaymentUrl.trim()}
                  className="px-2.5 py-1 rounded-lg bg-teal-800 hover:bg-teal-900 disabled:bg-stone-200 disabled:text-stone-400 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                >
                  {testingKhqr ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <QrCode className="w-3 h-3" />
                  )}
                  <span>{isKm ? 'តេស្តបង្កើត QR ភ្លាមៗ' : 'Test Generate QR'}</span>
                </button>
              </div>

              <div className="relative">
                <LinkIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="url"
                  required
                  value={paywayPaymentUrl}
                  onChange={(e) => {
                    setPaywayPaymentUrl(e.target.value);
                    if (testKhqrResult) setTestKhqrResult(null);
                  }}
                  placeholder="https://link.payway.com.kh/ABAPAY..."
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#DDD5C5] rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-teal-700 font-mono shadow-2xs"
                />
              </div>

              {testKhqrError && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{testKhqrError}</span>
                </div>
              )}

              {testKhqrResult && (
                <div className="mt-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-teal-300 flex flex-col sm:flex-row items-center gap-3.5 shadow-xs">
                  <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-xs shrink-0">
                    <QRCodeSVG
                      value={testKhqrResult.qrString}
                      size={110}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-xs space-y-1 text-stone-700 flex-1">
                    <div className="flex items-center gap-1 text-emerald-800 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isKm ? 'Dynamic KHQR Tag 01=12 ត្រឹមត្រូវ' : 'Tag 01=12 Dynamic KHQR Verified'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-600">{isKm ? 'Merchant: ' : 'Merchant: '}</span>
                      <span className="font-bold text-stone-900">{testKhqrResult.merchantName}</span>
                    </div>
                    {testKhqrResult.liveGateway && (
                      <div className="text-[10px] text-teal-800 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                        <span>{isKm ? 'ភ្ជាប់ពី ABA PayWay Live Gateway (ស្កេនបានពិតៗ)' : 'Live ABA PayWay Gateway (100% Scannable)'}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-stone-500 font-mono">
                      <span>$1.00 USD</span>
                      {testKhqrResult.tranId && <span> • TranID: {testKhqrResult.tranId}</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-4 border-t border-[#E7E1D4] flex items-center justify-between">
            <span className="text-xs text-stone-500">
              {isKm ? 'គ្លីនិកនឹងដំណើរការភ្លាមៗក្រោយចុច Save' : 'Instant workspace activation on save'}
            </span>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>{loading ? (isKm ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKm ? 'រក្សាទុក & ចាប់ផ្តើមប្រើប្រាស់ X-Clinic' : 'Save & Launch X-Clinic')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
