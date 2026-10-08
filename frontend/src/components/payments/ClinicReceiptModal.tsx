'use client';

import React, { useRef } from 'react';
import { useTranslation } from '../../context/I18nContext';
import {
  Printer,
  X,
  CheckCircle2,
  Building,
  User,
  Calendar,
  CreditCard,
  Receipt,
  Phone,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

interface ClinicReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
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

  if (!isOpen || !invoice) return null;

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
            max-width: 80mm;
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

      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Modal Controls Header (Hidden on Print) */}
        <div className="no-print px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-bold text-slate-800">
              {isKm ? 'បង្កាន់ដៃទូទាត់ប្រាក់ផ្លូវការ (Official Receipt)' : 'Official Payment Receipt'}
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

        {/* Printable Receipt Container */}
        <div
          id="clinic-printable-receipt"
          ref={receiptRef}
          className="p-6 bg-white text-slate-900 font-sans space-y-4"
        >
          {/* Clinic Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold mb-1">
              <Building className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">{clinicInfo.nameKh}</h2>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{clinicInfo.nameEn}</h3>
            <p className="text-[11px] text-slate-500 leading-tight">{clinicInfo.address}</p>
            <p className="text-[11px] text-slate-500">Tel: {clinicInfo.phone}</p>
            <p className="text-[10px] text-slate-400 font-mono">{clinicInfo.license}</p>
          </div>

          {/* Receipt Title & Status Stamp */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                {isKm ? 'វិក្កយបត្រលេខ' : 'Invoice No'}
              </span>
              <span className="font-mono text-sm font-bold text-slate-900">{invoice.invoiceNumber}</span>
            </div>

            <div className="text-right">
              {isPaid ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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
            {invoice.patient?.patientCode && (
              <div className="flex justify-between">
                <span className="text-slate-500">{isKm ? 'លេខកូដអ្នកជំងឺ:' : 'Patient ID:'}</span>
                <span className="font-mono font-medium text-slate-700">{invoice.patient.patientCode}</span>
              </div>
            )}
            {invoice.patient?.phone && (
              <div className="flex justify-between">
                <span className="text-slate-500">{isKm ? 'លេខទូរស័ព្ទ:' : 'Phone:'}</span>
                <span className="font-mono text-slate-700">{invoice.patient.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">{isKm ? 'កាលបរិច្ឆេទ:' : 'Date / Time:'}</span>
              <span className="font-mono text-slate-700 text-[11px]">{issueDate}</span>
            </div>
          </div>

          {/* Itemized Billing Breakdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 text-[11px] border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3">{isKm ? 'ការពិពណ៌នា' : 'Description'}</th>
                  <th className="py-2 px-2 text-center">{isKm ? 'ចំនួន' : 'Qty'}</th>
                  <th className="py-2 px-3 text-right">{isKm ? 'តម្លៃ' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                <tr>
                  <td className="py-2.5 px-3 text-slate-900 font-medium">
                    {invoice.visit?.reason || 'សេវាពិនិត្យ និងព្យាបាល (Medical Consultation & Care)'}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-600 font-mono">1</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    ${amount.toFixed(2)}
                  </td>
                </tr>
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

            {tranId !== 'N/A' && (
              <div className="flex justify-between items-center text-slate-500 text-[11px]">
                <span>{isKm ? 'លេខយោង TranID:' : 'Gateway Ref (TranID):'}</span>
                <span className="font-mono font-medium text-slate-700">{tranId}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-900">{isKm ? 'សរុបប្រាក់ដុល្លារ:' : 'Total (USD):'}</span>
              <span className="font-mono text-lg font-bold text-teal-800">${amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-500 text-xs">
              <span>{isKm ? 'សរុបប្រាក់រៀល (Rate 4,100):' : 'Total in KHR (Approx):'}</span>
              <span className="font-mono font-semibold text-slate-800">
                {amountKhr.toLocaleString()} KHR
              </span>
            </div>
          </div>

          {/* Footer Receipt Note & Barcode Simulation */}
          <div className="pt-3 border-t border-dashed border-slate-300 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>{isKm ? 'ប្រតិបត្តិការទូទាត់ប្រាក់មានសុពលភាព' : 'Verified Secure Transaction'}</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              {isKm
                ? 'សូមអរគុណចំពោះការជឿទុកចិត្ត! សូមជូនពរលោកអ្នកឆាប់ជាសះស្បើយ!'
                : 'Thank you for choosing Rotana Clinic. Wish you a speedy recovery!'}
            </p>
            <p className="text-[9px] text-slate-400 font-mono">
              Printed via Rotana Headless Bridge POS - {new Date().toLocaleDateString()}
            </p>
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
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
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
