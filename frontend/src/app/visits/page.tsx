'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';
import { Modal } from '../../components/ui/Modal';
import { useTranslation } from '../../context/I18nContext';
import {
  Activity,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  FileText,
  HeartPulse,
  ArrowRight,
  ShieldAlert,
  DollarSign,
  Filter,
  RefreshCw,
  Calendar,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';

export default function VisitsPage() {
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED'>('ALL');

  // Modals state
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [isConsultOpen, setIsConsultOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

  // Doctors list for checkin / consultation
  const [doctors, setDoctors] = useState<any[]>([]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const data = await api.visits.list(statusFilter === 'ALL' ? undefined : { status: statusFilter });
      setVisits(data);
    } catch (err) {
      console.error('Failed to load visits queue', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const docs = await api.users.getDoctors();
      setDoctors(docs);
    } catch (err) {
      console.error('Failed to load doctors list', err);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [statusFilter]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filtered queue items
  const filteredVisits = useMemo(() => {
    if (!searchQuery.trim()) return visits;
    const q = searchQuery.toLowerCase();
    return visits.filter((v) => {
      const pNameEn = v.patient?.nameEn?.toLowerCase() || '';
      const pNameKh = v.patient?.nameKh?.toLowerCase() || '';
      const pCode = v.patient?.patientCode?.toLowerCase() || '';
      const vCode = v.visitCode?.toLowerCase() || '';
      const phone = v.patient?.phone || '';
      return pNameEn.includes(q) || pNameKh.includes(q) || pCode.includes(q) || vCode.includes(q) || phone.includes(q);
    });
  }, [visits, searchQuery]);

  // Queue Counters
  const counters = useMemo(() => {
    const waiting = visits.filter((v) => v.status === 'WAITING').length;
    const inConsult = visits.filter((v) => v.status === 'IN_CONSULTATION').length;
    const completed = visits.filter((v) => v.status === 'COMPLETED').length;
    return { all: visits.length, waiting, inConsult, completed };
  }, [visits]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.visits.title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {t.visits.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchVisits}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors text-xs"
            title={t.common.refresh}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/queue"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <span>{t.nav.queue}</span>
          </Link>

          <button
            onClick={() => setIsCheckinOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.visits.checkin}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${
            statusFilter === 'ALL' ? 'border-teal-600 ring-2 ring-teal-50 shadow-sm' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{isKm ? 'វត្តមានអ្នកជំងឺទាំងអស់' : 'All Registered Visits'}</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono">{counters.all}</div>
        </div>

        <div
          onClick={() => setStatusFilter('WAITING')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${
            statusFilter === 'WAITING' ? 'border-amber-500 ring-2 ring-amber-50 shadow-sm' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">{t.visits.waiting}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-800 mt-1.5 font-mono">{counters.waiting}</div>
        </div>

        <div
          onClick={() => setStatusFilter('IN_CONSULTATION')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${
            statusFilter === 'IN_CONSULTATION' ? 'border-teal-600 ring-2 ring-teal-50 shadow-sm' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-teal-700">{t.visits.inConsultation}</span>
            <Stethoscope className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-teal-800 mt-1.5 font-mono">{counters.inConsult}</div>
        </div>

        <div
          onClick={() => setStatusFilter('COMPLETED')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${
            statusFilter === 'COMPLETED' ? 'border-emerald-600 ring-2 ring-emerald-50 shadow-sm' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">{t.visits.completed}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-1.5 font-mono">{counters.completed}</div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by patient, code, phone, or visit ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'WAITING', 'IN_CONSULTATION', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Queue' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Queue List / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading outpatient queue...</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Activity className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">No clinical visits found matching filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredVisits.map((v, idx) => (
              <div
                key={v.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Patient and Visit identity */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      {v.visitCode}
                    </span>
                    <Link
                      href={`/patients/${v.patient?.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-teal-700 hover:underline flex items-center gap-1"
                    >
                      <span>{v.patient?.nameEn}</span>
                      {v.patient?.nameKh && (
                        <span className="text-xs font-normal text-slate-500">({v.patient?.nameKh})</span>
                      )}
                    </Link>
                    <span className="text-xs text-slate-400 font-mono">[{v.patient?.patientCode}]</span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 pl-8">
                    <span>
                      <strong className="text-slate-400">Chief Complaint:</strong> {v.reason || 'General checkup'}
                    </span>
                    {v.doctor && (
                      <span>
                        <strong className="text-slate-400">Physician:</strong> Dr. {v.doctor.fullNameEn}
                      </span>
                    )}
                    <span className="text-slate-400">
                      Check-in: {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Vitals summary if recorded */}
                  {(v.bloodPressure || v.heartRate || v.temperature || v.weightKg) && (
                    <div className="flex flex-wrap items-center gap-2 pl-8 pt-1 text-[11px]">
                      {v.bloodPressure && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                          BP: {v.bloodPressure}
                        </span>
                      )}
                      {v.heartRate && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                          Pulse: {v.heartRate} bpm
                        </span>
                      )}
                      {v.temperature && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                          Temp: {v.temperature}°C
                        </span>
                      )}
                      {v.weightKg && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                          Weight: {v.weightKg} kg
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Status and Actions */}
                <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 sm:gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                      v.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : v.status === 'IN_CONSULTATION'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {v.status.replace('_', ' ')}
                  </span>

                  {/* Actions according to workflow */}
                  <div className="flex items-center gap-1.5">
                    {/* Record Vitals button */}
                    <button
                      onClick={() => {
                        setSelectedVisit(v);
                        setIsVitalsOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                      title="Record or update patient vitals"
                    >
                      <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                      <span>Vitals</span>
                    </button>

                    {/* Consultation button */}
                    {v.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => {
                          setSelectedVisit(v);
                          setIsConsultOpen(true);
                        }}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Consult</span>
                      </button>
                    ) : (
                      <Link
                        href={`/patients/${v.patient?.id}`}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Record</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer 1: Check-in Patient */}
      <CheckinVisitDrawer
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        doctors={doctors}
        onSuccess={() => {
          setIsCheckinOpen(false);
          fetchVisits();
        }}
      />

      {/* Drawer 2: Record Vitals */}
      {selectedVisit && (
        <RecordVitalsDrawer
          isOpen={isVitalsOpen}
          onClose={() => {
            setIsVitalsOpen(false);
            setSelectedVisit(null);
          }}
          visit={selectedVisit}
          onSuccess={() => {
            setIsVitalsOpen(false);
            setSelectedVisit(null);
            fetchVisits();
          }}
        />
      )}

      {/* Drawer 3: Doctor Consultation */}
      {selectedVisit && (
        <DoctorConsultationDrawer
          isOpen={isConsultOpen}
          onClose={() => {
            setIsConsultOpen(false);
            setSelectedVisit(null);
          }}
          visit={selectedVisit}
          doctors={doctors}
          onSuccess={() => {
            setIsConsultOpen(false);
            setSelectedVisit(null);
            fetchVisits();
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// Check-in Patient Drawer
// ==========================================
function CheckinVisitDrawer({
  isOpen,
  onClose,
  doctors,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  doctors: any[];
  onSuccess: () => void;
}) {
  const [patientSearch, setPatientSearch] = useState('');
  const [patientCandidates, setPatientCandidates] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchingPatients, setSearchingPatients] = useState(false);

  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [consultationFee, setConsultationFee] = useState('5.00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search patients as user types
  useEffect(() => {
    if (!patientSearch.trim() || patientSearch.length < 2) {
      setPatientCandidates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await api.patients.list({ search: patientSearch, limit: 5 });
        setPatientCandidates(res.data || []);
      } catch (err) {
        // silent
      } finally {
        setSearchingPatients(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please search and select a patient first.');
      return;
    }
    if (!reason.trim()) {
      setError('Chief complaint / reason for visit is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.visits.create({
        patientId: selectedPatient.id,
        doctorId: doctorId || undefined,
        reason: reason.trim(),
        symptoms: symptoms.trim() || undefined,
        consultationFee: parseFloat(consultationFee) || 5.00,
      });
      // reset form
      setSelectedPatient(null);
      setPatientSearch('');
      setReason('');
      setSymptoms('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to check-in patient');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Outpatient Visit Check-In"
      description="Register an outpatient arrival into the consultation queue"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Patient Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Search Patient <span className="text-rose-500">*</span>
          </label>
          {selectedPatient ? (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-900">{selectedPatient.nameEn}</span>{' '}
                <span className="font-mono text-teal-800">[{selectedPatient.patientCode}]</span>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Phone: {selectedPatient.phone} • Blood: {selectedPatient.bloodType || 'N/A'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-xs text-teal-800 font-semibold hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 relative">
              <input
                type="text"
                placeholder="Type name, phone number, or patient code..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
              />
              {searchingPatients && (
                <div className="text-[11px] text-slate-400">Searching registry...</div>
              )}
              {patientCandidates.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {patientCandidates.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientCandidates([]);
                      }}
                      className="w-full p-2.5 text-left hover:bg-slate-50 text-xs flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{p.nameEn}</div>
                        <div className="text-[11px] text-slate-500">Phone: {p.phone}</div>
                      </div>
                      <span className="font-mono text-xs text-teal-800 font-medium">{p.patientCode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Doctor Assignment */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Attending Physician / Doctor
          </label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          >
            <option value="">-- General Queue (Any Available Physician) --</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                Dr. {doc.fullNameEn} {doc.fullNameKh ? `(${doc.fullNameKh})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Chief Complaint / Reason */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Chief Complaint / Reason for Visit <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Fever, persistent cough for 3 days, acute abdominal pain"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          />
        </div>

        {/* Symptoms */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Observed Symptoms (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. High temperature, chills, sore throat, fatigue"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          />
        </div>

        {/* Consultation Fee */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Standard Consultation Fee (USD)
          </label>
          <div className="relative">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="number"
              step="0.01"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>
        </div>

        {/* Submit */}
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
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            {submitting ? 'Registering...' : 'Add to Queue'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ==========================================
// Record Vitals Drawer (With BMI Calculation)
// ==========================================
function RecordVitalsDrawer({
  isOpen,
  onClose,
  visit,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  visit: any;
  onSuccess: () => void;
}) {
  const [bloodPressure, setBloodPressure] = useState(visit.bloodPressure || '');
  const [heartRate, setHeartRate] = useState(visit.heartRate?.toString() || '');
  const [temperature, setTemperature] = useState(visit.temperature?.toString() || '');
  const [weightKg, setWeightKg] = useState(visit.weightKg?.toString() || '');
  const [heightCm, setHeightCm] = useState(visit.heightCm?.toString() || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live BMI calculation
  const bmiInfo = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (!w || !h || h <= 0) return null;
    const heightInMeters = h / 100;
    const bmi = w / (heightInMeters * heightInMeters);
    let category = 'Normal';
    let color = 'text-emerald-700 bg-emerald-50 border-emerald-200';

    if (bmi < 18.5) {
      category = 'Underweight';
      color = 'text-amber-700 bg-amber-50 border-amber-200';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight';
      color = 'text-amber-800 bg-amber-50 border-amber-200';
    } else if (bmi >= 30) {
      category = 'Obese';
      color = 'text-rose-800 bg-rose-50 border-rose-200';
    }

    return { value: bmi.toFixed(1), category, color };
  }, [weightKg, heightCm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.visits.updateVitals(visit.id, {
        bloodPressure: bloodPressure.trim() || undefined,
        heartRate: heartRate ? parseInt(heartRate, 10) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update patient vitals');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Patient Vitals"
      description={`Patient: ${visit.patient?.nameEn} (${visit.patient?.patientCode})`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Blood Pressure */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Blood Pressure (mmHg)
            </label>
            <input
              type="text"
              placeholder="e.g. 120/80"
              value={bloodPressure}
              onChange={(e) => setBloodPressure(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          {/* Heart Rate / Pulse */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pulse Rate (bpm)
            </label>
            <input
              type="number"
              placeholder="e.g. 72"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Temperature (°C)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 36.8"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 68.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          {/* Height */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 172"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>
        </div>

        {/* Calculated BMI */}
        {bmiInfo && (
          <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${bmiInfo.color}`}>
            <div>
              <span className="font-semibold">Calculated BMI: </span>
              <span className="font-mono font-bold text-sm">{bmiInfo.value}</span>
            </div>
            <span className="font-semibold px-2 py-0.5 rounded bg-white/70">
              {bmiInfo.category}
            </span>
          </div>
        )}

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
            {submitting ? 'Saving...' : 'Save Vitals'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ==========================================
// Doctor Consultation & Clinical Record Drawer
// ==========================================
function DoctorConsultationDrawer({
  isOpen,
  onClose,
  visit,
  doctors,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  visit: any;
  doctors: any[];
  onSuccess: () => void;
}) {
  const [doctorId, setDoctorId] = useState(visit.doctorId || '');
  const [diagnosis, setDiagnosis] = useState(visit.diagnosis || '');
  const [physicalExam, setPhysicalExam] = useState(visit.medicalRecord?.physicalExam || '');
  const [assessment, setAssessment] = useState(visit.medicalRecord?.assessment || '');
  const [treatmentPlan, setTreatmentPlan] = useState(visit.medicalRecord?.treatmentPlan || '');
  const [notes, setNotes] = useState(visit.notes || '');
  const [createInvoice, setCreateInvoice] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setError('Clinical diagnosis is required to complete consultation.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.visits.complete(visit.id, {
        diagnosis: diagnosis.trim(),
        doctorId: doctorId || undefined,
        physicalExam: physicalExam.trim() || undefined,
        assessment: assessment.trim() || undefined,
        treatmentPlan: treatmentPlan.trim() || undefined,
        notes: notes.trim() || undefined,
        createConsultationInvoice: createInvoice,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to complete consultation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doctor Consultation & Clinical Assessment"
      description={`Patient: ${visit.patient?.nameEn} • Visit: ${visit.visitCode}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Patient Vitals Quick Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div className="font-semibold text-slate-800 flex items-center justify-between">
            <span>Chief Complaint: {visit.reason}</span>
            <span className="font-mono text-teal-800">{visit.patient?.bloodType ? `Blood: ${visit.patient?.bloodType}` : ''}</span>
          </div>
          {(visit.bloodPressure || visit.heartRate || visit.temperature || visit.weightKg) && (
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 font-mono pt-1">
              {visit.bloodPressure && <span>BP: {visit.bloodPressure}</span>}
              {visit.heartRate && <span>Pulse: {visit.heartRate} bpm</span>}
              {visit.temperature && <span>Temp: {visit.temperature}°C</span>}
              {visit.weightKg && <span>Weight: {visit.weightKg} kg</span>}
            </div>
          )}
        </div>

        {/* Attending Doctor */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Attending Physician
          </label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          >
            <option value="">-- Select Physician --</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.fullNameEn}
              </option>
            ))}
          </select>
        </div>

        {/* Diagnosis */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Clinical Diagnosis <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Acute upper respiratory tract infection, Hypertension Stage 1"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white font-medium text-slate-900"
          />
        </div>

        {/* Physical Examination */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Physical Examination Findings
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Clear breath sounds bilaterally, mild pharyngeal erythema, no lymphadenopathy"
            value={physicalExam}
            onChange={(e) => setPhysicalExam(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          />
        </div>

        {/* Clinical Assessment & Treatment Plan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Assessment Summary
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Mild viral presentation, low risk of complications"
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Treatment & Care Plan
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Symptomatic relief, hydration, rest, follow up in 5 days if fever persists"
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>
        </div>

        {/* Doctor Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Doctor Internal Notes
          </label>
          <textarea
            rows={2}
            placeholder="Confidential clinical notes or instructions"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          />
        </div>

        {/* Consultation Invoice Trigger */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2.5">
          <input
            type="checkbox"
            id="createInvoice"
            checked={createInvoice}
            onChange={(e) => setCreateInvoice(e.target.checked)}
            className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600"
          />
          <label htmlFor="createInvoice" className="text-xs text-slate-700 cursor-pointer">
            Automatically create consultation fee invoice (${Number(visit.consultationFee || 5).toFixed(2)}) for cashier
          </label>
        </div>

        {/* Form Actions */}
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
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            {submitting ? 'Completing...' : 'Complete Consultation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
