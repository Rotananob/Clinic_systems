'use client';

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '../../components/landing/PublicNavbar';
import { PublicFooter } from '../../components/landing/PublicFooter';
import { useTranslation } from '../../context/I18nContext';
import {
  ShieldCheck,
  Lock,
  Database,
  Trash2,
  FileText,
  Building2,
  CheckCircle2,
  CreditCard,
  EyeOff,
  Server,
  ArrowLeft,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans text-stone-900">
      <PublicNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-950 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isKm ? 'ត្រឡប់ទៅទំព័រដើម' : 'Back to Home'}</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-bold border border-teal-200">
                {isKm ? 'ឯកសារផ្លូវការ' : 'Official Policy'}
              </span>
              <span className="text-xs text-stone-500 font-mono">
                {isKm ? 'ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ តុលា ឆ្នាំ ២០២៦' : 'Last Updated: October 2026'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              {isKm
                ? 'គោលការណ៍ឯកជនភាព & ការការពារទិន្នន័យវេជ្ជសាស្ត្រ'
                : 'Privacy Policy & Medical Data Protection'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              {isKm
                ? 'Krupet.com ប្តេជ្ញាចិត្តយ៉ាងម៉ឺងម៉ាត់ក្នុងការការពារទិន្នន័យអ្នកជំងឺ កំណត់ត្រាវេជ្ជសាស្ត្រ និងព័ត៌មានហិរញ្ញវត្ថុរបស់គ្លីនិកស្របតាមស្តង់ដារវេជ្ជសាស្ត្រ និងសេចក្តីណែនាំរបស់ក្រសួងសុខាភិបាលនៃព្រះរាជាណាចក្រកម្ពុជា។'
                : 'Krupet.com is strictly committed to protecting clinical patient health records and financial data in full compliance with Cambodian medical governance and Ministry of Health standards.'}
            </p>
          </div>

          {/* Quick Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                <EyeOff className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-stone-900">
                {isKm ? 'គ្មានការលក់ទិន្នន័យ' : 'Zero Data Selling'}
              </h3>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                {isKm
                  ? 'យើងមិនលក់ ចែករំលែក ឬប្រើប្រាស់ទិន្នន័យអ្នកជំងឺសម្រាប់គោលបំណងពាណិជ្ជកម្ម ឬផ្សាយពាណិជ្ជកម្មឡើយ។'
                  : 'We never monetize, sell, or disclose clinical patient records to advertisers or third parties.'}
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-stone-900">
                {isKm ? 'ការអ៊ិនគ្រីបកម្រិតខ្ពស់' : 'Bank-Grade Encryption'}
              </h3>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                {isKm
                  ? 'ទិន្នន័យវេជ្ជសាស្ត្រ និងប្រតិបត្តិការ Dynamic KHQR ត្រូវបានការពារដោយការអ៊ិនគ្រីប TLS និង AES-256។'
                  : 'All electronic medical records and dynamic KHQR transactions are protected with TLS and AES-256 encryption.'}
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-800 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-stone-900">
                {isKm ? 'សិទ្ធិលុបទិន្នន័យជាអចិន្ត្រៃយ៍' : 'Permanent Erasure'}
              </h3>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                {isKm
                  ? 'គ្លីនិកមានសិទ្ធិពេញលេញក្នុងការលុបទិន្នន័យអ្នកជំងឺជាអចិន្ត្រៃយ៍ចេញពី Database របស់យើងជារៀងរហូត។'
                  : 'Clinics maintain full authority to delete patient records permanently from our production databases.'}
              </p>
            </div>
          </div>

          {/* Detailed Clauses */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-8">
            {/* Clause 1 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-800 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {isKm
                    ? '១. ការការពារទិន្នន័យអ្នកជំងឺ និងការសម្ងាត់វិជ្ជាជីវៈវេជ្ជសាស្ត្រ'
                    : '1. Patient Confidentiality & Medical Professional Secrecy'}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {isKm
                  ? 'រាល់កំណត់ត្រាសុខភាព ប្រវត្តិជំងឺ វេជ្ជបញ្ជា និងលទ្ធផលតេស្តឈាមដែលបានបញ្ចូលក្នុង Krupet.com គឺជាកម្មសិទ្ធិផ្តាច់មុខរបស់គ្លីនិក និងអ្នកជំងឺ។ បុគ្គលិកបច្ចេកទេសរបស់ Krupet.com មិនមានសិទ្ធិចូលមើលទិន្នន័យវេជ្ជសាស្ត្ររបស់អ្នកជំងឺដោយគ្មានការអនុញ្ញាតជាលាយលក្ខណ៍អក្សរពីម្ចាស់គ្លីនិកឡើយ។'
                  : 'All electronic health records, consultation SOAP notes, prescriptions, and diagnostic results stored within Krupet.com are the exclusive confidential property of the clinic and patient.'}
              </p>
            </section>

            {/* Clause 2 */}
            <section className="space-y-3 pt-6 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-800 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {isKm
                    ? '២. ការបំបែកទិន្នន័យដាច់ដោយឡែក Multi-Tenant Isolation'
                    : '2. Multi-Tenant Architectural Data Isolation'}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {isKm
                  ? 'គ្លីនិកនីមួយៗដែលចុះឈ្មោះនៅលើ Krupet.com ត្រូវបានដាក់ឱ្យដំណើរការលើបរិយាកាសទិន្នន័យដាច់ដោយឡែកពីគ្នា។ គ្មានគ្លីនិកណាមួយអាចចូលមើល ឬទាញយកទិន្នន័យរបស់អ្នកជំងឺពីគ្លីនិកមួយផ្សេងទៀតបានឡើយ។ ការអនុវត្តនេះធានាសុវត្ថិភាព ១០០% ដល់ភាពសម្ងាត់នៃអាជីវកម្មគ្លីនិករបស់លោកអ្នក។'
                  : 'Each clinic operating on Krupet.com is partitioned via cryptographically enforced multi-tenant isolation. No clinic can access, view, or query patient records belonging to another facility.'}
              </p>
            </section>

            {/* Clause 3 */}
            <section className="space-y-3 pt-6 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-800 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {isKm
                    ? '៣. សុវត្ថិភាពទូទាត់ប្រាក់ Dynamic KHQR & ABA PayWay'
                    : '3. Dynamic KHQR & Financial Settlement Security'}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {isKm
                  ? 'ប្រព័ន្ធទូទាត់ប្រាក់ Dynamic KHQR ដំណើរការដោយផ្ទាល់ជាមួយប្រព័ន្ធធនាគារបាគង Bakong និង ABA PayWay។ Krupet.com មិនរក្សាទុកលេខកាតឥណទាន ឬពាក្យសម្ងាត់គណនីធនាគាររបស់លោកអ្នកឡើយ។ ទឹកប្រាក់ដែលអ្នកជំងឺបានទូទាត់ គឺផ្ទេរចូលគណនីធនាគាររបស់គ្លីនិកដោយផ្ទាល់ និងភ្លាមៗ។'
                  : 'Dynamic KHQR transactions route directly to the National Bank of Cambodia Bakong network and ABA PayWay merchant infrastructure. Krupet.com does not store banking credentials or card numbers.'}
              </p>
            </section>

            {/* Clause 4 */}
            <section className="space-y-3 pt-6 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-700 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {isKm
                    ? '៤. សិទ្ធិក្នុងការលុបទិន្នន័យជាអចិន្ត្រៃយ៍ពីប្រព័ន្ធ'
                    : '4. Right to Permanent Database Deletion'}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {isKm
                  ? 'គ្លីនិកអាចសម្រេចចិត្តលុបទិន្នន័យអ្នកជំងឺចេញពីប្រព័ន្ធបានគ្រប់ពេលវេលា។ នៅពេលដែលលោកអ្នកចុចយល់ព្រមលុប ទិន្នន័យអ្នកជំងឺ រួមទាំងកំណត់ត្រាវេជ្ជសាស្ត្រ វេជ្ជបញ្ជា និងវិក្កយបត្រដែលពាក់ព័ន្ធទាំងអស់ នឹងត្រូវលុបបាត់ជាអចិន្ត្រៃយ៍ចេញពី Database របស់យើងជារៀងរហូត។ ហេតុដូច្នេះ សូមប្រាកដថាអ្នកបាន Export ទាញយកឯកសារ Excel ឬកត់ត្រាទុកនៅក្រៅរួចរាល់ មុនពេលធ្វើការលុប។'
                  : 'Clinics maintain the full right to delete patient records at any time. When confirmed, all linked clinical encounters, prescriptions, and invoices are permanently erased from our databases forever. Clinics are advised to export an Excel backup beforehand.'}
              </p>
            </section>

            {/* Clause 5 */}
            <section className="space-y-3 pt-6 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-800 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {isKm
                    ? '៥. ព័ត៌មានទំនាក់ទំនង & ការគាំទ្របច្ចេកទេស'
                    : '5. Governance & Technical Support'}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {isKm
                  ? 'ប្រសិនបើលោកអ្នកមានចម្ងល់ ឬសំណូមពរទាក់ទងនឹងគោលការណ៍ឯកជនភាព និងសុវត្ថិភាពទិន្នន័យ សូមទំនាក់ទំនងមកកាន់ក្រុមការងារបច្ចេកទេស Krupet.com តាមរយៈទំព័រ Settings នៃគណនីរបស់អ្នក ឬផ្ញើសារមកកាន់ rotananob@gmail.com។'
                  : 'For privacy inquiries or technical data governance requests, please contact the Krupet.com engineering team via your account Settings console or via rotananob@gmail.com.'}
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
