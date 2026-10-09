import React from 'react';
import Link from 'next/link';
import { ChevronRight, Settings, LayoutTemplate } from 'lucide-react';
import { InvoiceTemplateDesigner } from '../../components/payments/InvoiceTemplateDesigner';

const MOCK_INVOICE = {
  invoiceNumber: 'INV-2026-00127',
  status: 'PAID',
  payableAmount: 25.0,
  currency: 'USD',
  paidAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  paymentMethod: 'KHQR',
  patient: {
    nameEn: 'Chantha Sophea',
    nameKh: 'ចន្ថា សុភា',
    patientCode: 'PT-001234',
    phone: '+855 12 999 888',
  },
  visit: {
    chiefComplaint: 'General check-up and blood pressure monitoring',
    doctorName: 'Dr. Visoth Ratha',
  },
  transactions: [{ tranId: 'ABA-20261009-XXXX7841' }],
  lineItems: [
    { description: 'General Consultation', amount: 10.0 },
    { description: 'Blood Pressure Monitoring', amount: 5.0 },
    { description: 'Blood CBC Lab Test', amount: 10.0 },
  ],
};

export default function InvoiceTemplatePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Breadcrumb Header */}
      <div className="shrink-0 px-5 py-3 bg-[#FDFBF7] border-b border-[#E7E1D4] flex items-center gap-2 text-xs text-[#78716C]">
        <Settings className="w-3.5 h-3.5" />
        <Link href="/settings" className="hover:text-teal-700 transition-colors">
          Settings
        </Link>
        <ChevronRight className="w-3 h-3" />
        <LayoutTemplate className="w-3.5 h-3.5 text-teal-700" />
        <span className="text-[#231F1C] font-semibold">Invoice Template Designer</span>
      </div>

      {/* Full-page Designer */}
      <div className="flex-1 overflow-hidden">
        <InvoiceTemplateDesigner invoice={MOCK_INVOICE} />
      </div>
    </div>
  );
}
