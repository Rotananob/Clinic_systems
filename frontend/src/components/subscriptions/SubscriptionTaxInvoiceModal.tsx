'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  ShieldCheck,
  CheckCircle2,
  X,
  ExternalLink,
  Building2,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';

interface SubscriptionTaxInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string | null;
}

export const SubscriptionTaxInvoiceModal: React.FC<SubscriptionTaxInvoiceModalProps> = ({
  isOpen,
  onClose,
  subscriptionId,
}) => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [loading, setLoading] = useState<boolean>(true);
  const [receipt, setReceipt] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen && subscriptionId) {
      setLoading(true);
      setErrorMsg('');
      api.subscriptions
        .getReceipt(subscriptionId)
        .then((data) => {
          setReceipt(data);
          setLoading(false);
        })
        .catch((err) => {
          setErrorMsg(err.message || 'Failed to load official receipt');
          setLoading(false);
        });
    } else {
      setReceipt(null);
    }
  }, [isOpen, subscriptionId]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-stone-300 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 bg-[#FAF7F2] border-b border-stone-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4 text-teal-100" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 font-sans">
                {isKm
                  ? 'វិក្កយបត្រពន្ធផ្លូវការ & បង្កាន់ដៃទទួលប្រាក់'
                  : 'Official SaaS Tax Invoice & Electronic Receipt'}
              </h2>
              <p className="text-[11px] text-stone-500">
                {isKm
                  ? 'ឯកសារបង់ប្រាក់ស្របច្បាប់សម្រាប់របាយការណ៍ចំណាយគ្លីនិក'
                  : 'Verified expense document compliant with Cambodian e-tax standards'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-teal-200" />
              <span>{isKm ? 'បោះពុម្ព / ទាញយក PDF' : 'Print / Save PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Invoice Canvas */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-stone-800">
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-teal-800 animate-spin mx-auto" />
              <div className="text-xs text-stone-500 font-medium">
                {isKm ? 'កំពុងបង្កើតវិក្កយបត្រពន្ធផ្លូវការ...' : 'Generating official tax invoice...'}
              </div>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-center">
              {errorMsg}
            </div>
          ) : receipt ? (
            <div className="space-y-6 print:p-0">
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-teal-800 pb-5 gap-4">
                <div className="space-y-1">
                  <div className="text-lg font-extrabold text-teal-900 font-sans tracking-tight">
                    {receipt.provider?.companyNameKh}
                  </div>
                  <div className="text-xs font-semibold text-stone-700">
                    {receipt.provider?.companyNameEn}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    VAT/TIN: <span className="font-mono font-bold text-stone-800">{receipt.provider?.vatTin}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 max-w-sm">
                    {receipt.provider?.addressKh}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    ទូរស័ព្ទ៖ {receipt.provider?.phone} • {receipt.provider?.email}
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1 shrink-0">
                  <span className="inline-block px-2.5 py-1 rounded bg-teal-100 text-teal-900 text-[10px] font-bold tracking-wider uppercase">
                    PAID IN FULL (បង់ប្រាក់រួចរាល់)
                  </span>
                  <div className="text-sm font-mono font-extrabold text-stone-900 pt-1">
                    {receipt.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    កាលបរិច្ឆេទចេញ៖ {new Date(receipt.issueDate).toLocaleDateString('km-KH')}
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono">
                    {new Date(receipt.issueDate).toLocaleTimeString('km-KH')}
                  </div>
                </div>
              </div>

              {/* Billed To / Payment Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                    ចេញជូនគ្លីនិក (Billed To):
                  </div>
                  <div className="font-extrabold text-stone-900 text-sm">
                    {receipt.customer?.clinicNameKh}
                  </div>
                  <div className="font-medium text-stone-700">
                    {receipt.customer?.clinicNameEn}
                  </div>
                  <div className="text-stone-600 font-mono text-[11px]">
                    Workspace: {receipt.customer?.subdomain}
                  </div>
                  <div className="text-stone-500 text-[11px]">
                    MoH License: {receipt.customer?.mohLicenseNumber}
                  </div>
                  <div className="text-stone-500 text-[11px] line-clamp-2">
                    {receipt.customer?.addressKh}
                  </div>
                </div>

                <div className="space-y-1 sm:pl-4 sm:border-l border-stone-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                    ព័ត៌មានប្រតិបត្តិការ (Payment Record):
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">វិធីសាស្ត្រទូទាត់:</span>
                    <span className="font-bold text-stone-900">{receipt.financial?.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">លេខយោងប្រតិបត្តិការ:</span>
                    <span className="font-mono text-stone-800 text-[11px]">{receipt.financial?.paymentTranId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">សុពលភាពគម្រោង:</span>
                    <span className="font-semibold text-stone-800">
                      {new Date(receipt.servicePeriod?.startDate).toLocaleDateString('km-KH')} ដល់{' '}
                      {new Date(receipt.servicePeriod?.endDate).toLocaleDateString('km-KH')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">វដ្តនៃការទូទាត់:</span>
                    <span className="font-bold text-teal-800">{receipt.plan?.billingCycle}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-stone-300 bg-stone-100 text-stone-700 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">បរិយាយមុខទំនិញ / សេវាកម្ម (Description)</th>
                      <th className="py-2.5 px-3 text-center">កូតា KHQR</th>
                      <th className="py-2.5 px-3 text-center">កូតាអ្នកជំងឺ</th>
                      <th className="py-2.5 px-3 text-right">តម្លៃសរុប (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    <tr>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-stone-900">{receipt.plan?.nameKh}</div>
                        <div className="text-[11px] text-stone-500">
                          {receipt.plan?.nameEn} ({receipt.plan?.billingCycle}) - {receipt.servicePeriod?.daysCount} ថ្ងៃ
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium">{receipt.plan?.dailyKhqrQuota}</td>
                      <td className="py-3 px-3 text-center font-mono font-medium">{receipt.plan?.monthlyPatientQuota}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-stone-900">
                        ${Number(receipt.financial?.amountUsd).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>តម្លៃសរុបមិនទាន់គិតពន្ធ (Subtotal):</span>
                    <span className="font-semibold">${Number(receipt.financial?.amountUsd).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500 text-[11px]">
                    <span>អាករលើតម្លៃបន្ថែម (VAT 0% Exempt):</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-teal-800 text-base font-extrabold text-teal-950">
                    <span>ចំនួនទឹកប្រាក់សរុប (USD):</span>
                    <span>${Number(receipt.financial?.totalUsd).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500 pt-0.5">
                    <span>សរុបជាប្រាក់រៀល (KHR):</span>
                    <span className="font-bold text-stone-800">
                      {Number(receipt.financial?.totalKhr).toLocaleString()} KHR
                    </span>
                  </div>
                </div>
              </div>

              {/* Digital Verification Seal & Footer */}
              <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-teal-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    <span>Verified Electronic Tax Invoice</span>
                  </div>
                  <div className="font-mono text-[10px]">
                    SHA-256 Stamp: {receipt.verification?.digitalSignature}
                  </div>
                </div>

                <div className="text-right text-[10px] text-stone-400">
                  &copy; {new Date().getFullYear()} ClinicOS PaaS (Cambodia). All rights reserved.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
