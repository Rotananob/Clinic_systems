'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Phone,
  ShieldAlert,
  Activity,
  Pill,
  CreditCard,
  User,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  HeartPulse,
} from 'lucide-react';
import { KhqrCheckoutModal } from '../../../components/payments/KhqrCheckoutModal';

export default function Patient360Page() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'visits' | 'prescriptions' | 'invoices'>('visits');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KHQR Checkout modal state
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const fetchPatient = async () => {
    setIsLoading(true);
    try {
      const data = await api.patients.get(patientId);
      setPatient(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patient 360 profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs">Loading complete clinical history...</span>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-white rounded-xl border border-slate-200 shadow-sm mt-8">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h2 className="text-base font-semibold text-slate-900">Patient Profile Unavailable</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'Patient record could not be found.'}</p>
        <Link
          href="/patients"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Patient Registry
        </Link>
      </div>
    );
  }

  const visits = patient.visits || [];
  const invoices = patient.invoices || [];
  const prescriptions = visits.flatMap((v: any) => v.prescriptions || []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/patients"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Registry</span>
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/visits?patientId=${patient.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Check-in New Visit</span>
          </Link>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{patient.nameEn}</h1>
              {patient.nameKh && (
                <span className="text-base text-slate-500 font-sans">({patient.nameKh})</span>
              )}
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                {patient.patientCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
              <span>Registered on {new Date(patient.createdAt).toLocaleDateString()}</span>
              {patient.nationalId && <span>ID: <code className="font-mono">{patient.nationalId}</code></span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
              {patient.gender}
            </span>
            {patient.bloodType && (
              <span className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-rose-50 text-rose-700 border border-rose-100">
                Blood: {patient.bloodType}
              </span>
            )}
          </div>
        </div>

        {/* Vital Info & Safety Warning */}
        {patient.allergies && patient.allergies.toLowerCase() !== 'none' && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-900 text-xs">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">ALLERGY WARNING:</span>
            <span>{patient.allergies}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-mono">{patient.phone}</span>
          </div>
          {patient.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{patient.address}</span>
            </div>
          )}
          {patient.emergencyContactName && (
            <div className="flex items-center gap-2">
              <HeartPulse className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Contact: {patient.emergencyContactName} ({patient.emergencyContactPhone || 'N/A'})</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('visits')}
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
            activeTab === 'visits'
              ? 'text-teal-700 border-b-2 border-teal-700'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Visits & Medical Records ({visits.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
            activeTab === 'prescriptions'
              ? 'text-teal-700 border-b-2 border-teal-700'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Prescriptions ({prescriptions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
            activeTab === 'invoices'
              ? 'text-teal-700 border-b-2 border-teal-700'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Invoices & Payments ({invoices.length})</span>
        </button>
      </div>

      {/* Tab 1: Visits History */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          {visits.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              No clinical visits recorded yet for this patient.
            </div>
          ) : (
            visits.map((v: any) => (
              <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800">{v.visitCode}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    v.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : v.status === 'IN_CONSULTATION'
                      ? 'bg-teal-50 text-teal-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {v.status}
                  </span>
                </div>

                {v.doctor && (
                  <div className="text-xs text-slate-600 font-medium">
                    Attending Physician: {v.doctor.fullNameEn} {v.doctor.fullNameKh ? `(${v.doctor.fullNameKh})` : ''}
                  </div>
                )}

                {/* Vitals Ribbon */}
                {(v.bloodPressure || v.heartRate || v.temperature || v.weightKg) && (
                  <div className="flex flex-wrap gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {v.bloodPressure && (
                      <span className="font-medium text-slate-700">BP: <span className="font-mono">{v.bloodPressure}</span></span>
                    )}
                    {v.heartRate && (
                      <span className="font-medium text-slate-700">Pulse: <span className="font-mono">{v.heartRate} bpm</span></span>
                    )}
                    {v.temperature && (
                      <span className="font-medium text-slate-700">Temp: <span className="font-mono">{v.temperature}°C</span></span>
                    )}
                    {v.weightKg && (
                      <span className="font-medium text-slate-700">Weight: <span className="font-mono">{v.weightKg} kg</span></span>
                    )}
                  </div>
                )}

                {/* Clinical Notes & Diagnosis */}
                <div className="space-y-1 text-xs">
                  {v.reason && (
                    <p><strong className="text-slate-700">Chief Complaint:</strong> {v.reason}</p>
                  )}
                  {v.diagnosis && (
                    <p className="text-teal-900 font-medium bg-teal-50/50 p-2 rounded">
                      <strong>Diagnosis:</strong> {v.diagnosis}
                    </p>
                  )}
                  {v.notes && (
                    <p className="text-slate-600"><strong>Clinical Notes:</strong> {v.notes}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              No prescriptions recorded.
            </div>
          ) : (
            prescriptions.map((rx: any) => (
              <div key={rx.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700">{rx.prescriptionCode}</span>
                    <span className="text-xs text-slate-500">{new Date(rx.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    rx.status === 'DISPENSED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {rx.status}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {rx.items?.map((item: any) => (
                    <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-900">{item.medicineName} ({item.dosage})</div>
                        <div className="text-slate-500 text-[11px]">{item.frequency} - {item.duration}</div>
                        {item.instructions && (
                          <div className="text-slate-400 text-[10px] italic">{item.instructions}</div>
                        )}
                      </div>
                      <div className="text-right font-mono">
                        <div>Qty: {item.quantity}</div>
                        <div className="text-slate-500">${Number(item.subtotal).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-semibold text-slate-900">
                  <span>Prescription Total</span>
                  <span className="font-mono text-teal-800">${Number(rx.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Invoices & KHQR Checkout */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              No invoices generated for this patient.
            </div>
          ) : (
            invoices.map((inv: any) => (
              <div key={inv.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Issued on {new Date(inv.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono">
                    <div className="text-base font-bold text-slate-900">
                      ${Number(inv.payableAmount).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">{inv.paymentMethod}</div>
                  </div>

                  {inv.status !== 'PAID' && (
                    <button
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setIsCheckoutOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                    >
                      Pay with KHQR
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reusable KHQR Checkout Modal */}
      {selectedInvoice && (
        <KhqrCheckoutModal
          isOpen={isCheckoutOpen}
          invoiceId={selectedInvoice.id}
          onClose={() => {
            setIsCheckoutOpen(false);
            fetchPatient();
          }}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            fetchPatient();
          }}
        />
      )}
    </div>
  );
}
