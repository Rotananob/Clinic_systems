'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';
import { KhqrCheckoutModal } from '../../components/payments/KhqrCheckoutModal';
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
} from 'lucide-react';

export default function BillingPage() {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PENDING' | 'PAID'>('ALL');

  // KHQR modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter((inv) => {
      const invNum = inv.invoiceNumber?.toLowerCase() || '';
      const pNameEn = inv.patient?.nameEn?.toLowerCase() || '';
      const pNameKh = inv.patient?.nameKh?.toLowerCase() || '';
      const pCode = inv.patient?.patientCode?.toLowerCase() || '';
      return invNum.includes(q) || pNameEn.includes(q) || pNameKh.includes(q) || pCode.includes(q);
    });
  }, [invoices, searchQuery]);

  // Financial summary
  const summary = useMemo(() => {
    let totalRevenue = 0;
    let pendingAmount = 0;
    let unpaidCount = 0;
    let paidCount = 0;

    invoices.forEach((inv) => {
      const amt = Number(inv.payableAmount) || 0;
      if (inv.status === 'PAID') {
        totalRevenue += amt;
        paidCount++;
      } else {
        pendingAmount += amt;
        unpaidCount++;
      }
    });

    return { totalRevenue, pendingAmount, unpaidCount, paidCount };
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
            onClick={fetchInvoices}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors text-xs"
            title="Refresh invoices"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Settled Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-2 font-mono">
            ${summary.totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{summary.paidCount} settled transactions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Unsettled / Pending Due</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-2 font-mono">
            ${summary.pendingAmount.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{summary.unpaidCount} unpaid invoices</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Payment Engine Engine</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>pay-helper (Tag 01=12)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">ABA Mobile & Bakong Real-Time Settlement</div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by invoice #, patient name, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'UNPAID', 'PENDING', 'PAID'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                <div className="flex items-center gap-4 self-end md:self-center">
                  <div className="text-right font-mono">
                    <div className="text-base font-bold text-slate-900">
                      {inv.currency === 'KHR' ? '៛' : '$'}{Number(inv.payableAmount).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">{inv.paymentMethod}</div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : inv.status === 'PENDING'
                        ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {inv.status}
                  </span>

                  {inv.status !== 'PAID' ? (
                    <button
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setIsCheckoutOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{isKm ? 'បង់ប្រាក់ KHQR' : 'Pay with KHQR'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setIsCheckoutOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      title="View QR Code"
                    >
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isKm ? 'បានទូទាត់ (មើល QR)' : 'Settled (View QR)'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
          onSuccess={() => {
            setIsCheckoutOpen(false);
            setSelectedInvoice(null);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}
