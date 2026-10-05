'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';
import { AlertCircle, CheckCircle2, UserPlus, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: (patient: any) => void;
}

export const RegisterPatientDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onPatientCreated,
}) => {
  const [formData, setFormData] = useState({
    nameEn: '',
    nameKh: '',
    gender: 'MALE',
    dob: '',
    phone: '',
    nationalId: '',
    address: '',
    bloodType: 'O+',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time duplicate check states
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState<any[]>([]);

  // Debounced duplicate detection
  useEffect(() => {
    if (!formData.phone || formData.phone.length < 8) {
      setDuplicateCandidates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setDuplicateCheckLoading(true);
      try {
        const res = await api.patients.checkDuplicate(formData.phone, formData.nationalId || undefined);
        if (res.hasDuplicate) {
          setDuplicateCandidates(res.candidates);
        } else {
          setDuplicateCandidates([]);
        }
      } catch {
        // ignore duplicate check network errors
      } finally {
        setDuplicateCheckLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.phone, formData.nationalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        nameEn: formData.nameEn,
        nameKh: formData.nameKh || undefined,
        gender: formData.gender,
        phone: formData.phone,
        bloodType: formData.bloodType || undefined,
        allergies: formData.allergies || undefined,
        address: formData.address || undefined,
        nationalId: formData.nationalId || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
      };

      if (formData.dob) {
        payload.dob = formData.dob;
      }

      const created = await api.patients.create(payload);
      onPatientCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Patient"
      subtitle="Complete demographics and clinical allergy registry"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Duplicate Warning Banner */}
        {duplicateCandidates.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Potential Duplicate Patient Detected:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-700">
              {duplicateCandidates.map((c) => (
                <li key={c.id}>
                  <span className="font-mono font-medium">{c.patientCode}</span> - {c.nameEn} ({c.nameKh || 'N/A'}) - Phone: {c.phone}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full Name (English) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sok Dara"
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full Name (Khmer)
            </label>
            <input
              type="text"
              placeholder="e.g. សុខ ដារ៉ា"
              value={formData.nameKh}
              onChange={(e) => setFormData({ ...formData, nameKh: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="e.g. 012345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 font-mono"
              />
              {duplicateCheckLoading && (
                <Loader2 className="w-4 h-4 text-teal-600 animate-spin absolute right-3 top-2.5" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Gender *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 bg-white"
            >
              <option value="MALE">Male (ប្រុស)</option>
              <option value="FEMALE">Female (ស្រី)</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              National ID / Passport
            </label>
            <input
              type="text"
              placeholder="e.g. 010203040"
              value={formData.nationalId}
              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Blood Type
            </label>
            <select
              value={formData.bloodType}
              onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 bg-white"
            >
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Allergies (Crucial Medical Safety)
            </label>
            <input
              type="text"
              placeholder="e.g. Penicillin, Aspirin, None"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 text-rose-700 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Residential Address
          </label>
          <input
            type="text"
            placeholder="e.g. Sangkat Boeung Keng Kang, Phnom Penh"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Emergency Contact Name
            </label>
            <input
              type="text"
              placeholder="e.g. Sok Veasna (Spouse)"
              value={formData.emergencyContactName}
              onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Emergency Contact Phone
            </label>
            <input
              type="tel"
              placeholder="e.g. 012777888"
              value={formData.emergencyContactPhone}
              onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Register Patient
          </button>
        </div>
      </form>
    </Modal>
  );
};
