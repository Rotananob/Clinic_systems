'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';
import { Modal } from '../../components/ui/Modal';
import { useTranslation } from '../../context/I18nContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  User,
  ArrowRight,
  XCircle,
  Check,
  CalendarDays,
  Activity,
} from 'lucide-react';

export default function FollowUpsPage() {
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED'>('ALL');

  // Drawer states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const data = await api.followUps.list(statusFilter === 'ALL' ? undefined : { status: statusFilter });
      setFollowUps(data);
    } catch (err) {
      console.error('Failed to load follow-ups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [statusFilter]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return followUps;
    const q = searchQuery.toLowerCase();
    return followUps.filter((f) => {
      const pNameEn = f.patient?.nameEn?.toLowerCase() || '';
      const pNameKh = f.patient?.nameKh?.toLowerCase() || '';
      const pCode = f.patient?.patientCode?.toLowerCase() || '';
      const reason = f.reason?.toLowerCase() || '';
      return pNameEn.includes(q) || pNameKh.includes(q) || pCode.includes(q) || reason.includes(q);
    });
  }, [followUps, searchQuery]);

  // Counters
  const counters = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let scheduledToday = 0;
    let scheduledTotal = 0;
    let completed = 0;
    let missedOrCancelled = 0;

    followUps.forEach((f) => {
      const fDate = new Date(f.scheduledDate).toISOString().split('T')[0];
      if (f.status === 'SCHEDULED') {
        scheduledTotal++;
        if (fDate === today) scheduledToday++;
      } else if (f.status === 'COMPLETED') {
        completed++;
      } else {
        missedOrCancelled++;
      }
    });

    return { all: followUps.length, scheduledToday, scheduledTotal, completed, missedOrCancelled };
  }, [followUps]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.followUps.update(id, { status: newStatus });
      await fetchFollowUps();
    } catch (err: any) {
      alert(err.message || 'Failed to update follow-up status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.followUps.title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {t.followUps.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFollowUps}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors text-xs"
            title={t.common.refresh}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsScheduleOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.followUps.schedule}</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${
            statusFilter === 'ALL' ? 'border-teal-600 ring-2 ring-teal-50 shadow-sm' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">All Scheduled</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono">{counters.all}</div>
        </div>

        <div
          onClick={() => setStatusFilter('SCHEDULED')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${
            statusFilter === 'SCHEDULED' ? 'border-teal-600 ring-2 ring-teal-50 shadow-sm' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-teal-700">Scheduled Today</span>
            <CalendarDays className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-teal-800 mt-1.5 font-mono">{counters.scheduledToday}</div>
        </div>

        <div
          onClick={() => setStatusFilter('COMPLETED')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${
            statusFilter === 'COMPLETED' ? 'border-emerald-600 ring-2 ring-emerald-50 shadow-sm' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Completed Visits</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-1.5 font-mono">{counters.completed}</div>
        </div>

        <div
          onClick={() => setStatusFilter('MISSED')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${
            statusFilter === 'MISSED' ? 'border-amber-500 ring-2 ring-amber-50 shadow-sm' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Missed / Cancelled</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-800 mt-1.5 font-mono">{counters.missedOrCancelled}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by patient, code, or clinical reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
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

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading follow-up schedule...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">No follow-up appointments found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((f) => {
              const dateObj = new Date(f.scheduledDate);
              const isPast = dateObj.getTime() < Date.now() && f.status === 'SCHEDULED';
              return (
                <div
                  key={f.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-slate-900 text-sm">
                        <Link href={`/patients/${f.patient?.id}`} className="hover:text-teal-700 hover:underline">
                          {f.patient?.nameEn}
                        </Link>
                        {f.patient?.nameKh && (
                          <span className="text-xs font-normal text-slate-500 ml-1">({f.patient?.nameKh})</span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-slate-400">[{f.patient?.patientCode}]</span>
                      {isPast && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                          Overdue
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        <strong className="text-slate-400">Recall Reason:</strong> {f.reason}
                      </span>
                      {f.doctor && (
                        <span>
                          <strong className="text-slate-400">Physician:</strong> Dr. {f.doctor.fullNameEn}
                        </span>
                      )}
                      <span>
                        <strong className="text-slate-400">Phone:</strong> {f.patient?.phone}
                      </span>
                    </div>

                    {f.notes && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 inline-block">
                        <strong>Clinical Instruction:</strong> {f.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-900 font-mono">
                        {dateObj.toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                        f.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : f.status === 'SCHEDULED'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {f.status}
                    </span>

                    {/* Actions */}
                    {f.status === 'SCHEDULED' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStatus(f.id, 'COMPLETED')}
                          disabled={updatingId === f.id}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
                          title="Mark Attended / Completed"
                        >
                          <Check className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(f.id, 'CANCELLED')}
                          disabled={updatingId === f.id}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors"
                          title="Cancel appointment"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drawer: Schedule Follow-Up */}
      <ScheduleFollowUpDrawer
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={() => {
          setIsScheduleOpen(false);
          fetchFollowUps();
        }}
      />
    </div>
  );
}

// ==========================================
// Schedule Follow-Up Drawer
// ==========================================
function ScheduleFollowUpDrawer({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [patientSearch, setPatientSearch] = useState('');
  const [patientCandidates, setPatientCandidates] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [reason, setReason] = useState('Routine clinical checkup & review');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDoctors();
      // default date 7 days from today
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setScheduledDate(d.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const loadDoctors = async () => {
    try {
      const docs = await api.users.getDoctors();
      setDoctors(docs);
      if (docs.length > 0) setDoctorId(docs[0].id);
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    if (!patientSearch.trim() || patientSearch.length < 2) {
      setPatientCandidates([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.patients.list({ search: patientSearch, limit: 5 });
        setPatientCandidates(res.data || []);
      } catch (err) {
        // silent
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please search and select a patient first.');
      return;
    }
    if (!scheduledDate) {
      setError('Scheduled follow-up date is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const isoDateTime = new Date(`${scheduledDate}T${scheduledTime || '09:00'}:00`).toISOString();

    try {
      await api.followUps.create({
        patientId: selectedPatient.id,
        doctorId: doctorId || undefined,
        scheduledDate: isoDateTime,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Clinical Follow-Up"
      subtitle="Book a recall appointment for treatment follow-up, suture removal, or clinical monitoring"
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
                <div className="text-slate-500 text-[11px] mt-0.5">Phone: {selectedPatient.phone}</div>
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
                placeholder="Type name, phone, or patient ID..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
              />
              {searching && <div className="text-[11px] text-slate-400">Searching registry...</div>}
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
                      <span className="font-mono text-xs text-teal-800">{p.patientCode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Doctor */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Physician</label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.fullNameEn}
              </option>
            ))}
          </select>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Time</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Clinical Reason for Recall <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Suture removal, post-op wound evaluation, blood glucose monitoring"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Preparation Instructions</label>
          <textarea
            rows={2}
            placeholder="e.g. Fasting 8 hours prior to appointment for fasting blood glucose test"
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
            {submitting ? 'Scheduling...' : 'Save Appointment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
