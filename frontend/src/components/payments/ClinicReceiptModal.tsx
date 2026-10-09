'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../common/ClinicLogo';
import { loadTemplateConfig, InvoiceTemplateConfig } from '../../lib/invoiceTemplate';
import {
  Printer,
  X,
  CheckCircle2,
  Receipt,
  ShieldCheck,
} from 'lucide-react';

interface ClinicReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    invoiceNumber?: string;
    status?: string;
    payableAmount?: number;
    totalAmount?: number;
    currency?: string;
    paidAt?: string;
    createdAt?: string;
    paymentMethod?: string;
    patient?: {
      nameEn?: string;
      nameKh?: string;
      patientCode?: string;
      phone?: string;
    };
    visit?: {
      reason?: string;
      doctorName?: string;
      chiefComplaint?: string;
    };
    transactions?: Array<{ tranId?: string }>;
    lineItems?: Array<{ description: string; amount: number }>;
  };
  clinicInfo?: {
    nameEn?: string;
    nameKh?: string;
    address?: string;
    phone?: string;
    license?: string;
  };
}

export function ClinicReceiptModal({
  isOpen,
  onClose,
  invoice,
  clinicInfo = {
    nameEn: 'ROTANA CLINIC & MATERNITY',
    nameKh: 'មន្ទីរសម្រាកព្យាបាល និងសម្ភព រតនា',
    address: 'Street 271, Sangkat Boeng Tumpun, Khan Mean Chey, Phnom Penh',
    phone: '023 999 888 / 012 345 678',
    license: 'MoH-Lic: 2024/089-CP',
  },
}: ClinicReceiptModalProps) {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const receiptRef = useRef<HTMLDivElement>(null);
  const [templateConfig, setTemplateConfig] = useState<InvoiceTemplateConfig | null>(null);

  useEffect(() => {
    setTemplateConfig(loadTemplateConfig());
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const cfg = templateConfig;

  const handlePrint = () => {
    window.print();
  };

  const amount = Number(invoice.payableAmount || invoice.totalAmount || 0);
  const currency = invoice.currency || 'USD';
  const amountKhr = currency === 'USD' ? Math.round(amount * 4100) : amount;
  const isPaid = invoice.status === 'PAID';
  const issueDate = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleString()
    : new Date(invoice.createdAt || Date.now()).toLocaleString();
  const latestTxn = invoice.transactions?.[0];
  const tranId = latestTxn?.tranId || 'N/A';

  // Derive styling from template config with fallbacks
  const accentColor = cfg?.accentColor ?? '#0f766e';
  const accentStyle = { color: accentColor };

  const headerBgStyle =
    cfg?.headerBg === 'accent'
      ? { backgroundColor: accentColor, color: '#fff' }
      : cfg?.headerBg === 'dark'
      ? { backgroundColor: '#1c1917', color: '#fff' }
      : {};

  const fontClass =
    cfg?.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const paperSizeClass =
    cfg?.paperSize === 'A4_STANDARD'
      ? 'max-w-3xl'
      : cfg?.paperSize === 'A5_HALF'
      ? 'max-w-xl'
      : 'max-w-lg';

  const showBorder = cfg?.showBorder ?? true;
  const showWatermark = cfg?.showWatermark ?? false;

  const invoiceTitleEn = cfg?.invoiceTitleEn ?? 'Official Payment Receipt';
  const invoiceTitleKh = cfg?.invoiceTitleKh ?? 'បង្កាន់ដៃទូទាត់ប្រាក់ផ្លូវការ';
  const footerNoteEn = cfg?.footerNoteEn ?? 'Thank you for choosing Rotana Clinic. Wish you a speedy recovery!';
  const footerNoteKh = cfg?.footerNoteKh ?? 'សូមអរគុណចំពោះការជឿទុកចិត្ត! សូមជូនពរលោកអ្នកឆាប់ជាសះស្បើយ!';

  const printMaxWidth =
    cfg?.paperSize === 'A4_STANDARD'
      ? '210mm'
      : cfg?.paperSize === 'A5_HALF'
      ? '148mm'
      : '80mm';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Print Styles Injection */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #clinic-printable-receipt,
          #clinic-printable-receipt * {
            visibility: visible;
          }
          #clinic-printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: ${printMaxWidth};
            margin: 0 auto;
            padding: 12px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className={`bg-white rounded-2xl shadow-2xl ${paperSizeClass} w-full overflow-hidden ${showBorder ? 'border border-slate-200' : ''} animate-in fade-in zoom-in-95 duration-150 my-6`}
      >
        {/* Modal Controls Header (Hidden on Print) */}
        <div className="no-print px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-bold text-slate-800">
              {isKm ? `${invoiceTitleKh} (${invoiceTitleEn})` : invoiceTitleEn}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isKm ? 'បោះពុម្ព (Print POS)' : 'Print (80mm/A4)'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Settled Confirmation Alert (Hidden on Print) */}
        {isPaid && (
          <div className="no-print bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center justify-between text-emerald-800 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isKm
                  ? 'ការទូទាត់ត្រូវបានផ្ទៀងផ្ទាត់ជោគជ័យ - វិក្កយបត្រ Real-Time'
                  : 'Payment Verified Successfully - Real-Time Settled Invoice'}
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
              PAID &amp; SETTLED
            </span>
          </div>
        )}

        {/* Printable Receipt Container */}
        <div
          id="clinic-printable-receipt"
          ref={receiptRef}
          className={`bg-white text-slate-900 ${fontClass} space-y-4 relative overflow-hidden`}
        >
          {/* Watermark */}
          {showWatermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04] rotate-[-35deg]">
              <span className="text-6xl font-black tracking-widest uppercase text-slate-900">
                {isPaid ? 'PAID' : 'PENDING'}
              </span>
            </div>
          )}

          {/* Clinic Header */}
          <div style={headerBgStyle} className="pb-3 border-b border-dashed border-slate-300 space-y-1.5 p-6 pb-4">
            {(cfg?.showLogo ?? true) && (
              cfg?.logoUrl ? (
                <div className="flex justify-center mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cfg.logoUrl} alt="Clinic Logo" className="h-14 object-contain" />
                </div>
              ) : (
                <div className="flex justify-center">
                  <ClinicLogo variant="print" />
                </div>
              )
            )}
            {(cfg?.showClinicName ?? true) && (
              <div className="text-center">
                <p className="font-bold text-sm">{clinicInfo.nameEn}</p>
                <p className="text-[11px] opacity-80">{clinicInfo.nameKh}</p>
              </div>
            )}
            {(cfg?.showMohLicense ?? true) && clinicInfo.license && (
              <p className="text-[11px] text-slate-500 text-center">{clinicInfo.license}</p>
            )}
            {(cfg?.showClinicAddress ?? true) && clinicInfo.address && (
              <p className="text-[11px] text-slate-500 text-center leading-tight">{clinicInfo.address}</p>
            )}
            {(cfg?.showClinicPhone ?? true) && clinicInfo.phone && (
              <p className="text-[11px] text-slate-500 text-center">Tel: {clinicInfo.phone}</p>
            )}
          </div>

          <div className="px-6 space-y-4">
            {/* Receipt Title & Status Stamp */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {isKm ? invoiceTitleKh : invoiceTitleEn}
                </span>
                {(cfg?.showInvoiceNumber ?? true) && (
                  <span className="font-mono text-sm font-bold text-slate-900">{invoice.invoiceNumber}</span>
                )}
              </div>

              <div className="text-right">
                {isPaid ? (
                  <div
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold"
                    style={{
                      borderColor: accentColor,
                      color: accentColor,
                      backgroundColor: `${accentColor}15`,
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" style={accentStyle} />
                    <span>{isKm ? 'បានទូទាត់ (PAID)' : 'PAID'}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-[11px] font-bold">
                    <span>{invoice.status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Patient Details Grid */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">{isKm ? 'ឈ្មោះអ្នកជំងឺ:' : 'Patient Name:'}</span>
                <span className="font-semibold text-slate-900">
                  {invoice.patient?.nameEn || 'General Patient'}
                  {invoice.patient?.nameKh && ` (${invoice.patient.nameKh})`}
                </span>
              </div>
              {(cfg?.showPatientCode ?? true) && invoice.patient?.patientCode && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{isKm ? 'លេខកូដអ្នកជំងឺ:' : 'Patient ID:'}</span>
                  <span className="font-mono font-medium text-slate-700">{invoice.patient.patientCode}</span>
                </div>
              )}
              {(cfg?.showPatientPhone ?? true) && invoice.patient?.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{isKm ? 'លេខទូរស័ព្ទ:' : 'Phone:'}</span>
                  <span className="font-mono text-slate-700">{invoice.patient.phone}</span>
                </div>
              )}
              {(cfg?.showVisitDate ?? true) && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{isKm ? 'កាលបរិច្ឆេទ:' : 'Date / Time:'}</span>
                  <span className="font-mono text-slate-700 text-[11px]">{issueDate}</span>
                </div>
              )}
              {(cfg?.showDoctorName ?? true) && invoice.visit?.doctorName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{isKm ? 'វេជ្ជបណ្ឌិត:' : 'Doctor:'}</span>
                  <span className="font-semibold text-slate-900">{invoice.visit.doctorName}</span>
                </div>
              )}
            </div>

            {/* Itemized Billing Breakdown */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead style={{ backgroundColor: accentColor }} className="text-white text-[11px] border-b border-slate-200 uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">{isKm ? 'ការពិពណ៌នា' : 'Description'}</th>
                    <th className="py-2 px-2 text-center">{isKm ? 'ចំនួន' : 'Qty'}</th>
                    <th className="py-2 px-3 text-right">{isKm ? 'តម្លៃ' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {(cfg?.showItemizedServices ?? false) && invoice.lineItems && invoice.lineItems.length > 0 ? (
                    invoice.lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 text-slate-900 font-medium">{item.description}</td>
                        <td className="py-2.5 px-2 text-center text-slate-600 font-mono">1</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          ${item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2.5 px-3 text-slate-900 font-medium">
                        {invoice.visit?.reason || invoice.visit?.chiefComplaint || 'សេវាពិនិត្យ និងព្យាបាល (Medical Consultation & Care)'}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-600 font-mono">1</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        ${amount.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total & Currency Conversion */}
            <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>{isKm ? 'វិធីសាស្ត្រទូទាត់:' : 'Payment Method:'}</span>
                <span className="font-semibold text-slate-900 uppercase">
                  {invoice.paymentMethod === 'KHQR' ? 'KHQR Dynamic (Bakong / ABA)' : invoice.paymentMethod}
                </span>
              </div>

              {(cfg?.showAbaReference ?? true) && tranId !== 'N/A' && (
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>{isKm ? 'លេខយោង TranID:' : 'Gateway Ref (TranID):'}</span>
                  <span className="font-mono font-medium text-slate-700">{tranId}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-sm font-bold text-slate-900">{isKm ? 'សរុបប្រាក់ដុល្លារ:' : 'Total (USD):'}</span>
                <span className="font-mono text-lg font-bold" style={accentStyle}>${amount.toFixed(2)}</span>
              </div>

              {(cfg?.showKhrEquivalent ?? true) && (
                <div className="flex justify-between items-center text-slate-500 text-xs">
                  <span>{isKm ? 'សរុបប្រាក់រៀល (Rate 4,100):' : 'Total in KHR (Approx):'}</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {amountKhr.toLocaleString()} KHR
                  </span>
                </div>
              )}
            </div>

            {/* Footer Receipt Note */}
            <div className="pt-3 border-t border-dashed border-slate-300 text-center space-y-1 pb-6">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold" style={accentStyle}>
                <ShieldCheck className="w-4 h-4" />
                <span>{isKm ? 'ប្រតិបត្តិការទូទាត់ប្រាក់មានសុពលភាព' : 'Verified Secure Transaction'}</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                {isKm ? footerNoteKh : footerNoteEn}
              </p>
              {(cfg?.showFooterSignatureLine ?? false) && (
                <div className="mt-6 pt-8 border-t border-slate-400 mx-10 text-[10px] text-slate-500">
                  Authorized Signature
                </div>
              )}
              <p className="text-[9px] text-slate-400 font-mono">
                Printed via Rotana Headless Bridge POS - {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action (Hidden on Print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {isKm ? 'គាំទ្រម៉ាស៊ីនបោះពុម្ព 80mm POS និង A4' : 'Supports 80mm POS receipt printers & A4'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition-colors"
            >
              {isKm ? 'បិទ' : 'Close'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              style={{ backgroundColor: accentColor }}
            >
              <Printer className="w-4 h-4" />
              <span>{isKm ? 'បោះពុម្ពវិក្កយបត្រ' : 'Print Receipt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
