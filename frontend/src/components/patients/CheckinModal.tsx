'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { useTranslation } from '../../context/I18nContext';
import { AlertCircle, Search, UserCheck, DollarSign, PlusCircle } from 'lucide-react';

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors?: any[];
  onSuccess: (newVisit?: any) => void;
}

export function CheckinModal({
  isOpen,
  onClose,
  doctors: initialDoctors,
  onSuccess,
}: CheckinModalProps) {
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';

  const [doctors, setDoctors] = useState<any[]>(initialDoctors || []);
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

  // Quick walk-in registration toggle
  const [isQuickWalkin, setIsQuickWalkin] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinGender, setWalkinGender] = useState('OTHER');

  // Load doctors if not provided
  useEffect(() => {
    if ((!initialDoctors || initialDoctors.length === 0) && isOpen) {
      api.users.getDoctors().then(setDoctors).catch(() => {});
    }
  }, [initialDoctors, isOpen]);

  // Search patients as user types
  useEffect(() => {
    if (!patientSearch.trim() || patientSearch.length < 2 || isQuickWalkin) {
      setPatientCandidates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await api.patients.list({ search: patientSearch, limit: 6 });
        setPatientCandidates(res.data || []);
      } catch {
        // silent
      } finally {
        setSearchingPatients(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [patientSearch, isQuickWalkin]);

  const resetForm = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientCandidates([]);
    setDoctorId('');
    setReason('');
    setSymptoms('');
    setConsultationFee('5.00');
    setError(null);
    setIsQuickWalkin(false);
    setWalkinName('');
    setWalkinPhone('');
    setWalkinGender('OTHER');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let patientIdToUse = selectedPatient?.id;

    // Handle Quick Walk-in Creation
    if (isQuickWalkin) {
      if (!walkinName.trim()) {
        setError(isKm ? 'សូមបញ្ចូលឈ្មោះអ្នកជំងឺ' : 'Walk-in patient name is required.');
        return;
      }
      try {
        setSubmitting(true);
        const newPatient = await api.patients.create({
          nameEn: walkinName.trim(),
          nameKh: walkinName.trim(),
          phone: walkinPhone.trim() || `010-${Math.floor(100000 + Math.random() * 900000)}`,
          gender: walkinGender,
          bloodType: 'UNKNOWN',
        });
        patientIdToUse = newPatient.id;
      } catch (err: any) {
        setError(err.message || 'Failed to create walk-in patient profile');
        setSubmitting(false);
        return;
      }
    }

    if (!patientIdToUse) {
      setError(isKm ? 'សូមជ្រើសរើស ឬបញ្ចូលឈ្មោះអ្នកជំងឺជាមុនសិន' : 'Please search and select a patient first.');
      return;
    }

    if (!reason.trim()) {
      setError(isKm ? 'សូមបញ្ចូលមូលហេតុនៃការមកពិគ្រោះ' : 'Chief complaint / reason for visit is required.');
      return;
    }

    setSubmitting(true);

    try {
      const created = await api.visits.create({
        patientId: patientIdToUse,
        doctorId: doctorId || undefined,
        reason: reason.trim(),
        symptoms: symptoms.trim() || undefined,
        consultationFee: parseFloat(consultationFee) || 5.0,
      });

      resetForm();
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to check-in patient to queue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isKm ? 'ចុះឈ្មោះអ្នកជំងឺចូលជួរពិគ្រោះ (Check-In)' : 'Patient Queue Check-In'}
      description={
        isKm
          ? 'ជ្រើសរើសអ្នកជំងឺ និងផ្ដល់លេខវេនដើម្បីចូលជួររង់ចាំពិគ្រោះជាមួយវេជ្ជបណ្ឌិត'
          : 'Register an outpatient arrival and issue a queue token for medical consultation'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Patient Selection / Quick Walkin Mode Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              {isKm ? 'ព័ត៌មានអ្នកជំងឺ' : 'Patient Information'} <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setIsQuickWalkin(!isQuickWalkin);
                setSelectedPatient(null);
                setPatientSearch('');
              }}
              className="text-[11px] text-teal-700 hover:text-teal-800 font-semibold underline flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>
                {isQuickWalkin
                  ? (isKm ? 'ស្វែងរកអ្នកជំងឺចាស់' : 'Search Existing Patient')
                  : (isKm ? '+ ចុះឈ្មោះអ្នកជំងឺថ្មីឆាប់រហ័ស' : '+ Quick Walk-in Patient')}
              </span>
            </button>
          </div>

          {isQuickWalkin ? (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider font-mono">
                {isKm ? 'ចុះឈ្មោះអ្នកជំងឺថ្មី (Walk-in)' : 'New Walk-in Patient'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {isKm ? 'ឈ្មោះអ្នកជំងឺ' : 'Patient Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chan Dara (ចាន់ ដារ៉ា)"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {isKm ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 012 345 678"
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  {isKm ? 'ភេទ' : 'Gender'}
                </label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="walkinGender"
                      value="MALE"
                      checked={walkinGender === 'MALE'}
                      onChange={(e) => setWalkinGender(e.target.value)}
                      className="text-teal-700 focus:ring-teal-700"
                    />
                    <span>{isKm ? 'ប្រុស' : 'Male'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="walkinGender"
                      value="FEMALE"
                      checked={walkinGender === 'FEMALE'}
                      onChange={(e) => setWalkinGender(e.target.value)}
                      className="text-teal-700 focus:ring-teal-700"
                    />
                    <span>{isKm ? 'ស្រី' : 'Female'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="walkinGender"
                      value="OTHER"
                      checked={walkinGender === 'OTHER'}
                      onChange={(e) => setWalkinGender(e.target.value)}
                      className="text-teal-700 focus:ring-teal-700"
                    />
                    <span>{isKm ? 'ផ្សេងៗ' : 'Other'}</span>
                  </label>
                </div>
              </div>
            </div>
          ) : selectedPatient ? (
            <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-slate-900">{selectedPatient.nameEn}</span>{' '}
                  {selectedPatient.nameKh && (
                    <span className="text-slate-600">({selectedPatient.nameKh})</span>
                  )}{' '}
                  <span className="font-mono text-teal-800 font-bold">[{selectedPatient.patientCode}]</span>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {isKm ? 'ទូរស័ព្ទ:' : 'Phone:'} {selectedPatient.phone || 'N/A'} • {isKm ? 'ក្រុមឈាម:' : 'Blood:'}{' '}
                    {selectedPatient.bloodType || 'N/A'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-xs text-teal-800 font-semibold hover:underline px-2 py-1 rounded bg-white border border-teal-200"
              >
                {isKm ? 'ប្ដូរ' : 'Change'}
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 relative">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={
                    isKm
                      ? 'វាយឈ្មោះអ្នកជំងឺ លេខទូរស័ព្ទ ឬកូដ P-XXXX...'
                      : 'Type patient name, phone number, or patient code...'
                  }
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              {searchingPatients && (
                <div className="text-[11px] text-slate-400 font-mono">
                  {isKm ? 'កំពុងស្វែងរកក្នុងបញ្ជី...' : 'Searching patient registry...'}
                </div>
              )}

              {patientCandidates.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
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
                        <div className="font-semibold text-slate-900">
                          {p.nameEn} {p.nameKh ? `(${p.nameKh})` : ''}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isKm ? 'ទូរស័ព្ទ:' : 'Phone:'} {p.phone}
                        </div>
                      </div>
                      <span className="font-mono text-xs text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {p.patientCode}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Doctor Assignment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isKm ? 'វេជ្ជបណ្ឌិតទទួលពិគ្រោះ' : 'Attending Physician / Doctor'}
          </label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          >
            <option value="">
              {isKm
                ? '-- ជួរទូទៅ (វេជ្ជបណ្ឌិត ឬបន្ទប់ណាមួយទំនេរ) --'
                : '-- General Queue (Any Available Physician) --'}
            </option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                Dr. {doc.fullNameEn} {doc.fullNameKh ? `(${doc.fullNameKh})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Chief Complaint / Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isKm ? 'មូលហេតុមកពិគ្រោះ / រោគសញ្ញាចម្បង' : 'Chief Complaint / Reason for Visit'}{' '}
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder={
              isKm
                ? 'ឧ. ក្ដៅខ្លួន ក្អក ឈឺក្បាល រាគរូស ពិនិត្យសុខភាពប្រចាំខែ...'
                : 'e.g. Fever, persistent cough for 3 days, acute abdominal pain'
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          />
        </div>

        {/* Symptoms */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isKm ? 'រោគសញ្ញាសម្គាល់បន្ថែម (មិនបង្ខំ)' : 'Observed Symptoms (Optional)'}
          </label>
          <textarea
            rows={2}
            placeholder={
              isKm
                ? 'ឧ. សីតុណ្ហភាពឡើងខ្ពស់ ពិបាកដកដង្ហើម ស្រៀវស្រាញ...'
                : 'e.g. High temperature, chills, sore throat, fatigue'
            }
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
          />
        </div>

        {/* Consultation Fee */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isKm ? 'តម្លៃសេវាពិគ្រោះជំងឺ (USD)' : 'Standard Consultation Fee (USD)'}
          </label>
          <div className="relative">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="number"
              step="0.01"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition-colors"
          >
            {isKm ? 'បោះបង់' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            {submitting
              ? isKm
                ? 'កំពុងបញ្ចូល...'
                : 'Registering...'
              : isKm
              ? 'បញ្ចូលអ្នកជំងឺក្នុងជួរ'
              : 'Add Patient to Queue'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
