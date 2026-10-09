'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';
import { KhqrCheckoutModal } from '../../components/payments/KhqrCheckoutModal';
import { ClinicReceiptModal } from '../../components/payments/ClinicReceiptModal';
import { CashPaymentModal } from '../../components/payments/CashPaymentModal';
import { useTranslation } from '../../context/I18nContext';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  DollarSign,
  QrCode,
  Building,
  User,
  Activity,
  Receipt,
  ShieldCheck,
  Plus,
  X,
  UserPlus,
  Banknote,
  Printer,
  Sparkles,
  Calendar,
  Edit3,
  FileText,
} from 'lucide-react';

const servicePresets = [
  { labelKm: 'ពិនិត្យទូទៅ', labelEn: 'General Consultation', amount: '10.00' },
  { labelKm: 'ពិគ្រោះ + ចេញថ្នាំ', labelEn: 'Consult & Prescription', amount: '15.00' },
  { labelKm: 'អេកូសាស្ត្រ', labelEn: 'Ultrasound Scan', amount: '25.00' },
  { labelKm: 'ពិនិត្យឈាម Lab', labelEn: 'Blood & Lab Analysis', amount: '20.00' },
  { labelKm: 'ចាក់ថ្នាំ/របួស', labelEn: 'Injection & Wound Care', amount: '8.00' },
  { labelKm: 'សេវាធ្មេញ', labelEn: 'Dental Treatment', amount: '30.00' },
];

export default function BillingPage() {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PENDING' | 'PAID'>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'MONTH'>('ALL');
  const [exactDate, setExactDate] = useState<string>('');

  // Quick Invoice Creation Modal
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickForm, setQuickForm] = useState({
    nameEn: '',
    nameKh: '',
    phone: '',
    amount: '',
    currency: 'USD',
    reason: 'សេវាពិនិត្យ និងព្យាបាល (Consultation & Care)',
  });

  // KHQR modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Cash payment modal
  const [cashInvoice, setCashInvoice] = useState<any>(null);
  const [isCashOpen, setIsCashOpen] = useState(false);

  // Official Receipt modal
  const [receiptInvoice, setReceiptInvoice] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Edit & Correct Invoice modal
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    status: 'PENDING',
    payableAmount: '',
    paymentMethod: 'KHQR',
    notes: '',
  });

  // Real-time payment confirmation popup notice
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<{
    invoiceNumber: string;
    amount: number | string;
    currency?: string;
    patientName?: string;
    tranId?: string;
    invoice: any;
  } | null>(null);

  useEffect(() => {
    if (!paymentSuccessNotice) return;
    const timer = setTimeout(() => {
      setPaymentSuccessNotice(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [paymentSuccessNotice]);

  const handleOpenEdit = (inv: any) => {
    setEditingInvoice(inv);
    setEditForm({
      status: inv.status,
      payableAmount: Number(inv.payableAmount).toFixed(2),
      paymentMethod: inv.paymentMethod || 'KHQR',
      notes: '',
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    setEditLoading(true);
    try {
      await api.payments.updateInvoice(editingInvoice.id, {
        status: editForm.status,
        payableAmount: parseFloat(editForm.payableAmount),
        paymentMethod: editForm.paymentMethod,
        notes: editForm.notes,
      });
      setIsEditOpen(false);
      setEditingInvoice(null);
      await fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to update invoice');
    } finally {
      setEditLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await api.payments.listInvoices(statusFilter === 'ALL' ? undefined : { status: statusFilter });
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleCreateQuickInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.nameEn.trim() || !quickForm.amount) {
      alert(isKm ? 'សូមបញ្ចូលឈ្មោះអ្នកជំងឺ និងចំនួនទឹកប្រាក់' : 'Please enter patient name and amount');
      return;
    }
    const amt = parseFloat(quickForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert(isKm ? 'ចំនួនទឹកប្រាក់មិនត្រឹមត្រូវ' : 'Invalid amount');
      return;
    }

    setQuickLoading(true);
    try {
      const createdInvoice = await api.payments.createQuickInvoice({
        nameEn: quickForm.nameEn.trim(),
        nameKh: quickForm.nameKh.trim() || undefined,
        phone: quickForm.phone.trim() || undefined,
        amount: amt,
        currency: quickForm.currency,
        reason: quickForm.reason.trim() || undefined,
      });

      setQuickForm({
        nameEn: '',
        nameKh: '',
        phone: '',
        amount: '',
        currency: 'USD',
        reason: 'សេវាពិនិត្យ និងព្យាបាល (Consultation & Care)',
      });
      setIsQuickModalOpen(false);
      fetchInvoices();

      // Immediately show KHQR on screen for patient to scan
      setSelectedInvoice(createdInvoice);
      setIsCheckoutOpen(true);
    } catch (err: any) {
      console.error('Failed to create quick invoice', err);
      alert(err?.message || 'Failed to create invoice');
    } finally {
      setQuickLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (exactDate) {
      list = list.filter((inv) => {
        const dStr = new Date(inv.createdAt).toISOString().split('T')[0];
        return dStr === exactDate;
      });
    } else if (timeFilter === 'TODAY') {
      const today = new Date().toDateString();
      list = list.filter((inv) => new Date(inv.createdAt).toDateString() === today);
    } else if (timeFilter === 'MONTH') {
      const now = new Date();
      list = list.filter((inv) => {
        const d = new Date(inv.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((inv) => {
      const invNum = inv.invoiceNumber?.toLowerCase() || '';
      const pNameEn = inv.patient?.nameEn?.toLowerCase() || '';
      const pNameKh = inv.patient?.nameKh?.toLowerCase() || '';
      const pCode = inv.patient?.patientCode?.toLowerCase() || '';
      return invNum.includes(q) || pNameEn.includes(q) || pNameKh.includes(q) || pCode.includes(q);
    });
  }, [invoices, searchQuery, timeFilter, exactDate]);

  // Financial summary
  const summary = useMemo(() => {
    let totalRevenue = 0;
    let pendingAmount = 0;
    let unpaidCount = 0;
    let paidCount = 0;
    let todayRevenue = 0;
    let todayPaidCount = 0;

    const todayStr = new Date().toDateString();

    invoices.forEach((inv) => {
      const amt = Number(inv.payableAmount) || 0;
      const isToday = new Date(inv.createdAt).toDateString() === todayStr;
      if (inv.status === 'PAID') {
        totalRevenue += amt;
        paidCount++;
        if (isToday) {
          todayRevenue += amt;
          todayPaidCount++;
        }
      } else {
        pendingAmount += amt;
        unpaidCount++;
      }
    });

    return { totalRevenue, pendingAmount, unpaidCount, paidCount, todayRevenue, todayPaidCount };
  }, [invoices]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Billing & Dynamic KHQR Invoicing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Cashier collections, Tag 01=12 dynamic QR generator, ABA & Bakong instant settlement verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQuickModalOpen(true)}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isKm ? 'បង្កើតវិក្កយបត្រថ្មី (Add & Pay)' : 'Create Invoice & Scan'}</span>
          </button>
          <button
            onClick={fetchInvoices}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors text-xs"
            title="Refresh invoices"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm card-hover relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {isKm ? 'ចំណូលទូទាត់រួចសរុប' : 'Total Settled Revenue'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-2 font-mono">
            ${summary.totalRevenue.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
            <span>≈ {Math.round(summary.totalRevenue * 4100).toLocaleString()} ៛</span>
            <span className="text-emerald-700 font-semibold">{summary.paidCount} txns</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm card-hover relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {isKm ? 'ចំណូលថ្ងៃនេះ (Today)' : "Today's Settled"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-900 mt-2 font-mono">
            ${summary.todayRevenue.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
            <span>≈ {Math.round(summary.todayRevenue * 4100).toLocaleString()} ៛</span>
            <span className="text-teal-700 font-semibold">{summary.todayPaidCount} today</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm card-hover relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {isKm ? 'រង់ចាំទូទាត់ (Pending)' : 'Unsettled / Pending'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-2 font-mono">
            ${summary.pendingAmount.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
            <span>≈ {Math.round(summary.pendingAmount * 4100).toLocaleString()} ៛</span>
            <span className="text-amber-700 font-semibold">{summary.unpaidCount} unpaid</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm card-hover relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {isKm ? 'អត្រាប្តូរប្រាក់ & KHQR' : 'Settlement Desk & Rate'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 mt-2 flex items-center gap-1.5">
            <span className="font-mono text-teal-800 text-lg">1 USD = 4,100 KHR</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
            <span className="text-emerald-700 font-medium">Tag 01=12 Dynamic</span>
            <span className="font-mono text-slate-600">Bakong & ABA</span>
          </div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-[#FDFBF7] p-3.5 rounded-2xl border border-[#E7E1D4] shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by invoice #, patient name, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F6F1E6] border border-[#E0D8C8] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white transition-colors text-stone-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Specific Exact Date Picker */}
          <div className="flex items-center gap-1.5 bg-[#F2EDE2] p-1 px-2.5 rounded-xl text-xs border border-[#DFD6C6]">
            <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <input
              type="date"
              value={exactDate}
              onChange={(e) => {
                setExactDate(e.target.value);
                if (e.target.value) setTimeFilter('ALL');
              }}
              className="bg-transparent text-xs text-stone-800 focus:outline-none font-mono"
              title={isKm ? 'ស្វែងរកតាមថ្ងៃជាក់លាក់' : 'Search by exact date'}
            />
            {exactDate && (
              <button
                type="button"
                onClick={() => setExactDate('')}
                className="text-stone-400 hover:text-stone-700 p-0.5"
                title={isKm ? 'ជម្រះថ្ងៃ' : 'Clear date'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-1 bg-[#F2EDE2] p-1 rounded-xl text-xs border border-[#DFD6C6]">
            <span className="text-[10px] text-stone-400 font-semibold px-1 uppercase flex items-center gap-0.5">
              <Calendar className="w-3 h-3" />
            </span>
            {(
              [
                { id: 'ALL', labelKm: 'ទាំងអស់', labelEn: 'All Time' },
                { id: 'TODAY', labelKm: 'ថ្ងៃនេះ', labelEn: 'Today' },
                { id: 'MONTH', labelKm: 'ខែនេះ', labelEn: 'Month' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTimeFilter(t.id);
                  setExactDate('');
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  timeFilter === t.id && !exactDate
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {isKm ? t.labelKm : t.labelEn}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            {(['ALL', 'UNPAID', 'PENDING', 'PAID'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading billing invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CreditCard className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">No invoices found matching criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 card-hover"
              >
                {/* Left info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      {inv.invoiceNumber}
                    </span>
                    <Link
                      href={`/patients/${inv.patient?.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-teal-700 hover:underline"
                    >
                      {inv.patient?.nameEn}
                      {inv.patient?.nameKh && (
                        <span className="text-xs font-normal text-slate-500 ml-1">({inv.patient?.nameKh})</span>
                      )}
                    </Link>
                    <span className="font-mono text-xs text-slate-400">[{inv.patient?.patientCode}]</span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {inv.visit?.visitCode && (
                      <span>
                        Visit: <span className="font-mono text-slate-700">{inv.visit.visitCode}</span>
                        {inv.visit.reason && ` (${inv.visit.reason})`}
                      </span>
                    )}
                    <span>Issued: {new Date(inv.createdAt).toLocaleString()}</span>
                    {inv.paidAt && (
                      <span className="text-emerald-700 font-medium">
                        Paid: {new Date(inv.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Amount & KHQR Trigger */}
                <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 sm:gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right font-mono">
                    <div className="text-base font-bold text-slate-900">
                      {inv.currency === 'KHR' ? '៛' : '$'}{Number(inv.payableAmount).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {inv.currency === 'KHR'
                        ? `≈ $${(Number(inv.payableAmount) / 4100).toFixed(2)}`
                        : `≈ ${Math.round(Number(inv.payableAmount) * 4100).toLocaleString()} ៛`}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : inv.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {inv.status === 'PENDING' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                    )}
                    {inv.status === 'PAID' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    )}
                    {inv.status}
                  </span>

                  {inv.status !== 'PAID' ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsCheckoutOpen(true);
                        }}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{isKm ? 'បង់ KHQR' : 'KHQR'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCashInvoice(inv);
                          setIsCashOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        title={isKm ? 'ទទួលប្រាក់សុទ្ធ' : 'Collect Cash'}
                      >
                        <Banknote className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isKm ? 'ប្រាក់សុទ្ធ' : 'Cash'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(inv)}
                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                        title={isKm ? 'កែប្រែស្ថានភាព ឬទឹកប្រាក់' : 'Edit Invoice'}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isKm ? 'កែប្រែ' : 'Edit'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsCheckoutOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                        title="View QR Code"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isKm ? 'មើល QR' : 'QR Code'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setReceiptInvoice(inv);
                          setIsReceiptOpen(true);
                        }}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title={isKm ? 'បោះពុម្ពបង្កាន់ដៃផ្លូវការ' : 'Print Official Receipt'}
                      >
                        <Printer className="w-3.5 h-3.5 text-teal-700" />
                        <span>{isKm ? 'បង្កាន់ដៃ' : 'Receipt'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(inv)}
                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                        title={isKm ? 'កែប្រែស្ថានភាព (កែពី Paid មកវិញ)' : 'Edit / Revert Invoice'}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isKm ? 'កែប្រែ' : 'Edit'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Patient & Charge Modal */}
      {isQuickModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isKm ? 'បង្កើតវិក្កយបត្រ និងស្កេន KHQR' : 'Quick Invoice & KHQR Scan'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isKm
                      ? 'បញ្ចូលព័ត៌មានអ្នកជំងឺដើម្បីបង្កើត QR Code លើអេក្រង់ Laptop ភ្លាមៗ'
                      : 'Input patient & charge to show scannable QR on laptop screen'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateQuickInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ឈ្មោះអ្នកជំងឺ (ជាអក្សរឡាតាំង) *' : 'Patient Name (English) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isKm ? 'ឧ. Sok Dara' : 'e.g. Sok Dara'}
                  value={quickForm.nameEn}
                  onChange={(e) => setQuickForm({ ...quickForm, nameEn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKm ? 'ឈ្មោះជាភាសាខ្មែរ (បើមាន)' : 'Name (Khmer, Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isKm ? 'ឧ. សុខ ដារ៉ា' : 'e.g. សុខ ដារ៉ា'}
                    value={quickForm.nameKh}
                    onChange={(e) => setQuickForm({ ...quickForm, nameKh: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKm ? 'លេខទូរស័ព្ទ (បើមាន)' : 'Phone Number (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="012 345 678"
                    value={quickForm.phone}
                    onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                  />
                </div>
              </div>

              {/* Clinical Quick Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isKm ? 'កញ្ចប់សេវារហ័ស (Quick Presets):' : 'Quick Service Presets:'}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {servicePresets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setQuickForm({
                          ...quickForm,
                          amount: p.amount,
                          reason: isKm ? p.labelKm : p.labelEn,
                        })
                      }
                      className="p-2 text-left rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 transition-colors"
                    >
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {isKm ? p.labelKm : p.labelEn}
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-teal-700 mt-0.5">
                        ${p.amount}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKm ? 'ចំនួនទឹកប្រាក់ទូទាត់ *' : 'Amount to Charge *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="10.00"
                      value={quickForm.amount}
                      onChange={(e) => setQuickForm({ ...quickForm, amount: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKm ? 'រូបិយប័ណ្ណ' : 'Currency'}
                  </label>
                  <select
                    value={quickForm.currency}
                    onChange={(e) => setQuickForm({ ...quickForm, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KHR">KHR (៛)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'មូលហេតុ ឬសេវាកម្ម' : 'Service / Care Reason'}
                </label>
                <input
                  type="text"
                  placeholder={isKm ? 'សេវាពិនិត្យ និងព្យាបាល' : 'General Consultation & Care'}
                  value={quickForm.reason}
                  onChange={(e) => setQuickForm({ ...quickForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsQuickModalOpen(false)}
                  disabled={quickLoading}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={quickLoading}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {quickLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isKm ? 'កំពុងបង្កើត...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>{isKm ? 'បង្កើត & បង្ហាញ QR Code ស្កេន' : 'Create & Show QR Code'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KHQR Checkout Modal */}
      {selectedInvoice && (
        <KhqrCheckoutModal
          isOpen={isCheckoutOpen}
          invoice={selectedInvoice}
          invoiceId={selectedInvoice.id}
          onClose={() => {
            setIsCheckoutOpen(false);
            setSelectedInvoice(null);
          }}
          onPaymentSuccess={(settledInv) => {
            fetchInvoices();
            if (settledInv) {
              setReceiptInvoice(settledInv);
              setPaymentSuccessNotice({
                invoiceNumber: settledInv.invoiceNumber,
                amount: settledInv.payableAmount,
                currency: settledInv.currency || 'USD',
                patientName: settledInv.patient?.nameEn || settledInv.patient?.nameKh || 'Patient',
                tranId: settledInv.transactions?.[0]?.tranId || 'N/A',
                invoice: settledInv,
              });
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('payment-confirmed', { detail: { invoice: settledInv } }));
              }
            }
          }}
          onSuccess={(settledInv) => {
            setIsCheckoutOpen(false);
            setSelectedInvoice(null);
            fetchInvoices();
            if (settledInv) {
              setReceiptInvoice(settledInv);
              setIsReceiptOpen(true);
              setPaymentSuccessNotice({
                invoiceNumber: settledInv.invoiceNumber,
                amount: settledInv.payableAmount,
                currency: settledInv.currency || 'USD',
                patientName: settledInv.patient?.nameEn || settledInv.patient?.nameKh || 'Patient',
                tranId: settledInv.transactions?.[0]?.tranId || 'N/A',
                invoice: settledInv,
              });
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('payment-confirmed', { detail: { invoice: settledInv } }));
              }
            }
          }}
        />
      )}

      {/* Cash Payment Modal */}
      {cashInvoice && (
        <CashPaymentModal
          isOpen={isCashOpen}
          invoice={cashInvoice}
          onClose={() => {
            setIsCashOpen(false);
            setCashInvoice(null);
          }}
          onSuccess={(settledInv) => {
            setIsCashOpen(false);
            setCashInvoice(null);
            fetchInvoices();
            setReceiptInvoice(settledInv);
            setIsReceiptOpen(true);
            setPaymentSuccessNotice({
              invoiceNumber: settledInv.invoiceNumber,
              amount: settledInv.payableAmount,
              currency: settledInv.currency || 'USD',
              patientName: settledInv.patient?.nameEn || settledInv.patient?.nameKh || 'Patient',
              tranId: 'CASH-' + Date.now().toString().slice(-6),
              invoice: settledInv,
            });
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('payment-confirmed', { detail: { invoice: settledInv } }));
            }
          }}
        />
      )}

      {/* Official Clinic Receipt Modal */}
      {receiptInvoice && (
        <ClinicReceiptModal
          isOpen={isReceiptOpen}
          invoice={receiptInvoice}
          onClose={() => {
            setIsReceiptOpen(false);
            setReceiptInvoice(null);
          }}
        />
      )}

      {/* Edit Invoice Modal */}
      {isEditOpen && editingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isKm ? 'កែសម្រួលវិក្កយបត្រ' : 'Edit Invoice Details'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {editingInvoice.invoiceNumber} - {editingInvoice.patient?.nameEn || 'Patient'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingInvoice(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ស្ថានភាពវិក្កយបត្រ (Invoice Status)' : 'Invoice Status'}
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                >
                  <option value="PENDING">{isKm ? 'PENDING (រង់ចាំការទូទាត់)' : 'PENDING (Awaiting Payment)'}</option>
                  <option value="UNPAID">{isKm ? 'UNPAID (មិនទាន់បង់)' : 'UNPAID (Unpaid)'}</option>
                  <option value="PAID">{isKm ? 'PAID (បានទូទាត់រួច)' : 'PAID (Settled)'}</option>
                </select>
                {editingInvoice.status === 'PAID' && editForm.status !== 'PAID' && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      {isKm
                        ? 'ការប្ដូរពី PAID មក PENDING នឹងកែប្រែស្ថានភាពប្រតិបត្តិការ និងសម្អាតកាលបរិច្ឆេទបង់ប្រាក់ដោយស្វ័យប្រវត្តិ។'
                        : 'Reverting from PAID to PENDING will reset transaction status and clear settlement timestamp.'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ចំនួនទឹកប្រាក់ត្រូវបង់' : 'Payable Amount'} ({editingInvoice.currency || 'USD'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editForm.payableAmount}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, payableAmount: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'វិធីសាស្ត្រទូទាត់' : 'Payment Method'}
                </label>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                >
                  <option value="KHQR">KHQR (Dynamic Tag 01=12)</option>
                  <option value="CASH">CASH (ប្រាក់សុទ្ធ)</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER (ផ្ទេរផ្ទាល់)</option>
                  <option value="CARD">POS / CARD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'មូលហេតុ ឬចំណាំបុគ្គលិក (Staff Notes / Audit)' : 'Staff Notes / Audit Log'}
                </label>
                <input
                  type="text"
                  placeholder={
                    isKm
                      ? 'ឧ. ច្រឡំចុច Paid, បញ្ចុះតម្លៃបន្ថែម...'
                      : 'e.g. Accidental click, discount adjustment...'
                  }
                  value={editForm.notes}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingInvoice(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {editLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isKm ? 'រក្សាទុកការកែប្រែ' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Payment Confirmation Popup Notice */}
      {paymentSuccessNotice && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md w-full bg-white border-2 border-emerald-500 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">
                  {isKm ? 'ការទូទាត់ត្រូវបានផ្ទៀងផ្ទាត់ជោគជ័យ!' : 'Payment Verified Successfully!'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  PAID
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-mono truncate">
                {paymentSuccessNotice.invoiceNumber} -{' '}
                <span className="font-sans font-semibold text-slate-900">
                  {paymentSuccessNotice.patientName}
                </span>
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="font-bold text-emerald-800 font-mono text-sm">
                  ${Number(paymentSuccessNotice.amount).toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  [TranID: {paymentSuccessNotice.tranId || 'N/A'}]
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReceiptInvoice(paymentSuccessNotice.invoice);
                    setIsReceiptOpen(true);
                  }}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{isKm ? 'មើលវិក្កយបត្រ Real-Time & បោះពុម្ព' : 'View Real-Time Invoice'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentSuccessNotice(null)}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {isKm ? 'បិទ' : 'Dismiss'}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPaymentSuccessNotice(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
