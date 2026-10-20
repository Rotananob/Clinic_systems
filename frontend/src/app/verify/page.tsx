'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  User,
  FileText,
  Lock,
  Printer,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';

function VerificationContent() {
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';
  const searchParams = useSearchParams();

  const [certInput, setCertInput] = useState<string>('');
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialCert = searchParams.get('cert') || '';
  const initialSig = searchParams.get('sig') || '';

  const performVerification = async (certNumber: string, sig?: string) => {
    const cleanCert = certNumber.trim();
    if (!cleanCert) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.compliance.verifyCertificate(cleanCert, sig);
      setResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification service error.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCert) {
      setCertInput(initialCert);
      performVerification(initialCert, initialSig || undefined);
    }
  }, [initialCert, initialSig]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(certInput);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.compliance.verificationPortalTitle}
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            {t.compliance.verificationPortalSubtitle}
          </p>
        </div>

        {/* Certificate Number Input / Search Bar */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7E1D4] shadow-2xs">
          <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={isKh ? 'បញ្ចូលលេខសម្គាល់លិខិត (ឧ. MC-2026-0042)...' : 'Enter Certificate Number (e.g. MC-2026-0042)...'}
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#E7E1D4] rounded-xl text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-gray-900 bg-[#FDFBF7]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-[#111827] text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors cursor-pointer shrink-0"
            >
              {isLoading ? (isKh ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Verifying...') : (isKh ? 'ផ្ទៀងផ្ទាត់ឯកសារ' : 'Verify Certificate')}
            </button>
          </form>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Verification Result Card */}
        {result && (
          <div className="bg-white rounded-2xl border border-[#E7E1D4] shadow-2xs overflow-hidden">
            {result.isValid ? (
              // Authentic Cryptographic Seal
              <div className="bg-emerald-700 text-white p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl shrink-0">
                    <CheckCircle2 className="w-8 h-8 text-emerald-200" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 block">
                      {result.algorithm} Cryptographic Trust Verified
                    </span>
                    <h2 className="text-xl font-bold mt-1">
                      {t.compliance.validSeal}
                    </h2>
                    <p className="text-xs text-emerald-100 mt-1">
                      {result.verificationMessage}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Tampered or Invalid Warning
              <div className="bg-red-700 text-white p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl shrink-0">
                    <ShieldAlert className="w-8 h-8 text-red-200" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-200 block">
                      Security Verification Alert
                    </span>
                    <h2 className="text-xl font-bold mt-1">
                      {t.compliance.invalidSeal}
                    </h2>
                    <p className="text-xs text-red-100 mt-1">
                      {result.verificationMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Certificate Details */}
            {result.certificateDetails && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-[#E7E1D4]">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block">
                      {t.compliance.certNumber}
                    </span>
                    <span className="font-mono text-base font-bold text-gray-900">
                      {result.certificateDetails.certNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block">
                      {t.compliance.clinic}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {result.certificateDetails.clinicName || 'Rotana Medical Center'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block">
                      {t.compliance.patientName}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {result.certificateDetails.patientName}
                    </span>
                    <span className="text-xs font-mono text-gray-400 block">
                      {result.certificateDetails.patientCode}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block">
                      {t.compliance.doctor}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {result.certificateDetails.doctorName}
                    </span>
                    <span className="text-xs font-mono text-emerald-700 block">
                      {t.compliance.doctorLicense}: {result.doctorLicense}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pb-6 border-b border-[#E7E1D4]">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block">
                      {t.compliance.diagnosis}
                    </span>
                    <div className="text-sm font-medium text-gray-900 mt-0.5">
                      {result.certificateDetails.diagnosis}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block">
                      {t.compliance.authorizedLeave}
                    </span>
                    <div className="text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-block mt-1">
                      {result.certificateDetails.daysOff} {isKh ? 'ថ្ងៃ' : 'Days'} ({result.certificateDetails.startDate} {isKh ? 'ដល់' : 'to'} {result.certificateDetails.endDate})
                    </div>
                  </div>

                  {result.certificateDetails.remarks && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase block">
                        {isKh ? 'ការណែនាំរបស់គ្រូពេទ្យ' : 'Doctor Remarks'}
                      </span>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {result.certificateDetails.remarks}
                      </p>
                    </div>
                  )}
                </div>

                {/* Cryptographic Proof Audit */}
                <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#E7E1D4] space-y-2 text-2xs sm:text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800">
                    <Lock className="w-3.5 h-3.5 text-gray-500" />
                    <span>Cryptographic Audit Proof (Ministry of Health Ed25519)</span>
                  </div>

                  {result.signatureTimestamp && (
                    <div className="text-gray-600">
                      <span className="font-semibold">Signed At:</span> {new Date(result.signatureTimestamp).toLocaleString()}
                    </div>
                  )}

                  {result.publicKeyBase64 && (
                    <div className="font-mono text-gray-500 break-all">
                      <span className="font-semibold text-gray-700">Doctor Public Key:</span> {result.publicKeyBase64.slice(0, 48)}...
                    </div>
                  )}

                  <div className="text-emerald-800 font-semibold pt-1">
                    {t.compliance.tamperProofNotice}
                  </div>
                </div>

                {/* Print Verification Summary */}
                <div className="flex justify-end">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E7E1D4] rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    {isKh ? 'បោះពុម្ពលទ្ធផលផ្ទៀងផ្ទាត់' : 'Print Verification Summary'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="text-center text-xs text-gray-500">
          {t.compliance.zeroEmojiSeal} - ClinicOS Cryptographic Compliance Infrastructure
        </div>
      </div>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading verification portal...</div>}>
      <VerificationContent />
    </Suspense>
  );
}
