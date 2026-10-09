'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';
import { Modal } from '../../components/ui/Modal';
import { KhqrCheckoutModal } from '../../components/payments/KhqrCheckoutModal';
import { useTranslation } from '../../context/I18nContext';
import {
  Pill,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  DollarSign,
  ChevronDown,
  ChevronUp,
  CreditCard,
  User,
  Activity,
} from 'lucide-react';

interface PrescriptionItemInput {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unitPrice: number;
  instructions: string;
}

export default function PrescriptionsPage() {
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'DISPENSED'>('ALL');
  const [expandedRxId, setExpandedRxId] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dispensingId, setDispensingId] = useState<string | null>(null);

  // KHQR payment modal after dispensation
  const [checkoutInvoice, setCheckoutInvoice] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await api.prescriptions.list(statusFilter === 'ALL' ? undefined : statusFilter);
      setPrescriptions(data);
    } catch (err) {
      console.error('Failed to load prescriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter]);

  const filteredPrescriptions = useMemo(() => {
    if (!searchQuery.trim()) return prescriptions;
    const q = searchQuery.toLowerCase();
    return prescriptions.filter((rx) => {
      const rxCode = rx.prescriptionCode?.toLowerCase() || '';
      const pNameEn = rx.patient?.nameEn?.toLowerCase() || '';
      const pNameKh = rx.patient?.nameKh?.toLowerCase() || '';
      const pCode = rx.patient?.patientCode?.toLowerCase() || '';
      return rxCode.includes(q) || pNameEn.includes(q) || pNameKh.includes(q) || pCode.includes(q);
    });
  }, [prescriptions, searchQuery]);

  const counters = useMemo(() => {
    const pending = prescriptions.filter((p) => p.status === 'PENDING').length;
    const dispensed = prescriptions.filter((p) => p.status === 'DISPENSED').length;
    return { all: prescriptions.length, pending, dispensed };
  }, [prescriptions]);

  // Dispense action handler
  const handleDispense = async (rxId: string) => {
    setDispensingId(rxId);
    try {
      await api.prescriptions.dispense(rxId);
      await fetchPrescriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to dispense medication');
    } finally {
      setDispensingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.prescriptions.title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {t.prescriptions.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPrescriptions}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors text-xs"
            title={t.common.refresh}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.prescriptions.newPrescription}</span>
          </button>
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${
            statusFilter === 'ALL' ? 'border-teal-600 ring-2 ring-teal-50 shadow-sm' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{isKm ? 'វេជ្ជបញ្ជាទាំងអស់' : 'All Prescriptions'}</span>
            <Pill className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono">{counters.all}</div>
        </div>

        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${
            statusFilter === 'PENDING' ? 'border-amber-500 ring-2 ring-amber-50 shadow-sm' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Awaiting Dispensation</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-800 mt-1.5 font-mono">{counters.pending}</div>
        </div>

        <div
          onClick={() => setStatusFilter('DISPENSED')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${
            statusFilter === 'DISPENSED' ? 'border-emerald-600 ring-2 ring-emerald-50 shadow-sm' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Dispensed & Invoiced</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-1.5 font-mono">{counters.dispensed}</div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by code, patient name, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'PENDING', 'DISPENSED'] as const).map((st) => (
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

      {/* Prescription List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading pharmacy prescriptions...</p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 space-y-2">
            <Pill className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">No prescriptions found.</p>
          </div>
        ) : (
          filteredPrescriptions.map((rx) => {
            const isExpanded = expandedRxId === rx.id;
            return (
              <div
                key={rx.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Header row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {rx.prescriptionCode}
                      </span>
                      <Link
                        href={`/patients/${rx.patient?.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-teal-700 hover:underline"
                      >
                        {rx.patient?.nameEn}
                        {rx.patient?.nameKh && (
                          <span className="text-xs font-normal text-slate-500 ml-1">({rx.patient?.nameKh})</span>
                        )}
                      </Link>
                      <span className="font-mono text-xs text-slate-400">[{rx.patient?.patientCode}]</span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      {rx.doctor && <span>Prescribed by Dr. {rx.doctor.fullNameEn}</span>}
                      {rx.visit?.visitCode && (
                        <span>
                          Visit: <span className="font-mono text-slate-700">{rx.visit.visitCode}</span>
                        </span>
                      )}
                      <span>{new Date(rx.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 sm:gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900 font-mono">
                        ${Number(rx.totalAmount).toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-400">{rx.items?.length || 0} medications</div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                        rx.status === 'DISPENSED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {rx.status}
                    </span>

                    <div className="flex items-center gap-2">
                      {rx.status === 'PENDING' && (
                        <button
                          onClick={() => handleDispense(rx.id)}
                          disabled={dispensingId === rx.id}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                        >
                          {dispensingId === rx.id ? (
                            <span>Dispensing...</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Dispense</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedRxId(isExpanded ? null : rx.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Medications Table */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-100 p-4">
                    <div className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider text-[11px]">
                      Medications Prescribed
                    </div>
                    <div className="overflow-x-auto touch-scroll">
                      <table className="w-full text-xs text-left min-w-[550px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                            <th className="py-1.5 font-medium">Medicine</th>
                            <th className="py-1.5 font-medium">Dosage</th>
                            <th className="py-1.5 font-medium">Frequency</th>
                            <th className="py-1.5 font-medium">Duration</th>
                            <th className="py-1.5 font-medium text-center">Qty</th>
                            <th className="py-1.5 font-medium text-right">Unit Price</th>
                            <th className="py-1.5 font-medium text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rx.items?.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-100/50">
                              <td className="py-2 font-medium text-slate-900">
                                {item.medicineName}
                                {item.instructions && (
                                  <div className="text-[10px] text-slate-400 italic">{item.instructions}</div>
                                )}
                              </td>
                              <td className="py-2 text-slate-600 font-mono">{item.dosage}</td>
                              <td className="py-2 text-slate-600">{item.frequency}</td>
                              <td className="py-2 text-slate-600">{item.duration}</td>
                              <td className="py-2 text-center font-mono font-medium">{item.quantity}</td>
                              <td className="py-2 text-right font-mono text-slate-500">
                                ${Number(item.unitPrice).toFixed(2)}
                              </td>
                              <td className="py-2 text-right font-mono font-semibold text-slate-900">
                                ${Number(item.subtotal).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {rx.notes && (
                      <div className="mt-3 text-xs text-slate-500 bg-white p-2.5 rounded border border-slate-200">
                        <strong className="text-slate-700">Doctor Notes:</strong> {rx.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Drawer: New Prescription */}
      <CreatePrescriptionDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchPrescriptions();
        }}
      />

      {/* KHQR Checkout Modal */}
      {checkoutInvoice && (
        <KhqrCheckoutModal
          isOpen={isCheckoutOpen}
          invoiceId={checkoutInvoice.id}
          invoice={checkoutInvoice}
          onClose={() => {
            setIsCheckoutOpen(false);
            setCheckoutInvoice(null);
          }}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            setCheckoutInvoice(null);
            fetchPrescriptions();
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// Create Multi-Item Prescription Drawer
// ==========================================
function CreatePrescriptionDrawer({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [activeVisits, setActiveVisits] = useState<any[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-item drug list
  const [items, setItems] = useState<PrescriptionItemInput[]>([
    {
      medicineName: 'Amoxicillin',
      dosage: '500mg',
      frequency: '3 times daily after food',
      duration: '7 days',
      quantity: 21,
      unitPrice: 0.25,
      instructions: 'Complete full course of antibiotics',
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      loadVisits();
    }
  }, [isOpen]);

  const loadVisits = async () => {
    setLoadingVisits(true);
    try {
      const vList = await api.visits.list();
      setActiveVisits(vList);
      if (vList.length > 0) {
        setSelectedVisitId(vList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVisits(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        medicineName: '',
        dosage: '',
        frequency: '2 times daily after food',
        duration: '5 days',
        quantity: 10,
        unitPrice: 0.5,
        instructions: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof PrescriptionItemInput, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const grandTotal = useMemo(() => {
    return items.reduce((acc, curr) => acc + (curr.quantity || 0) * (curr.unitPrice || 0), 0);
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitId) {
      setError('Please select an active clinical visit.');
      return;
    }

    const invalidItem = items.find((it) => !it.medicineName.trim() || !it.dosage.trim());
    if (invalidItem) {
      setError('All medication lines must specify medicine name and dosage.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.prescriptions.create({
        visitId: selectedVisitId,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          medicineName: it.medicineName.trim(),
          dosage: it.dosage.trim(),
          frequency: it.frequency.trim(),
          duration: it.duration.trim(),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          instructions: it.instructions?.trim() || undefined,
        })),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Multi-Item Prescription"
      description="Prescribe pharmaceutical drugs with dosage, frequency, and automated cost calculation"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Visit selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Associate Patient Visit <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedVisitId}
            onChange={(e) => setSelectedVisitId(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          >
            {activeVisits.map((v) => (
              <option key={v.id} value={v.id}>
                {v.patient?.nameEn} ({v.patient?.patientCode}) — {v.visitCode} [{v.reason || 'Checkup'}]
              </option>
            ))}
          </select>
        </div>

        {/* Medication Lines */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
              Prescription Drug Lines ({items.length})
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs text-teal-800 font-semibold hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Medicine</span>
            </button>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {items.map((it, idx) => {
              const subtotal = (it.quantity || 0) * (it.unitPrice || 0);
              return (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Medicine name (e.g. Paracetamol)"
                        required
                        value={it.medicineName}
                        onChange={(e) => handleUpdateItem(idx, 'medicineName', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Dosage (500mg)"
                        required
                        value={it.dosage}
                        onChange={(e) => handleUpdateItem(idx, 'dosage', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Frequency (e.g. 3x daily)"
                        value={it.frequency}
                        onChange={(e) => handleUpdateItem(idx, 'frequency', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Duration (5 days)"
                        value={it.duration}
                        onChange={(e) => handleUpdateItem(idx, 'duration', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={it.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-center">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Unit Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={it.unitPrice}
                        onChange={(e) => handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none font-mono"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between pt-3 sm:pt-0">
                      <span className="text-[11px] text-slate-500">Subtotal:</span>
                      <span className="font-mono font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. Take with warm water)"
                      value={it.instructions}
                      onChange={(e) => handleUpdateItem(idx, 'instructions', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grand Total Display */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">Prescription Grand Total:</span>
            <span className="font-mono font-bold text-base text-teal-900">${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Doctor clinical notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Pharmacy Instructions / Notes</label>
          <textarea
            rows={2}
            placeholder="Special dispensing precautions or instructions"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            {submitting ? 'Creating...' : 'Issue Prescription'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
