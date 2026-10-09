'use client';

import React, { useState } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../../components/common/ClinicLogo';
import {
  Printer,
  FileCheck,
  Calendar,
  User,
  Stethoscope,
  Building,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';

export default function CertificatesPage() {
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';

  const [certData, setCertData] = useState({
    certNumber: 'MC-2026-0042',
    certType: 'SICK_LEAVE' as 'SICK_LEAVE' | 'FITNESS' | 'REFERRAL',
    patientName: 'Chan Dara (ចាន់ ដារ៉ា)',
    patientCode: 'P-0012',
    age: '28',
    gender: 'Male (ប្រុស)',
    nationalId: '010293847',
    doctorName: 'Dr. Heng Rotana (វេជ្ជ. ហេង រតនា)',
    doctorLicense: 'MOH-DOC-9842',
    diagnosis: 'Acute Upper Respiratory Tract Infection (J06.9) with Moderate Fever',
    daysOff: '3',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    remarks: 'Patient is advised complete bed rest, hydration, and to avoid strenuous physical labor during recovery.',
    issuedDate: new Date().toLocaleDateString('km-KH'),
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar - Hidden on print */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {t.certificates.title}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.certificates.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{t.certificates.printCertificate}</span>
          </button>
        </div>
      </div>

      {/* Editor & A4 Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Certificate Editor Form - Hidden on print */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 print:hidden">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              {isKm ? 'កែសម្រួលព័ត៌មានលិខិត' : 'Certificate Parameters'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {certData.certNumber}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.certificates.certificateType}
            </label>
            <select
              value={certData.certType}
              onChange={(e) => setCertData((prev) => ({ ...prev, certType: e.target.value as any }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
            >
              <option value="SICK_LEAVE">{t.certificates.sickLeave}</option>
              <option value="FITNESS">{t.certificates.fitnessCert}</option>
              <option value="REFERRAL">{t.certificates.referralLetter}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.certificates.patient}
              </label>
              <input
                type="text"
                value={certData.patientName}
                onChange={(e) => setCertData((prev) => ({ ...prev, patientName: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKm ? 'អាយុ / ភេទ' : 'Age / Gender'}
              </label>
              <input
                type="text"
                value={`${certData.age} / ${certData.gender}`}
                onChange={(e) => {
                  const [age] = e.target.value.split('/');
                  setCertData((prev) => ({ ...prev, age: age.trim() }));
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.certificates.diagnosis}
            </label>
            <input
              type="text"
              value={certData.diagnosis}
              onChange={(e) => setCertData((prev) => ({ ...prev, diagnosis: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKm ? 'ចំនួនថ្ងៃ (Days)' : 'Days'}
              </label>
              <input
                type="number"
                value={certData.daysOff}
                onChange={(e) => setCertData((prev) => ({ ...prev, daysOff: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.certificates.startDate}
              </label>
              <input
                type="date"
                value={certData.startDate}
                onChange={(e) => setCertData((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:ring-1 focus:ring-teal-700 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.certificates.endDate}
              </label>
              <input
                type="date"
                value={certData.endDate}
                onChange={(e) => setCertData((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:ring-1 focus:ring-teal-700 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.certificates.clinicalRemarks}
            </label>
            <textarea
              rows={3}
              value={certData.remarks}
              onChange={(e) => setCertData((prev) => ({ ...prev, remarks: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.certificates.attendingPhysician}
            </label>
            <input
              type="text"
              value={certData.doctorName}
              onChange={(e) => setCertData((prev) => ({ ...prev, doctorName: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isKm ? 'បោះពុម្ពលិខិតផ្លូវការ (Print A4)' : 'Print Official A4 Certificate'}</span>
            </button>
          </div>
        </div>

        {/* Right: Official A4 Printable Certificate Preview */}
        <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-slate-300 p-8 sm:p-12 shadow-xl print:shadow-none print:border-none print:p-0 print:m-0 print:w-full">
          {/* Decorative Official Border for Cambodian Medical Certificate */}
          <div className="border-4 border-double border-teal-900/30 p-6 sm:p-8 rounded-xl relative">
            {/* Header: Kingdom & Ministry */}
            <div className="text-center pb-4 border-b-2 border-slate-200">
              <div className="text-sm font-bold text-slate-900 tracking-wide font-sans">
                ព្រះរាជាណាចក្រកម្ពុជា
              </div>
              <div className="text-xs font-bold text-slate-800 tracking-widest uppercase font-mono mt-0.5">
                KINGDOM OF CAMBODIA
              </div>
              <div className="text-[11px] text-slate-600 font-sans mt-0.5">
                ជាតិ សាសនា ព្រះមហាក្សត្រ • NATION RELIGION KING
              </div>
            </div>

            {/* Clinic Brand & Reg Header */}
            <div className="py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <ClinicLogo variant="print" />
              <div className="text-right text-[11px] text-slate-500 font-mono">
                <div>Ref No: <span className="font-bold text-slate-800">{certData.certNumber}</span></div>
                <div>Date: {certData.startDate}</div>
              </div>
            </div>

            {/* Certificate Title Banner */}
            <div className="my-6 text-center">
              <h2 className="text-lg sm:text-xl font-black text-teal-950 font-sans tracking-tight">
                {certData.certType === 'SICK_LEAVE' && 'លិខិតបញ្ជាក់ឈប់សម្រាកព្យាបាលជំងឺ'}
                {certData.certType === 'FITNESS' && 'លិខិតបញ្ជាក់កាយសម្បទា (FITNESS)'}
                {certData.certType === 'REFERRAL' && 'លិខិតបញ្ជូនអ្នកជំងឺ (REFERRAL LETTER)'}
              </h2>
              <div className="text-xs font-bold text-teal-800 font-mono tracking-wider uppercase mt-0.5">
                {certData.certType === 'SICK_LEAVE' && 'OFFICIAL MEDICAL SICK LEAVE CERTIFICATE'}
                {certData.certType === 'FITNESS' && 'CERTIFICATE OF MEDICAL FITNESS'}
                {certData.certType === 'REFERRAL' && 'OFFICIAL HOSPITAL REFERRAL LETTER'}
              </div>
            </div>

            {/* Body Content */}
            <div className="space-y-4 text-xs text-slate-800 leading-relaxed font-sans">
              <p>
                ខ្ញុំបាទ/នាងខ្ញុំ <strong>{certData.doctorName}</strong> វេជ្ជបណ្ឌិតនៃមជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ រតនា (Rotana Medical Center) សូមបញ្ជាក់ថា៖
              </p>

              <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200 space-y-1.5 font-sans">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">ឈ្មោះអ្នកជំងឺ (Patient):</span>{' '}
                    <strong className="text-slate-900">{certData.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">លេខកូដ (ID):</span>{' '}
                    <strong className="font-mono text-slate-900">{certData.patientCode}</strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">អាយុ (Age):</span>{' '}
                    <strong className="text-slate-900">{certData.age} ឆ្នាំ</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ភេទ (Gender):</span>{' '}
                    <strong className="text-slate-900">{certData.gender}</strong>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900">រោគវិនិច្ឆ័យវេជ្ជសាស្ត្រ (Clinical Diagnosis):</span>
                <p className="mt-1 p-2 bg-amber-50/50 border border-amber-200/60 rounded-md font-medium text-slate-900">
                  {certData.diagnosis}
                </p>
              </div>

              {certData.certType === 'SICK_LEAVE' && (
                <p>
                  អ្នកជំងឺត្រូវការឈប់សម្រាកព្យាបាល និងថែទាំសុខភាពចំនួន{' '}
                  <strong className="text-teal-900 font-mono text-sm underline decoration-teal-700">{certData.daysOff} ថ្ងៃ (Days)</strong>{' '}
                  គិតចាប់ពីថ្ងៃទី <strong>{certData.startDate}</strong> ដល់ថ្ងៃទី{' '}
                  <strong>{certData.endDate}</strong> និងអាចចូលបម្រើការងារវិញនៅថ្ងៃបន្ទាប់។
                </p>
              )}

              <div>
                <span className="font-bold text-slate-900">ការណែនាំ & អនុសាសន៍ (Medical Recommendations):</span>
                <p className="mt-1 text-slate-600 italic">
                  &ldquo;{certData.remarks}&rdquo;
                </p>
              </div>

              <p className="pt-2 text-slate-500 text-[11px]">
                លិខិតនេះត្រូវបានចេញជូនដោយសុចរិតភាព និងមានសុពលភាពច្បាប់សម្រាប់ប្រើប្រាស់តាមការចាំបាច់។
              </p>
            </div>

            {/* Official Stamp & Signatures */}
            <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="text-[11px] text-slate-500 mb-2">
                  ត្រាផ្លូវការគ្លីនិក (Official Seal)
                </div>
                {/* Official Circular Seal Outline */}
                <div className="w-24 h-24 mx-auto rounded-full border-2 border-dashed border-teal-800/40 flex flex-col items-center justify-center p-2 text-teal-900/60 font-serif">
                  <span className="text-[9px] uppercase font-bold tracking-tight">ROTANA CLINIC</span>
                  <span className="text-[8px] font-sans">ត្រាផ្លូវការ</span>
                  <span className="text-[8px] font-mono">SEAL & APPROVED</span>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 mb-1">
                  រាជធានីភ្នំពេញ, ថ្ងៃទី {certData.startDate}
                </div>
                <div className="text-[11px] font-bold text-slate-900 mb-8">
                  វេជ្ជបណ្ឌិតពិនិត្យព្យាបាល (Attending Physician)
                </div>
                <div className="border-t border-slate-400 mx-auto w-40 pt-1 font-bold text-slate-900">
                  {certData.doctorName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Lic. {certData.doctorLicense}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
