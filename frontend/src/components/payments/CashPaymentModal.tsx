'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';
import { playPaymentSuccessChime } from '../../lib/chime';
import {
  Banknote,
  X,
  CheckCircle2,
  AlertCircle,
  Receipt,
  User,
  DollarSign,
  Calculator,
} from 'lucide-react';

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess: (settledInvoice: any) => void;
}

export function CashPaymentModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: CashPaymentModalProps) {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const payable = Number(invoice?.payableAmount || 0);
  const [tenderedStr, setTenderedStr] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && invoice) {
      setTenderedStr(payable > 0 ? payable.toFixed(2) : '');
      setError(null);
    }
  }, [isOpen, invoice, payable]);

  if (!isOpen || !invoice) return null;

  const tendered = parseFloat(tenderedStr) || 0;
  const changeDue = Math.max(0, tendered - payable);
  const changeDueKhr = Math.round(changeDue * 4100);
  const payableKhr = Math.round(payable * 4100);
  const isInsufficient = tendered < payable;

  const quickPresets = [
    payable,
    Math.ceil(payable / 5) * 5 || 5,
    Math.ceil(payable / 10) * 10 || 10,
    20,
    50,
    100,
  ].filter((val, idx, self) => val >= payable && self.indexOf(val) === idx).slice(0, 4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInsufficient) {
      setError(
        isKm
          ? 'ចំនួនប្រាក់ដែលបានទទួលតិចជាងចំនួនទឹកប្រាក់ដែលត្រូវទូទាត់'
          : 'Amount tendered cannot be less than total payable.',
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.payments.settleCash(invoice.id, tendered);
      playPaymentSuccessChime();
      onSuccess(res.invoice);
    } catch (err: any) {
      setError(err?.message || 'Failed to record cash payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isKm ? 'ទទួលការទូទាត់ជាសាច់ប្រាក់សុទ្ធ' : 'Cash Payment Collection'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {invoice.invoiceNumber} • {invoice.patient?.nameEn || 'Patient'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Due Overview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                {isKm ? 'ចំនួនត្រូវទូទាត់' : 'Total Amount Due'}
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
                ${payable.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">{isKm ? 'គិតជាប្រាក់រៀល' : 'In Khmer Riel'}</span>
              <span className="font-mono text-sm font-semibold text-slate-700">
                {payableKhr.toLocaleString()} ៛
              </span>
            </div>
          </div>

          {/* Amount Tendered Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isKm ? 'ប្រាក់ទទួលពីអ្នកជំងឺ (Amount Tendered) *' : 'Amount Tendered by Patient ($ USD) *'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                value={tenderedStr}
                onChange={(e) => setTenderedStr(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
              {isKm ? 'ជ្រើសរើសរហ័ស (Quick Amount):' : 'Quick Amount Presets:'}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {quickPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTenderedStr(val.toFixed(2))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                    tendered === val
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  ${val.toFixed(2)}
                </button>
              ))}
            </div>
          </div>

          {/* Change Due Box */}
          <div
            className={`p-4 rounded-xl border transition-colors flex items-center justify-between ${
              isInsufficient
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider block">
                {isKm ? 'ប្រាក់អាប់ត្រូវជូនវិញ (Change Due):' : 'Change Due to Patient:'}
              </span>
              <div className="text-2xl font-bold font-mono mt-0.5">
                ${changeDue.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] opacity-80 block">{isKm ? 'ប្រាក់រៀលអាប់' : 'In Riel'}</span>
              <span className="font-mono text-sm font-semibold">
                {changeDueKhr.toLocaleString()} ៛
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {isKm ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || isInsufficient}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isKm ? 'កំពុងកត់ត្រា...' : 'Settling...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isKm ? 'បញ្ជាក់ការទទួលប្រាក់សុទ្ធ' : 'Confirm Cash Settle'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
