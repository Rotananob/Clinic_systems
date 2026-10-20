'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../context/I18nContext';
import {
  QrCode,
  Volume2,
  Printer,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Building2,
  Users,
} from 'lucide-react';

export const LandingHero: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [activeTab, setActiveTab] = useState<'khqr' | 'voice' | 'receipt'>('khqr');
  const [countdown, setCountdown] = useState(172);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 180));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
      {/* Background radial highlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-teal-100/40 to-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EAE0] border border-[#DFD6C6] text-stone-800 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            <span>
              {isKm
                ? 'វេទិកា PaaS វេជ្ជសាស្ត្រជំនាន់ថ្មី • ភ្ជាប់ជាមួយ KHQR Bakong & ABA PayWay'
                : 'Next-Gen Medical PaaS • Direct Bakong & ABA PayWay KHQR'}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight md:leading-tight">
            {isKm
              ? 'ប្រព័ន្ធគ្រប់គ្រងគ្លីនិក និងទូទាត់ប្រាក់ KHQR ទំនើបឈានមុខគេនៅកម្ពុជា'
              : 'Enterprise Clinic Management & KHQR PayWay Platform for Cambodia'}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto">
            {isKm
              ? 'ដំណោះស្រាយវេជ្ជសាស្ត្រ All-in-One សម្រាប់គ្លីនិកឯកជន និងមន្ទីរសម្រាកព្យាបាលទូទាំងប្រទេសកម្ពុជា៖ បង្កើត Dynamic KHQR ក្នុង ២ វិនាទី, ហៅអ្នកជំងឺជាសំឡេងខ្មែរ, គ្រប់គ្រងស្តុកឱសថ, និងបាញ់ដំណឹង Telegram Topics ស្វ័យប្រវត្ត។'
              : 'Complete SaaS solution for private clinics and polyclinics in Cambodia: 2-second dynamic Tag 01=12 KHQR generation, Khmer voice queue announcement, automated inventory, and multi-channel Telegram forum topics.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all hover:shadow-lg active:scale-95"
            >
              <span>{isKm ? 'សាកល្បងប្រើប្រាស់ឥតគិតថ្លៃ' : 'Start 14-Day Free Trial'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-stone-800 border border-[#DFD6C6] rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <Users className="w-4 h-4 text-stone-600" />
              <span>{isKm ? 'ចូលប្រើប្រាស់ប្រព័ន្ធ (Sign In)' : 'Sign In to Portal'}</span>
            </Link>
          </div>

          {/* Trust points */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-[#EAE3D5] text-left">
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EBE4D6]">
              <div className="text-lg font-extrabold text-teal-800">2s Speed</div>
              <div className="text-[11px] text-stone-500 font-medium">
                {isKm ? 'បង្កើត Dynamic KHQR' : 'Instant KHQR Tag 01=12'}
              </div>
            </div>
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EBE4D6]">
              <div className="text-lg font-extrabold text-teal-800">100% Direct</div>
              <div className="text-[11px] text-stone-500 font-medium">
                {isKm ? 'លុយចូលកុងគ្លីនិកផ្ទាល់' : 'Direct Clinic Bank Account'}
              </div>
            </div>
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EBE4D6]">
              <div className="text-lg font-extrabold text-teal-800">100% Isolated</div>
              <div className="text-[11px] text-stone-500 font-medium">
                {isKm ? 'ទិន្នន័យដាច់ដោយឡែក' : 'Multi-Tenant Data Privacy'}
              </div>
            </div>
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EBE4D6]">
              <div className="text-lg font-extrabold text-teal-800">Offline-First</div>
              <div className="text-[11px] text-stone-500 font-medium">
                {isKm ? 'ដំណើរការទោះដាច់អ៊ីនធឺណិត' : 'IndexedDB Local Cache'}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Live Simulator Preview Card */}
        <div className="mt-14 max-w-4xl mx-auto bg-[#FDFBF7] rounded-3xl border border-[#E3DBCB] shadow-xl overflow-hidden">
          {/* Card Top Tabs */}
          <div className="flex items-center justify-between border-b border-[#E7DFCF] bg-[#F7F2E7] px-4 py-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              <span className="text-xs font-semibold text-stone-500 ml-2 hidden sm:inline">
                Live Interactive Architecture Preview
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#ECE5D8] p-1 rounded-xl text-xs font-semibold text-stone-700">
              <button
                type="button"
                onClick={() => setActiveTab('khqr')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'khqr'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{isKm ? 'Dynamic KHQR' : 'Dynamic KHQR'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'voice'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isKm ? 'សំឡេងហៅអ្នកជំងឺ' : 'Voice Queue'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('receipt')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'receipt'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isKm ? 'វិក្កយបត្រ 80mm' : '80mm POS Slip'}</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Dynamic KHQR Simulator */}
          {activeTab === 'khqr' && (
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#FAF7F2]">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  <Zap className="w-3.5 h-3.5 text-teal-700" />
                  <span>EMVCo Tag 01=12 Dynamic Payload</span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-stone-900">
                    {isKm ? 'ទូទាត់ប្រាក់រហ័សគ្រប់ធនាគារ' : 'Seamless KHQR Settlement'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    {isKm
                      ? 'ប្រព័ន្ធ Generate Dynamic QR ជាមួយចំនួនទឹកប្រាក់ជាក់លាក់ និងលេខវិក្កយបត្រ ដោយស្វ័យប្រវត្ត គាំទ្ររាល់ App ធនាគារក្នុងប្រទេសកម្ពុជា។'
                      : 'Real-time generated dynamic QR containing exact invoice amount and bill numbers. Supports 1-click mobile deep linking.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E6E0D2] shadow-2xs space-y-2 text-xs">
                  <div className="flex justify-between items-center text-stone-500">
                    <span>{isKm ? 'លេខវិក្កយបត្រ' : 'Invoice Ref:'}</span>
                    <span className="font-mono font-bold text-stone-800">#INV-2026-0881</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-500">
                    <span>{isKm ? 'អ្នកជំងឺ' : 'Patient:'}</span>
                    <span className="font-semibold text-stone-800">ចាន់ ដារ៉ា (P-0012)</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-500">
                    <span>{isKm ? 'គ្លីនិកទទួលប្រាក់' : 'Merchant Destination:'}</span>
                    <span className="font-semibold text-stone-800">Rotana Medical Center</span>
                  </div>
                  <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-sm font-bold text-stone-900">
                    <span>{isKm ? 'ទឹកប្រាក់ត្រូវទូទាត់' : 'Total Payable:'}</span>
                    <span className="text-teal-800 font-mono text-base">$15.00 (61,500 ៛)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-stone-500">
                    {isKm ? 'គាំទ្រកម្មវិធីធនាគារ:' : 'Supported Mobile Apps:'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAE2D2] text-stone-800">
                    ABA Mobile
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAE2D2] text-stone-800">
                    Bakong App
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAE2D2] text-stone-800">
                    Acleda / Wing
                  </span>
                </div>
              </div>

              {/* QR Preview Graphic */}
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#E3DC CE] shadow-sm relative">
                <div className="w-48 h-48 bg-stone-900 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden text-center text-white">
                  {/* Decorative Simulated QR matrix */}
                  <div className="w-full h-full border-2 border-dashed border-teal-400/40 rounded flex flex-col items-center justify-center p-2 bg-stone-950">
                    <QrCode className="w-28 h-28 text-white stroke-1" />
                    <span className="text-[10px] font-mono text-teal-400 mt-1">KHQR DYNAMIC 01=12</span>
                  </div>
                </div>

                {/* Live Countdown & Listening status */}
                <div className="mt-4 flex items-center gap-2 text-xs text-stone-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    {isKm ? 'កំពុងរង់ចាំការទូទាត់...' : 'Listening for real-time settlement...'}
                  </span>
                  <span className="font-mono text-stone-800 font-bold ml-1">({countdown}s)</span>
                </div>

                {/* 1-Click Deep link buttons */}
                <div className="grid grid-cols-2 gap-2 w-full mt-4">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#005777] text-white text-xs font-bold hover:bg-[#004761] transition-colors"
                  >
                    <span>ABA Mobile</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#D61B22] text-white text-xs font-bold hover:bg-[#B3141A] transition-colors"
                  >
                    <span>Bakong App</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Voice Queue Calling Simulator */}
          {activeTab === 'voice' && (
            <div className="p-6 sm:p-8 bg-[#FAF7F2] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  <Volume2 className="w-3.5 h-3.5 text-amber-800" />
                  <span>Khmer Speech Audio Synthesis Engine</span>
                </div>

                <h3 className="text-xl font-bold text-stone-900">
                  {isKm ? 'ប្រព័ន្ធហៅអ្នកជំងឺជាសំឡេងខ្មែរស្វ័យប្រវត្ត' : 'Automated Khmer Audio Queue'}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {isKm
                    ? 'គ្រាន់តែចុច Call លើផ្ទាំងគ្រូពេទ្យ ប្រព័ន្ធនឹងបន្លឺសំឡេងហៅឈ្មោះ និងបន្ទប់ពិគ្រោះជាភាសាខ្មែរយ៉ាងច្បាស់លាស់ ទៅកាន់ Speaker ក្នុងបន្ទប់រង់ចាំ។'
                    : '1-click calling announces patient number, patient name, and doctor consultation room in crystal clear native Khmer speech.'}
                </p>

                <div className="p-4 rounded-2xl bg-white border border-[#E6E0D2] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{isKm ? 'បន្ទប់ពិគ្រោះ' : 'Consulting Room:'}</span>
                    <span className="font-bold text-stone-900">បន្ទប់លេខ ១ (Room 01)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{isKm ? 'វេជ្ជបណ្ឌិត' : 'Doctor in Charge:'}</span>
                    <span className="font-bold text-stone-900">វេជ្ជ. ហួន វណ្ណៈ (Houn Vannak)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{isKm ? 'ស្ថានភាពជួរ' : 'Queue State:'}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      IN_CONSULTATION
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Audio Call Screen */}
              <div className="p-6 bg-stone-900 rounded-2xl text-white flex flex-col items-center justify-center text-center space-y-4 shadow-sm border border-stone-800">
                <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center animate-pulse">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-teal-400 tracking-wider uppercase">
                    Now Calling Patient
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight mt-1 text-white">
                    # 0 0 1 2
                  </div>
                  <div className="text-sm font-bold text-stone-300 mt-1">
                    លោក ចាន់ ដារ៉ា (Chan Dara)
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    សូមអញ្ជើញចូលបន្ទប់ពិគ្រោះលេខ ១
                  </div>
                </div>

                {/* Simulated Waveform */}
                <div className="flex items-center gap-1 h-6">
                  <span className="w-1 bg-teal-400 rounded-full h-3 animate-pulse" />
                  <span className="w-1 bg-teal-400 rounded-full h-5 animate-pulse" style={{ animationDelay: '0.1s' }} />
                  <span className="w-1 bg-teal-400 rounded-full h-6 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1 bg-teal-400 rounded-full h-4 animate-pulse" style={{ animationDelay: '0.3s' }} />
                  <span className="w-1 bg-teal-400 rounded-full h-2 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: 80mm POS Slip Simulator */}
          {activeTab === 'receipt' && (
            <div className="p-6 sm:p-8 bg-[#FAF7F2] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                  <Printer className="w-3.5 h-3.5 text-blue-800" />
                  <span>Direct ESC/POS Hardware Ready</span>
                </div>

                <h3 className="text-xl font-bold text-stone-900">
                  {isKm ? 'បោះពុម្ពវិក្កយបត្រ 80mm រហ័ស និងបើកថតប្រាក់' : '80mm Thermal Receipt Slip Engine'}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {isKm
                    ? 'ប្រព័ន្ធគាំទ្រការបោះពុម្ពវិក្កយបត្រតាមម៉ាស៊ីន Thermal 80mm (USB/Network/Bluetooth) និងបញ្ជាបើកថតប្រាក់ Cash Drawer ដោយស្វ័យប្រវត្ត។'
                    : 'Zero-driver network printing to 80mm ESC/POS hardware with Pin 2/5 cash drawer trigger pulse.'}
                </p>

                <div className="p-3 bg-white rounded-xl border border-[#E6E0D2] text-xs space-y-1.5 text-stone-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isKm ? 'គាំទ្រអក្សរខ្មែរ Unicode 100%' : '100% Native Khmer Unicode'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isKm ? 'ភ្ជាប់ QR កូដពិនិត្យវិក្កយបត្រ' : 'Includes Verification QR Code'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isKm ? 'កំណត់ Header & Logo គ្លីនិកបាន' : 'Customizable Clinic Logo & Moh License'}</span>
                  </div>
                </div>
              </div>

              {/* Receipt Visualizer */}
              <div className="flex justify-center">
                <div className="w-64 bg-white p-5 rounded-lg border border-stone-300 shadow-sm font-mono text-[11px] text-stone-800 space-y-3">
                  <div className="text-center border-b border-dashed border-stone-300 pb-2">
                    <div className="font-bold text-xs uppercase">ROTANA MEDICAL CENTER</div>
                    <div className="text-[10px] text-stone-500">Tel: 012 334 455</div>
                    <div className="text-[10px] text-stone-500">MoH License: 2026/8841</div>
                  </div>

                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>Inv: #INV-2026-0881</span>
                      <span>16:42</span>
                    </div>
                    <div>Patient: Chan Dara (P-0012)</div>
                  </div>

                  <div className="border-t border-b border-dashed border-stone-300 py-1.5 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>1x Medical Consultation</span>
                      <span>$5.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2x Amoxicillin 500mg</span>
                      <span>$6.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1x Paracetamol 500mg</span>
                      <span>$4.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold text-xs">
                    <span>TOTAL:</span>
                    <span>$15.00 (61,500 R)</span>
                  </div>

                  <div className="text-center pt-1 border-t border-dashed border-stone-300 text-[10px] text-stone-500">
                    Paid via KHQR Dynamic (ABA PayWay)
                    <div className="font-bold text-emerald-700 mt-0.5">PAID / SETTLED</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
