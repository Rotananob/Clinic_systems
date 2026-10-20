'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../../components/common/ClinicLogo';
import { api } from '../../lib/api';
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
  Download,
  Lock,
  ShieldCheck,
  Activity,
  FileText,
  FileSpreadsheet,
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
    doctorName: 'Dr. Keo Samnang (វេជ្ជ. កែវ សំណាង)',
    doctorLicense: 'MOH-DOC-9842',
    diagnosis: 'Acute Upper Respiratory Tract Infection (J06.9) with Moderate Fever',
    daysOff: '3',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    remarks: 'Patient is advised complete bed rest, hydration, and to avoid strenuous physical labor during recovery.',
    issuedDate: new Date().toLocaleDateString('km-KH'),
  });

  // Cryptographic Signature State
  const [signedRecord, setSignedRecord] = useState<any | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [signFeedback, setSignFeedback] = useState<string | null>(null);

  // DHIS2 Surveillance Modal State
  const [isDhis2ModalOpen, setIsDhis2ModalOpen] = useState<boolean>(false);
  const [dhis2Report, setDhis2Report] = useState<any | null>(null);
  const [trackedDiseases, setTrackedDiseases] = useState<any[]>([]);
  const [isLoadingDhis2, setIsLoadingDhis2] = useState<boolean>(false);

  // Automatic signing simulation on initial load for demo certificate
  useEffect(() => {
    handleSignEd25519(false);
  }, []);

  const handleSignEd25519 = async (showFeedback = true) => {
    setIsSigning(true);
    setSignFeedback(null);
    try {
      const res = await api.compliance.signCertificate({
        certNumber: certData.certNumber,
        certType: certData.certType,
        patientName: certData.patientName,
        patientCode: certData.patientCode,
        age: certData.age,
        gender: certData.gender,
        doctorName: certData.doctorName,
        doctorLicense: certData.doctorLicense,
        diagnosis: certData.diagnosis,
        daysOff: certData.daysOff,
        startDate: certData.startDate,
        endDate: certData.endDate,
        remarks: certData.remarks,
        issuedAt: certData.startDate,
        clinicName: 'Rotana Medical Center',
      });
      setSignedRecord(res);
      if (showFeedback) {
        setSignFeedback(isKm ? 'បានចុះហត្ថលេខាឌីជីថល Ed25519 ដោយជោគជ័យ' : 'Signed cryptographically with Ed25519 successfully.');
      }
    } catch (err: any) {
      if (showFeedback) {
        setSignFeedback(err.message || 'Signing failed.');
      }
    } finally {
      setIsSigning(false);
    }
  };

  const handleOpenDhis2Modal = async () => {
    setIsDhis2ModalOpen(true);
    setIsLoadingDhis2(true);
    try {
      const [report, diseases] = await Promise.all([
        api.compliance.exportDhis2Surveillance('202610'),
        api.compliance.getTrackedDiseases(),
      ]);
      setDhis2Report(report);
      setTrackedDiseases(diseases || []);
    } catch (err) {
      console.error('Failed to load DHIS2 surveillance data', err);
    } finally {
      setIsLoadingDhis2(false);
    }
  };

  const handleDownloadDhis2Json = () => {
    if (!dhis2Report) return;
    const jsonStr = JSON.stringify(dhis2Report.dhis2Payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MoH_DHIS2_Surveillance_${dhis2Report.reportPeriod}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDhis2Csv = () => {
    if (!dhis2Report) return;
    const blob = new Blob([dhis2Report.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MoH_Communicable_Diseases_${dhis2Report.reportPeriod}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const verificationUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify?cert=${encodeURIComponent(certData.certNumber)}${
          signedRecord ? `&sig=${encodeURIComponent(signedRecord.signatureHex.slice(0, 32))}` : ''
        }`
      : `/verify?cert=${certData.certNumber}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar - Hidden on print */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {t.certificates.title}
              </h1>
              {signedRecord && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3" />
                  {t.compliance.signedBadge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.certificates.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sign Cryptographically Button */}
          <button
            type="button"
            onClick={() => handleSignEd25519(true)}
            disabled={isSigning}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isSigning ? (isKm ? 'កំពុងចុះហត្ថលេខា...' : 'Signing...') : t.compliance.signButton}</span>
          </button>

          {/* MoH DHIS2 Export Button */}
          <button
            type="button"
            onClick={handleOpenDhis2Modal}
            className="px-3.5 py-2 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t.compliance.dhis2Tab}</span>
          </button>

          {/* Print Certificate */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.certificates.printCertificate}</span>
          </button>
        </div>
      </div>

      {signFeedback && (
        <div className="print:hidden p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
          {signFeedback}
        </div>
      )}

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
                  const parts = e.target.value.split('/');
                  setCertData((prev) => ({
                    ...prev,
                    age: parts[0]?.trim() || prev.age,
                    gender: parts[1]?.trim() || prev.gender,
                  }));
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.certificates.diagnosis}
            </label>
            <textarea
              rows={2}
              value={certData.diagnosis}
              onChange={(e) => setCertData((prev) => ({ ...prev, diagnosis: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          {certData.certType === 'SICK_LEAVE' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.certificates.leaveDuration}
                </label>
                <input
                  type="number"
                  min="1"
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
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
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
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.certificates.clinicalRemarks}
            </label>
            <textarea
              rows={2}
              value={certData.remarks}
              onChange={(e) => setCertData((prev) => ({ ...prev, remarks: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSignEd25519(true)}
              className="w-full py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isKm ? 'អនុវត្តហត្ថលេខាឌីជីថល Ed25519' : 'Apply Ed25519 Digital Signature'}</span>
            </button>
          </div>
        </div>

        {/* Right: A4 Official Certificate Preview */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs print:border-none print:shadow-none print:p-0">
          <div className="max-w-2xl mx-auto space-y-6 text-slate-800 font-serif">
            {/* National Header */}
            <div className="text-center space-y-1">
              <div className="text-base font-bold text-slate-900">ព្រះរាជាណាចក្រកម្ពុជា</div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-700">
                Kingdom of Cambodia
              </div>
              <div className="text-2xs text-slate-500">
                ជាតិ សាសនា ព្រះមហាក្សត្រ - Nation Religion King
              </div>
            </div>

            {/* Clinic Banner */}
            <div className="flex justify-between items-start border-b-2 border-teal-800 pb-3">
              <div>
                <div className="font-bold text-base text-teal-900">
                  មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ រតនា (Rotana Medical Center)
                </div>
                <div className="text-xs text-slate-500 font-sans">
                  Ministry of Health License No: 1842/26 MoH
                </div>
              </div>
              <div className="text-right text-xs font-sans">
                <div className="font-mono font-bold text-slate-900">Ref: {certData.certNumber}</div>
                <div className="text-slate-500">Date: {certData.startDate}</div>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="text-center pt-2">
              <h2 className="text-lg font-bold text-teal-950">
                {certData.certType === 'SICK_LEAVE'
                  ? 'លិខិតបញ្ជាក់ឈប់សម្រាកព្យាបាលជំងឺ'
                  : certData.certType === 'FITNESS'
                  ? 'លិខិតបញ្ជាក់កាយសម្បទា'
                  : 'លិខិតបញ្ជូនអ្នកជំងឺ'}
              </h2>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-800 font-sans">
                {certData.certType === 'SICK_LEAVE'
                  ? 'Official Medical Certificate / Sick Leave'
                  : certData.certType === 'FITNESS'
                  ? 'Certificate of Medical Fitness'
                  : 'Medical Referral Letter'}
              </div>
            </div>

            {/* Content Body */}
            <div className="text-xs sm:text-sm space-y-4 leading-relaxed font-sans">
              <p>
                ខ្ញុំបាទ/នាងខ្ញុំ <strong>{certData.doctorName}</strong> វេជ្ជបណ្ឌិតនៃមជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ រតនា សូមបញ្ជាក់ថា៖
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">ឈ្មោះអ្នកជំងឺ (Patient):</span>{' '}
                  <strong className="text-slate-900">{certData.patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">លេខកូដ (ID):</span>{' '}
                  <strong className="font-mono text-slate-900">{certData.patientCode}</strong>
                </div>
                <div>
                  <span className="text-slate-500">អាយុ (Age):</span>{' '}
                  <strong className="text-slate-900">{certData.age} ឆ្នាំ</strong>
                </div>
                <div>
                  <span className="text-slate-500">ភេទ (Gender):</span>{' '}
                  <strong className="text-slate-900">{certData.gender}</strong>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900">រោគវិនិច្ឆ័យវេជ្ជសាស្ត្រ (Clinical Diagnosis):</span>
                <p className="mt-1 p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-lg font-medium text-slate-900 text-xs">
                  {certData.diagnosis}
                </p>
              </div>

              {certData.certType === 'SICK_LEAVE' && (
                <p className="text-xs sm:text-sm">
                  អ្នកជំងឺត្រូវការឈប់សម្រាកព្យាបាល និងថែទាំសុខភាពចំនួន{' '}
                  <strong className="text-teal-900 font-mono underline decoration-teal-700">
                    {certData.daysOff} ថ្ងៃ (Days)
                  </strong>{' '}
                  គិតចាប់ពីថ្ងៃទី <strong>{certData.startDate}</strong> ដល់ថ្ងៃទី{' '}
                  <strong>{certData.endDate}</strong> និងអាចចូលបម្រើការងារវិញនៅថ្ងៃបន្ទាប់។
                </p>
              )}

              <div>
                <span className="font-bold text-slate-900">ការណែនាំ & អនុសាសន៍ (Medical Recommendations):</span>
                <p className="mt-1 text-slate-600 italic text-xs">
                  &ldquo;{certData.remarks}&rdquo;
                </p>
              </div>
            </div>

            {/* Official Stamp, Cryptographic QR Code & Signature */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 items-center text-center font-sans text-xs">
              {/* Official Seal Stamp */}
              <div>
                <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-teal-800/40 flex flex-col items-center justify-center p-1 text-teal-900/70 font-serif">
                  <span className="text-[8px] uppercase font-bold">ROTANA CLINIC</span>
                  <span className="text-[7px]">ត្រាផ្លូវការ</span>
                  <span className="text-[7px] font-mono">SEAL APPROVED</span>
                </div>
              </div>

              {/* Dynamic Ed25519 Tamper-Proof QR Code */}
              <div className="flex flex-col items-center">
                <div className="p-1.5 bg-white border border-slate-300 rounded-lg shadow-2xs inline-block">
                  <QRCodeSVG value={verificationUrl} size={76} level="M" />
                </div>
                <span className="text-3xs text-slate-500 font-mono mt-1 block">
                  Ed25519 Verify QR
                </span>
                <span className="text-3xs text-emerald-700 font-semibold block">
                  Scan to Authenticate
                </span>
              </div>

              {/* Doctor Signature Block */}
              <div>
                <div className="text-3xs text-slate-500 mb-1">
                  រាជធានីភ្នំពេញ, ថ្ងៃទី {certData.startDate}
                </div>
                <div className="text-2xs font-bold text-slate-900 mb-6">
                  វេជ្ជបណ្ឌិតពិនិត្យព្យាបាល
                </div>
                <div className="border-t border-slate-400 mx-auto w-32 pt-1 font-bold text-slate-900 text-xs">
                  {certData.doctorName}
                </div>
                <div className="text-3xs text-slate-500 font-mono">
                  Lic. {certData.doctorLicense}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: MoH DHIS2 Communicable Disease Surveillance */}
      {isDhis2ModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-[#E7E1D4] shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E7E1D4]">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-gray-900">
                  {t.compliance.dhis2Tab}
                </h3>
              </div>
              <button
                onClick={() => setIsDhis2ModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
              >
                X
              </button>
            </div>

            {isLoadingDhis2 ? (
              <div className="py-12 text-center text-xs text-gray-500">
                Loading MoH surveillance data...
              </div>
            ) : dhis2Report ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center bg-[#FDFBF7] p-3 rounded-xl border border-[#E7E1D4]">
                  <div>
                    <span className="text-xs text-gray-500 block">{t.compliance.reportPeriod}</span>
                    <span className="font-bold text-gray-900 font-mono">{dhis2Report.reportPeriod}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">{t.compliance.trackedCases}</span>
                    <span className="font-bold text-emerald-700">{dhis2Report.totalReportedCases}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">MoH Facility Code</span>
                    <span className="font-bold text-gray-900 font-mono text-xs">{dhis2Report.orgUnit}</span>
                  </div>
                </div>

                {/* Disease Breakdown Table */}
                <div className="border border-[#E7E1D4] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FDFBF7] border-b border-[#E7E1D4] text-gray-600 uppercase font-semibold">
                      <tr>
                        <th className="py-2 px-3">Communicable Disease</th>
                        <th className="py-2 px-3">ICD-11</th>
                        <th className="py-2 px-3">Reported Cases</th>
                        <th className="py-2 px-3">Notification Urgency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E1D4]">
                      {trackedDiseases.map((dis) => (
                        <tr key={dis.diseaseName}>
                          <td className="py-2 px-3 font-semibold text-gray-900">{dis.diseaseName}</td>
                          <td className="py-2 px-3 font-mono text-gray-600">{dis.icd11Code}</td>
                          <td className="py-2 px-3 font-bold text-emerald-700">
                            {dhis2Report.diseaseBreakdown[dis.diseaseName] || 0}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-3xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {dis.reportingUrgency}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleDownloadDhis2Json}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.compliance.exportJson}</span>
                  </button>
                  <button
                    onClick={handleDownloadDhis2Csv}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111827] text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{t.compliance.exportCsv}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
