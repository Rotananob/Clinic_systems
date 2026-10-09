'use client';

import React, { useState, useCallback } from 'react';
import {
  DEFAULT_TEMPLATE_CONFIG,
  InvoiceTemplateConfig,
  saveTemplateConfig,
  TEMPLATE_STORAGE_KEY,
} from '../../lib/invoiceTemplate';
import {
  Palette,
  FileText,
  Layout,
  AlignLeft,
  Save,
  RotateCcw,
  CheckCircle2,
  Eye,
  Settings,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  description: string;
  amount: number;
}

interface MockInvoice {
  invoiceNumber: string;
  status: string;
  payableAmount: number;
  currency: string;
  paidAt: string;
  createdAt: string;
  paymentMethod: string;
  patient: {
    nameEn: string;
    nameKh: string;
    patientCode: string;
    phone: string;
  };
  visit: {
    chiefComplaint: string;
    doctorName: string;
  };
  transactions: Array<{ tranId: string }>;
  lineItems: LineItem[];
}

interface InvoiceTemplateDesignerProps {
  invoice?: MockInvoice;
}

// ---------------------------------------------------------------------------
// Toggle Switch
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-1.5">
      <span className="text-xs text-[#231F1C]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-1 ${
          checked
            ? 'bg-teal-700 border-teal-700'
            : 'bg-[#E7E1D4] border-[#E7E1D4]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out mt-[1px] ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Receipt Preview
// ---------------------------------------------------------------------------

function ReceiptPreview({
  config,
  invoice,
}: {
  config: InvoiceTemplateConfig;
  invoice: MockInvoice;
}) {
  const amount = Number(invoice.payableAmount || 0);
  const amountKhr = Math.round(amount * 4100);
  const isPaid = invoice.status === 'PAID';
  const issueDate = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleString()
    : new Date(invoice.createdAt || Date.now()).toLocaleString();
  const tranId = invoice.transactions?.[0]?.tranId || 'N/A';

  const headerBgStyle =
    config.headerBg === 'accent'
      ? { backgroundColor: config.accentColor, color: '#fff' }
      : config.headerBg === 'dark'
      ? { backgroundColor: '#1c1917', color: '#fff' }
      : { backgroundColor: '#fff', color: '#231F1C' };

  const accentStyle = { color: config.accentColor };

  const fontClass =
    config.fontFamily === 'mono'
      ? 'font-mono'
      : config.fontFamily === 'khmer'
      ? 'font-sans'
      : 'font-sans';

  const isA4 = config.paperSize === 'A4_STANDARD';
  const isA5 = config.paperSize === 'A5_HALF';

  const containerWidth = isA4 ? 'max-w-[210mm]' : isA5 ? 'max-w-[148mm]' : 'max-w-[80mm]';
  const paddingClass = isA4 ? 'p-8' : isA5 ? 'p-6' : 'p-4';

  return (
    <div
      className={`${containerWidth} mx-auto bg-white text-[#231F1C] ${fontClass} text-[11px] leading-snug shadow-md ${
        config.showBorder ? 'border border-[#E7E1D4]' : ''
      } relative overflow-hidden`}
    >
      {config.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04] rotate-[-35deg]">
          <span className="text-6xl font-black tracking-widest uppercase text-[#231F1C]">
            {isPaid ? 'PAID' : 'PENDING'}
          </span>
        </div>
      )}

      {/* Header */}
      <div style={headerBgStyle} className={`${paddingClass} pb-3 space-y-1`}>
        {config.showLogo && config.logoUrl && (
          <div className="flex justify-center mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.logoUrl} alt="Clinic Logo" className="h-12 object-contain" />
          </div>
        )}
        {config.showClinicName && (
          <div className="text-center">
            <p className="font-bold text-sm">ROTANA CLINIC &amp; MATERNITY</p>
            <p className="text-[10px] opacity-80">មន្ទីរសម្រាកព្យាបាល និងសម្ភព រតនា</p>
          </div>
        )}
        {config.showMohLicense && (
          <p className="text-center text-[10px] opacity-70">MoH-Lic: 2024/089-CP</p>
        )}
        {config.showClinicAddress && (
          <p className="text-center text-[10px] opacity-70">
            Street 271, Sangkat Boeng Tumpun, Khan Mean Chey, Phnom Penh
          </p>
        )}
        {config.showClinicPhone && (
          <p className="text-center text-[10px] opacity-70">Tel: 023 999 888 / 012 345 678</p>
        )}
        {config.showClinicEmail && (
          <p className="text-center text-[10px] opacity-70">info@rotanaclinic.com.kh</p>
        )}
        {config.showSlogan && (
          <p className="text-center text-[10px] italic opacity-60">Excellence in Clinical Care</p>
        )}
      </div>

      <div className={`${paddingClass} pt-3 space-y-3`}>
        {/* Invoice Title & Status */}
        <div className="flex items-center justify-between border-b border-dashed border-[#E7E1D4] pb-2">
          <div>
            <p className="font-bold text-[12px]" style={accentStyle}>
              {config.invoiceTitleEn}
            </p>
            <p className="text-[10px] text-[#78716C]">{config.invoiceTitleKh}</p>
          </div>
          <div>
            {isPaid ? (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  color: config.accentColor,
                  borderColor: config.accentColor,
                  backgroundColor: `${config.accentColor}15`,
                }}
              >
                PAID
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400 text-amber-700 bg-amber-50">
                PENDING
              </span>
            )}
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="space-y-1 text-[10px]">
          {config.showInvoiceNumber && (
            <div className="flex justify-between">
              <span className="text-[#78716C]">Invoice No:</span>
              <span className="font-mono font-bold">{invoice.invoiceNumber}</span>
            </div>
          )}
          {config.showVisitDate && (
            <div className="flex justify-between">
              <span className="text-[#78716C]">Date / Time:</span>
              <span className="font-mono">{issueDate}</span>
            </div>
          )}
        </div>

        {/* Patient Details */}
        <div className="bg-[#F7F4EE] rounded-lg p-2.5 space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-[#78716C]">Patient Name:</span>
            <span className="font-semibold">
              {invoice.patient.nameEn}
              {invoice.patient.nameKh && ` (${invoice.patient.nameKh})`}
            </span>
          </div>
          {config.showPatientCode && (
            <div className="flex justify-between">
              <span className="text-[#78716C]">Patient ID:</span>
              <span className="font-mono">{invoice.patient.patientCode}</span>
            </div>
          )}
          {config.showPatientPhone && (
            <div className="flex justify-between">
              <span className="text-[#78716C]">Phone:</span>
              <span className="font-mono">{invoice.patient.phone}</span>
            </div>
          )}
          {config.showDoctorName && (
            <div className="flex justify-between">
              <span className="text-[#78716C]">Attending Doctor:</span>
              <span className="font-semibold">{invoice.visit.doctorName}</span>
            </div>
          )}
        </div>

        {/* Line Items / Services */}
        <div className="border border-[#E7E1D4] rounded-lg overflow-hidden">
          <table className="w-full text-[10px]">
            <thead>
              <tr style={{ backgroundColor: config.accentColor }} className="text-white">
                <th className="py-1.5 px-2 text-left">Description</th>
                <th className="py-1.5 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {config.showItemizedServices ? (
                invoice.lineItems.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F7F4EE]'}>
                    <td className="py-1.5 px-2">{item.description}</td>
                    <td className="py-1.5 px-2 text-right font-mono">${item.amount.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr className="bg-white">
                  <td className="py-1.5 px-2">
                    {invoice.visit.chiefComplaint || 'Medical Consultation & Care'}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono">${amount.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1 pt-1 border-t border-dashed border-[#E7E1D4] text-[10px]">
          <div className="flex justify-between">
            <span className="text-[#78716C]">Payment Method:</span>
            <span className="font-semibold uppercase">
              {invoice.paymentMethod === 'KHQR' ? 'KHQR Dynamic (ABA/Bakong)' : invoice.paymentMethod}
            </span>
          </div>
          {config.showAbaReference && tranId !== 'N/A' && (
            <div className="flex justify-between">
              <span className="text-[#78716C]">Gateway Ref:</span>
              <span className="font-mono">{tranId}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1 border-t border-[#E7E1D4]">
            <span className="font-bold text-[12px]">Total (USD):</span>
            <span className="font-mono font-bold text-[14px]" style={accentStyle}>
              ${amount.toFixed(2)}
            </span>
          </div>
          {config.showKhrEquivalent && (
            <div className="flex justify-between text-[#78716C]">
              <span>Total in KHR (Rate 4,100):</span>
              <span className="font-mono">{amountKhr.toLocaleString()} KHR</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-dashed border-[#E7E1D4] text-center space-y-1.5">
          <p className="text-[10px] text-[#231F1C] font-medium">{config.footerNoteEn}</p>
          <p className="text-[10px] text-[#78716C]">{config.footerNoteKh}</p>
          {config.showFooterSignatureLine && (
            <div className="mt-4 pt-8 border-t border-[#231F1C] mx-8 text-[10px] text-[#78716C]">
              Authorized Signature
            </div>
          )}
          <p className="text-[9px] text-[#78716C] font-mono mt-1">
            Printed via Rotana Clinic POS - {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings Panels
// ---------------------------------------------------------------------------

type DesignerTab = 'branding' | 'fields' | 'footer' | 'layout';

function BrandingPanel({
  config,
  onChange,
}: {
  config: InvoiceTemplateConfig;
  onChange: (partial: Partial<InvoiceTemplateConfig>) => void;
}) {
  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === 'string') {
          onChange({ logoUrl: result });
        }
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#231F1C] mb-1">Accent Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={config.accentColor}
            onChange={(e) => onChange({ accentColor: e.target.value })}
            className="w-8 h-8 rounded border border-[#E7E1D4] cursor-pointer p-0.5 bg-white"
          />
          <input
            type="text"
            value={config.accentColor}
            onChange={(e) => onChange({ accentColor: e.target.value })}
            className="flex-1 px-2.5 py-1.5 bg-white border border-[#E7E1D4] rounded-lg text-xs font-mono"
          />
        </div>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {['#0f766e', '#1d4ed8', '#7c3aed', '#b45309', '#be123c', '#166534'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ accentColor: c })}
              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none"
              style={{ backgroundColor: c, borderColor: config.accentColor === c ? '#231F1C' : 'transparent' }}
              title={c}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#231F1C] mb-1">Header Background</label>
        <select
          value={config.headerBg}
          onChange={(e) => onChange({ headerBg: e.target.value as InvoiceTemplateConfig['headerBg'] })}
          className="w-full px-2.5 py-1.5 bg-white border border-[#E7E1D4] rounded-lg text-xs"
        >
          <option value="white">White (Clean)</option>
          <option value="accent">Accent Color</option>
          <option value="dark">Dark / Espresso</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#231F1C] mb-1">Clinic Logo</label>
        <Toggle
          checked={config.showLogo}
          onChange={(v) => onChange({ showLogo: v })}
          label="Show logo on receipt"
        />
        {config.showLogo && (
          <div className="mt-2">
            <label
              className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-[#E7E1D4] rounded-xl cursor-pointer hover:border-teal-700 hover:bg-[#F7F4EE] transition-colors"
            >
              <span className="text-[10px] text-[#78716C]">
                {config.logoUrl ? 'Click to change logo' : 'Drop or click to upload logo'}
              </span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            {config.logoUrl && (
              <div className="mt-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={config.logoUrl} alt="Logo preview" className="h-10 object-contain border border-[#E7E1D4] rounded p-1" />
                <button
                  type="button"
                  onClick={() => onChange({ logoUrl: '' })}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1 pt-2 border-t border-[#E7E1D4]">
        <p className="text-xs font-semibold text-[#231F1C] mb-2">Header Sections</p>
        <Toggle checked={config.showClinicName} onChange={(v) => onChange({ showClinicName: v })} label="Clinic Name" />
        <Toggle checked={config.showMohLicense} onChange={(v) => onChange({ showMohLicense: v })} label="MoH License Number" />
        <Toggle checked={config.showClinicAddress} onChange={(v) => onChange({ showClinicAddress: v })} label="Clinic Address" />
        <Toggle checked={config.showClinicPhone} onChange={(v) => onChange({ showClinicPhone: v })} label="Phone Number" />
        <Toggle checked={config.showClinicEmail} onChange={(v) => onChange({ showClinicEmail: v })} label="Email Address" />
        <Toggle checked={config.showSlogan} onChange={(v) => onChange({ showSlogan: v })} label="Mission / Slogan" />
      </div>
    </div>
  );
}

function FieldsPanel({
  config,
  onChange,
}: {
  config: InvoiceTemplateConfig;
  onChange: (partial: Partial<InvoiceTemplateConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#231F1C] mb-1">Invoice Title (English)</label>
        <input
          type="text"
          value={config.invoiceTitleEn}
          onChange={(e) => onChange({ invoiceTitleEn: e.target.value })}
          className="w-full px-2.5 py-1.5 bg-white border border-[#E7E1D4] rounded-lg text-xs"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#231F1C] mb-1">Invoice Title (Khmer)</label>
        <input
          type="text"
          value={config.invoiceTitleKh}
          onChange={(e) => onChange({ invoiceTitleKh: e.target.value })}
          className="w-full px-2.5 py-1.5 bg-white border border-[#E7E1D4] rounded-lg text-xs"
        />
      </div>

      <div className="space-y-1 pt-2 border-t border-[#E7E1D4]">
        <p className="text-xs font-semibold text-[#231F1C] mb-2">Invoice Fields</p>
        <Toggle checked={config.showInvoiceNumber} onChange={(v) => onChange({ showInvoiceNumber: v })} label="Invoice Number" />
        <Toggle checked={config.showVisitDate} onChange={(v) => onChange({ showVisitDate: v })} label="Visit Date / Time" />
        <Toggle checked={config.showPatientCode} onChange={(v) => onChange({ showPatientCode: v })} label="Patient Code (ID)" />
        <Toggle checked={config.showPatientPhone} onChange={(v) => onChange({ showPatientPhone: v })} label="Patient Phone" />
        <Toggle checked={config.showDoctorName} onChange={(v) => onChange({ showDoctorName: v })} label="Attending Doctor" />
        <Toggle checked={config.showItemizedServices} onChange={(v) => onChange({ showItemizedServices: v })} label="Itemized Services (line items)" />
        <Toggle checked={config.showKhrEquivalent} onChange={(v) => onChange({ showKhrEquivalent: v })} label="KHR Equivalent Amount" />
      </div>
    </div>
  );
}

function FooterPanel({
  config,
  onChange,
}: {
  config: InvoiceTemplateConfig;
  onChange: (partial: Partial<InvoiceTemplateConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#231F1C] mb-1">Footer Note (English)</label>
        <textarea
          value={config.footerNoteEn}
          onChange={(e) => onChange({ footerNoteEn: e.target.value })}
          rows={2}
          className="w-full px-2.5 py-1.5 bg-white border border-[#E7E1D4] rounded-lg text-xs resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#231F1C] mb-1">Footer Note (Khmer)</label>
        <textarea
          value={config.footerNoteKh}
          onChange={(e) => onChange({ footerNoteKh: e.target.value })}
          rows={2}
          className="w-full px-2.5 py-1.5 bg-white border border-[#E7E1D4] rounded-lg text-xs resize-none"
        />
      </div>
      <div className="space-y-1 pt-2 border-t border-[#E7E1D4]">
        <p className="text-xs font-semibold text-[#231F1C] mb-2">Footer Options</p>
        <Toggle checked={config.showFooterSignatureLine} onChange={(v) => onChange({ showFooterSignatureLine: v })} label="Authorized Signature Line" />
        <Toggle checked={config.showAbaReference} onChange={(v) => onChange({ showAbaReference: v })} label="ABA / Bakong Transaction Reference" />
        <Toggle checked={config.showKhqrOnReceipt} onChange={(v) => onChange({ showKhqrOnReceipt: v })} label="Print KHQR Code on Receipt" />
      </div>
    </div>
  );
}

function LayoutPanel({
  config,
  onChange,
}: {
  config: InvoiceTemplateConfig;
  onChange: (partial: Partial<InvoiceTemplateConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#231F1C] mb-1">Paper Size</label>
        <select
          value={config.paperSize}
          onChange={(e) => onChange({ paperSize: e.target.value as InvoiceTemplateConfig['paperSize'] })}
          className="w-full px-2.5 py-1.5 bg-white border border-[#E7E1D4] rounded-lg text-xs"
        >
          <option value="80MM_THERMAL">80mm Thermal (POS Slip)</option>
          <option value="A4_STANDARD">A4 Full Page (Official)</option>
          <option value="A5_HALF">A5 Half Page</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#231F1C] mb-1">Font Family</label>
        <select
          value={config.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value as InvoiceTemplateConfig['fontFamily'] })}
          className="w-full px-2.5 py-1.5 bg-white border border-[#E7E1D4] rounded-lg text-xs"
        >
          <option value="system">System (Default)</option>
          <option value="khmer">Khmer / Battambang</option>
          <option value="mono">Monospace</option>
        </select>
      </div>
      <div className="space-y-1 pt-2 border-t border-[#E7E1D4]">
        <p className="text-xs font-semibold text-[#231F1C] mb-2">Visual Options</p>
        <Toggle checked={config.showBorder} onChange={(v) => onChange({ showBorder: v })} label="Show Receipt Border" />
        <Toggle checked={config.showWatermark} onChange={(v) => onChange({ showWatermark: v })} label="Show PAID / PENDING Watermark" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Designer
// ---------------------------------------------------------------------------

const DEFAULT_MOCK_INVOICE: MockInvoice = {
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

const DESIGNER_TABS: { id: DesignerTab; label: string; icon: React.ElementType }[] = [
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'fields', label: 'Fields', icon: FileText },
  { id: 'footer', label: 'Footer', icon: AlignLeft },
  { id: 'layout', label: 'Layout', icon: Layout },
];

export function InvoiceTemplateDesigner({ invoice = DEFAULT_MOCK_INVOICE }: InvoiceTemplateDesignerProps) {
  const [config, setConfig] = React.useState<InvoiceTemplateConfig>(() => {
    if (typeof window === 'undefined') return { ...DEFAULT_TEMPLATE_CONFIG };
    try {
      const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (raw) return { ...DEFAULT_TEMPLATE_CONFIG, ...JSON.parse(raw) };
    } catch {
      // fallback
    }
    return { ...DEFAULT_TEMPLATE_CONFIG };
  });

  const [activeTab, setActiveTab] = useState<DesignerTab>('branding');
  const [mobileView, setMobileView] = useState<'designer' | 'preview'>('designer');
  const [saved, setSaved] = useState(false);

  const handleChange = useCallback((partial: Partial<InvoiceTemplateConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  }, []);

  const handleSave = () => {
    saveTemplateConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_TEMPLATE_CONFIG });
    setSaved(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F4EE]">
      {/* Top Action Bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-[#FDFBF7] border-b border-[#E7E1D4]">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-teal-700" />
          <span className="text-xs font-bold text-[#231F1C]">Invoice Template Designer</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile toggle */}
          <div className="flex md:hidden rounded-lg overflow-hidden border border-[#E7E1D4]">
            <button
              type="button"
              onClick={() => setMobileView('designer')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-colors ${
                mobileView === 'designer' ? 'bg-teal-700 text-white' : 'bg-white text-[#78716C]'
              }`}
            >
              <Settings className="w-3 h-3" />
              Designer
            </button>
            <button
              type="button"
              onClick={() => setMobileView('preview')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-colors ${
                mobileView === 'preview' ? 'bg-teal-700 text-white' : 'bg-white text-[#78716C]'
              }`}
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium text-[#78716C] bg-white border border-[#E7E1D4] rounded-lg hover:bg-[#F7F4EE] flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-teal-700 hover:bg-teal-800 text-white'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Designer Settings */}
        <div
          className={`w-full md:w-80 xl:w-96 flex flex-col border-r border-[#E7E1D4] bg-[#FDFBF7] overflow-hidden ${
            mobileView === 'preview' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Tab Bar */}
          <div className="flex border-b border-[#E7E1D4] shrink-0">
            {DESIGNER_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  activeTab === id
                    ? 'text-teal-700 border-b-2 border-teal-700 bg-white'
                    : 'text-[#78716C] hover:text-[#231F1C] hover:bg-[#F7F4EE]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'branding' && (
              <BrandingPanel config={config} onChange={handleChange} />
            )}
            {activeTab === 'fields' && (
              <FieldsPanel config={config} onChange={handleChange} />
            )}
            {activeTab === 'footer' && (
              <FooterPanel config={config} onChange={handleChange} />
            )}
            {activeTab === 'layout' && (
              <LayoutPanel config={config} onChange={handleChange} />
            )}
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div
          className={`flex-1 overflow-y-auto bg-[#F7F4EE] p-6 ${
            mobileView === 'designer' ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-[#78716C]" />
            <span className="text-xs text-[#78716C] font-medium">Live Preview</span>
            <span className="text-[10px] text-[#78716C] bg-[#E7E1D4] px-2 py-0.5 rounded font-mono">
              {config.paperSize}
            </span>
          </div>
          <ReceiptPreview config={config} invoice={invoice} />
        </div>
      </div>
    </div>
  );
}
