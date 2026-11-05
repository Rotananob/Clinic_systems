'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { PublicNavbar } from '../../components/landing/PublicNavbar';
import { PublicFooter } from '../../components/landing/PublicFooter';
import { SubscriptionCheckoutModal } from '../../components/subscriptions/SubscriptionCheckoutModal';
import {
  Database,
  Server,
  Network,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Building2,
  Lock,
  Boxes,
  CreditCard,
  QrCode,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Clock,
} from 'lucide-react';

export default function PaasEnterprisePage() {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const { user } = useAuth();
  const currentPlanTier = user?.tenant?.planTier || 'FREE';

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE] text-stone-900 selection:bg-teal-800 selection:text-white font-sans antialiased">
      <PublicNavbar />

      {/* Enterprise SLA Trust Banner */}
      <div className="bg-[#FAF7F2] border-b border-[#E7DFCF] py-2.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-stone-600 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-stone-800">
              {isKm ? 'ស្ថាបត្យកម្ម PaaS វេជ្ជសាស្ត្រថ្នាក់ជាតិ ២០២៦' : '2026 National Clinical PaaS Grid'}
            </span>
            <span className="hidden sm:inline text-stone-400">•</span>
            <span className="hidden sm:inline text-stone-600">
              {isKm
                ? 'ប្រព័ន្ធ Cloud Grid ដាច់ដោយឡែកសម្រាប់មន្ទីរពេទ្យធំ និងបណ្តាញពហុព្យាបាលសាខាច្រើន'
                : 'Dedicated Cloud Grid for hospital networks and multi-branch polyclinics'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-semibold text-stone-500">
            <div className="flex items-center gap-1 text-teal-900">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-800 shrink-0" />
              <span>99.99% Enterprise Uptime SLA</span>
            </div>
            <div className="flex items-center gap-1 text-teal-900">
              <Lock className="w-3.5 h-3.5 text-teal-800 shrink-0" />
              <span>Multi-Tenant Isolated Database</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* PaaS Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800 text-teal-100 text-xs font-bold shadow-2xs">
            <Network className="w-3.5 h-3.5 text-amber-300" />
            <span>{isKm ? 'KruPet Platform as a Service - PaaS' : 'KruPet Platform as a Service'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans">
            {isKm
              ? 'ហេដ្ឋារចនាសម្ព័ន្ធ Cloud វេជ្ជសាស្ត្រ គ្មានដែនកំណត់'
              : 'Unlimited Enterprise Clinical Cloud Infrastructure'}
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {isKm
              ? 'ពង្រីកសាខាមន្ទីរពេទ្យដោយមិនបាច់ចំណាយលើម៉ាស៊ីន Server រាប់ម៉ឺនដុល្លារ។ KruPet PaaS ផ្តល់ជូន Database ដាច់ដោយឡែក White-label Domain ផ្ទាល់ខ្លួន និងការធ្វើសមកាលកម្ម Merkle Fleet ដោយស្វ័យប្រវត្ត។'
              : 'Scale your hospital branches without tens of thousands of dollars in server capital expenditures. KruPet PaaS delivers dedicated databases, custom domains, and automatic Merkle fleet synchronization.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="px-6 py-3 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>{isKm ? 'ដំណើរការគម្រោង PaaS $20/ខែ' : 'Activate PaaS Tier ($20/mo)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/explore-tools"
              className="px-5 py-3 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold transition-all shadow-2xs"
            >
              {isKm ? 'រុករកឧបករណ៍ទាំង ៣០+' : 'Explore 30+ Tools'}
            </Link>
          </div>
        </div>

        {/* 4 Pillars of KruPet PaaS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-2xs">
              <Database className="w-5 h-5 text-teal-100" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 font-sans">
              {isKm ? '១. Database ដាច់ដោយឡែក' : '1. Isolated Database'}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {isKm
                ? 'ទិន្នន័យវេជ្ជសាស្ត្ររបស់អ្នកជំងឺត្រូវបានរក្សាទុកក្នុង Database ដាច់ដោយឡែកពីគេ ១០០% ការពារសុវត្ថិភាពទិន្នន័យខ្ពស់បំផុត ស្របតាមច្បាប់ MoH Cambodia។'
                : '100% tenant-isolated database instance ensuring strict patient health information privacy and audit compliance.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-2xs">
              <Server className="w-5 h-5 text-teal-100" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 font-sans">
              {isKm ? '២. White-label Domain ផ្ទាល់ខ្លួន' : '2. Custom White-Label Domain'}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {isKm
                ? 'ប្រើប្រាស់ឈ្មោះ Domain ផ្ទាល់ខ្លួនរបស់មន្ទីរពេទ្យ ដូចជា emr.yourhospital.com.kh ជាមួយវិញ្ញាបនបត្រ SSL និងផ្ទាំងគ្រប់គ្រងម៉ាកយីហោផ្ទាល់ខ្លួន។'
                : 'Run on your own branded domain with automated Let\'s Encrypt SSL certificates and hospital logo customization.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-2xs">
              <Network className="w-5 h-5 text-teal-100" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 font-sans">
              {isKm ? '៣. សមកាលកម្ម Merkle Fleet' : '3. Merkle Fleet Grid'}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {isKm
                ? 'ដំណើរការទោះគ្មានអ៊ីនធឺណិត Offline-First និងធ្វើសមកាលកម្មទិន្នន័យស្វ័យប្រវត្តរវាងមន្ទីរពេទ្យធំ និងសាខាតាមខេត្ត តាមក្បួន Merkle Vector LWW។'
                : 'Offline-first edge resilience with automatic multi-branch synchronization and Last-Write-Wins conflict resolution.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-2xs">
              <ShieldAlert className="w-5 h-5 text-teal-100" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 font-sans">
              {isKm ? '៤. ទូថ្នាំញៀន MoH DDF សាក្សីពីររូប' : '4. MoH Dual-Witness Narcotics'}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {isKm
                ? 'សៀវភៅកត់ត្រាការប្រើប្រាស់ថ្នាំញៀន Schedule II តម្រូវឱ្យមានគ្រូពេទ្យ និងឱសថការីពីររូបចុះហត្ថលេខាឌីជីថលទន្ទឹមគ្នា មិនអាចលុប ឬកែបន្លំបាន។'
                : 'Schedule II controlled substance register requiring dual-witness digital signoff with tamper-evident cryptographic hash chains.'}
            </p>
          </div>
        </div>

        {/* Traditional Capex vs KruPet PaaS Comparison Table */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-teal-900">
              {isKm ? 'ការប្រៀបធៀបថ្លៃដើម' : 'Cost & Capex Analysis'}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-sans">
              {isKm
                ? 'ការបង្កើត Server ផ្ទាល់ខ្លួន vs KruPet PaaS'
                : 'Traditional On-Premise Servers vs KruPet PaaS'}
            </h2>
            <p className="text-xs text-stone-600">
              {isKm
                ? 'សន្សំថវិការាប់ម៉ឺនដុល្លារក្នុងមួយឆ្នាំ ដោយជ្រើសរើសស្ថាបត្យកម្ម Cloud PaaS ជំនាន់ថ្មី។'
                : 'Save tens of thousands of dollars annually by deploying modern clinical PaaS infrastructure.'}
            </p>
          </div>

          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-[#FAF7F2]">
                  <th className="p-3.5 font-bold text-stone-700">{isKm ? 'កត្តាប្រៀបធៀប' : 'Capability / Metric'}</th>
                  <th className="p-3.5 font-bold text-stone-500">{isKm ? 'ម៉ាស៊ីន Server ផ្ទាល់ខ្លួន (On-Premise)' : 'Traditional On-Premise Server'}</th>
                  <th className="p-3.5 font-bold text-teal-950 bg-teal-50/80">{isKm ? 'KruPet PaaS Enterprise ($20/ខែ)' : 'KruPet PaaS Cloud Grid ($20/mo)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="p-3.5 font-bold text-stone-800">{isKm ? 'ថ្លៃទិញឧបករណ៍ Server ដំបូង' : 'Initial Hardware Capex'}</td>
                  <td className="p-3.5 text-stone-500">$15,000 - $35,000 USD</td>
                  <td className="p-3.5 font-bold text-teal-900 bg-teal-50/40">$0 USD (គ្មានថ្លៃទិញម៉ាស៊ីន)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-stone-800">{isKm ? 'ប្រាក់ខែបុគ្គលិក IT ថែទាំ Server' : 'Dedicated IT & Server Staff'}</td>
                  <td className="p-3.5 text-stone-500">$800 - $1,500 USD / ខែ</td>
                  <td className="p-3.5 font-bold text-teal-900 bg-teal-50/40">$0 USD (គ្រប់គ្រងដោយស្វ័យប្រវត្ត)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-stone-800">{isKm ? 'ការធ្វើបច្ចុប្បន្នភាពប្រព័ន្ធ & ច្បាប់ MoH' : 'Regulatory Updates & MoH DHIS2'}</td>
                  <td className="p-3.5 text-stone-500">ត្រូវជួលអ្នកសរសេរកូដកែបន្ថែម</td>
                  <td className="p-3.5 font-bold text-teal-900 bg-teal-50/40">Update ស្វ័យប្រវត្ត ឥតគិតថ្លៃ ១០០%</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-stone-800">{isKm ? 'សមត្ថភាពដំណើរការពេលដាច់ Internet' : 'Offline-First Edge Resilience'}</td>
                  <td className="p-3.5 text-stone-500">គាំង ប្រសិនបើតំណភ្ជាប់ LAN ខូច</td>
                  <td className="p-3.5 font-bold text-teal-900 bg-teal-50/40">ដំណើរការធម្មតា និង Sync ស្វ័យប្រវត្ត</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-stone-800">{isKm ? 'ទូទាត់ Dynamic Bakong KHQR POS' : 'Dynamic Bakong KHQR Settlement'}</td>
                  <td className="p-3.5 text-stone-500">ត្រូវរត់ការភ្ជាប់ Gateway ធនាគារពិបាក</td>
                  <td className="p-3.5 font-bold text-teal-900 bg-teal-50/40">រួចរាល់ភ្លាមៗ 0% កម្រៃជើងសារ ហូរចូលគណនីផ្ទាល់</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-stone-800">{isKm ? 'ការគាំទ្របច្ចេកទេស & SLA' : 'Engineering Standby SLA'}</td>
                  <td className="p-3.5 text-stone-500">គ្មានការធានាផ្លូវការ</td>
                  <td className="p-3.5 font-bold text-teal-900 bg-teal-50/40">24/7 VIP SLA ឆ្លើយតបក្រោម ៥ នាទី</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Final PaaS CTA */}
        <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-4">
          <h2 className="text-xl sm:text-3xl font-extrabold font-sans">
            {isKm
              ? 'ត្រៀមខ្លួនសម្រាប់បណ្តាញមន្ទីរពេទ្យទំនើប ២០២៦?'
              : 'Ready to Modernize Your Hospital Network in 2026?'}
          </h2>
          <p className="text-xs sm:text-sm text-teal-200 max-w-xl mx-auto">
            {isKm
              ? 'ដំណើរការស្ថាបត្យកម្ម PaaS គ្មានដែនកំណត់ ជាមួយ Dynamic KHQR Tag 01=12 ក្នុងរយៈពេលតែ ៦០ វិនាទីប៉ុណ្ណោះ។'
              : 'Deploy unlimited PaaS grid architecture with instant dynamic Bakong KHQR Tag 01=12 in 60 seconds.'}
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="px-8 py-3.5 rounded-2xl bg-white hover:bg-stone-100 text-teal-950 font-extrabold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              {isKm ? 'ដោះសោគម្រោង PaaS $20/ខែ ឥឡូវនេះ' : 'Unlock Unlimited PaaS ($20/mo) Now'}
            </button>
          </div>
        </div>
      </main>

      <PublicFooter />

      {/* Subscription Checkout Modal pre-selected to UNLIMITED_20 */}
      {isCheckoutOpen && (
        <SubscriptionCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          initialPlanTier="UNLIMITED_20"
          currentTenantPlanTier={currentPlanTier}
          onActivated={() => {
            setIsCheckoutOpen(false);
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}
