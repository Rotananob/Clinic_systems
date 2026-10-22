'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  Search,
  Plus,
  Phone,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Download,
  Trash2,
  AlertTriangle,
  Sparkles,
  Check,
  X,
  Users,
} from 'lucide-react';
import { RegisterPatientDrawer } from './RegisterPatientDrawer';
import { PatientQuotaExceededModal } from './PatientQuotaExceededModal';
import { SubscriptionCheckoutModal } from '../subscriptions/SubscriptionCheckoutModal';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { RestrictedActionGuard } from '../common/RestrictedActionGuard';
import { useLiveSync } from '../../lib/useLiveSync';

export const PatientList: React.FC = () => {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const isKm = locale === 'km';
  const role = user?.role;
  const canExportCsv = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const canDelete = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'DOCTOR';

  const tenantPlanTier = user?.tenant?.planTier || 'FREE';
  const maxLimit =
    tenantPlanTier === 'FREE'
      ? 50
      : tenantPlanTier === 'STARTER_5'
      ? 1000
      : tenantPlanTier === 'PRO_8'
      ? 8000
      : -1;

  const [patients, setPatients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Drawers
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Deletion state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [patientToDelete, setPatientToDelete] = useState<any | null>(null);
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isAtLimit = maxLimit !== -1 && total >= maxLimit;
  const isApproachingLimit = maxLimit !== -1 && total >= Math.floor(maxLimit * 0.8) && !isAtLimit;

  const fetchPatients = async (query = '', pageNum = 1) => {
    setIsLoading(true);
    try {
      const res = await api.patients.list({ search: query, page: pageNum, limit: 15 });
      setPatients(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(search, page);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  useLiveSync(() => {
    fetchPatients(search, page);
  });

  const handlePatientCreated = (newPatient: any) => {
    setPatients([newPatient, ...patients]);
    setTotal((prev) => prev + 1);
  };

  const handleRegisterClick = () => {
    if (isAtLimit) {
      setIsQuotaModalOpen(true);
    } else {
      setIsRegisterOpen(true);
    }
  };

  const handleExportCsv = () => {
    if (patients.length === 0) return;
    const headers = [
      'Patient Code',
      'Full Name (EN)',
      'Full Name (KH)',
      'Gender',
      'Phone',
      'Blood Type',
      'Date of Birth',
      'Registered Date',
    ];
    const rows = patients.map((p) => [
      `"${p.patientCode || ''}"`,
      `"${(p.nameEn || '').replace(/"/g, '""')}"`,
      `"${(p.nameKh || '').replace(/"/g, '""')}"`,
      `"${p.gender || ''}"`,
      `"${p.phone || ''}"`,
      `"${p.bloodType || ''}"`,
      `"${p.dob ? new Date(p.dob).toISOString().split('T')[0] : ''}"`,
      `"${p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : ''}"`,
    ]);

    const csvContent =
      '\ufeff' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `krupet_patients_backup_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Selection handlers (max 10)
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 10) {
        setNotification({
          type: 'error',
          message: isKm
            ? 'អាចជ្រើសរើសដើម្បីលុបបានអតិបរមា ១០ នាក់ក្នុងម្ដងប៉ុណ្ណោះ។'
            : 'You can select a maximum of 10 patients at a time.',
        });
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectPage = () => {
    const pageIds = patients.map((p) => p.id).slice(0, 10);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedIds, ...pageIds])).slice(0, 10);
      setSelectedIds(combined);
    }
  };

  // Single deletion
  const confirmDeleteSingle = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    setNotification(null);
    try {
      await api.patients.delete(patientToDelete.id);
      setPatients((prev) => prev.filter((p) => p.id !== patientToDelete.id));
      setSelectedIds((prev) => prev.filter((id) => id !== patientToDelete.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setNotification({
        type: 'success',
        message: isKm
          ? `បានលុបទិន្នន័យអ្នកជំងឺ ${patientToDelete.nameEn || patientToDelete.patientCode} ជាអចិន្ត្រៃយ៍ពីប្រព័ន្ធរួចរាល់ហើយ។`
          : `Permanently deleted patient record ${patientToDelete.nameEn || patientToDelete.patientCode}.`,
      });
      setPatientToDelete(null);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || (isKm ? 'មិនអាចលុបទិន្នន័យអ្នកជំងឺបានទេ។' : 'Failed to delete patient record.'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk deletion (max 10)
  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    setNotification(null);
    try {
      const res = await api.patients.bulkDelete(selectedIds);
      setPatients((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setTotal((prev) => Math.max(0, prev - selectedIds.length));
      setNotification({
        type: 'success',
        message: isKm
          ? `បានលុបទិន្នន័យអ្នកជំងឺចំនួន ${res.count || selectedIds.length} នាក់ជាអចិន្ត្រៃយ៍ចេញពីប្រព័ន្ធដោយជោគជ័យ។`
          : `Successfully permanently erased ${res.count || selectedIds.length} patient records from system.`,
      });
      setSelectedIds([]);
      setIsConfirmingBulkDelete(false);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || (isKm ? 'មិនអាចលុបទិន្នន័យបានទេ។' : 'Failed to execute bulk deletion.'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between shadow-sm transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quota Tracking Header Banner */}
      <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E7E1D4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-stone-900 tracking-tight">{t.patients.title}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isAtLimit
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : isApproachingLimit
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}
              >
                {maxLimit === -1
                  ? (isKm ? 'មិនកំណត់ចំនួន' : 'Unlimited')
                  : `${total.toLocaleString()} / ${maxLimit.toLocaleString()} ${isKm ? 'នាក់' : 'patients'}`}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {isAtLimit
                ? (isKm
                    ? 'កម្រិតកំណត់អ្នកជំងឺពេញ។ សូមដំឡើងគម្រោង ឬលុបទិន្នន័យចាស់ចេញ ដើម្បីចុះឈ្មោះបន្ថែម។'
                    : 'Patient capacity reached. Upgrade or delete old records to register more.')
                : isApproachingLimit
                ? (isKm
                    ? 'ជិតដល់កម្រិតកំណត់អ្នកជំងឺនៃគម្រោងរបស់អ្នកហើយ។'
                    : 'Approaching maximum patient limit for your plan tier.')
                : t.patients.subtitle}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <RestrictedActionGuard
            isAllowed={canExportCsv}
            actionNameKh="ទាញយកឯកសារអ្នកជំងឺ - Excel / CSV"
            actionNameEn="Export Patient Records (Excel / CSV)"
            customMessage={
              isKm
                ? 'អ្នកមិនមានសិទ្ធិទាញយកទិន្នន័យឯកជនរបស់អ្នកជំងឺជា CSV ឬ Excel ឡើយ។'
                : 'You do not have permission to export private patient medical records to CSV/Excel.'
            }
          >
            <button
              onClick={handleExportCsv}
              disabled={patients.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 disabled:opacity-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              title="Export to Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>{isKm ? 'Backup Excel / CSV' : 'Export Excel / CSV'}</span>
            </button>
          </RestrictedActionGuard>

          {isAtLimit && (
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isKm ? 'ដំឡើងគម្រោង' : 'Upgrade Plan'}</span>
            </button>
          )}

          <button
            onClick={handleRegisterClick}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isAtLimit
                ? 'bg-amber-700 hover:bg-amber-800 text-white'
                : 'bg-teal-800 hover:bg-teal-900 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{t.patients.registerNew}</span>
          </button>
        </div>
      </div>

      {/* Selected Records Action Bar for Bulk Deletion */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-900 font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
            <span>
              {isKm
                ? `បានជ្រើសរើសអ្នកជំងឺចំនួន ${selectedIds.length} នាក់ - អតិបរមា ១០ នាក់`
                : `Selected ${selectedIds.length} patients (max 10 allowed)`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3 text-stone-500" />
              <span>{isKm ? 'Backup ជាមុន' : 'Backup CSV'}</span>
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={() => setIsConfirmingBulkDelete(true)}
                className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isKm ? `លុបអ្នកជំងឺទាំង ${selectedIds.length} នាក់` : `Delete ${selectedIds.length} Patients`}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder={t.patients.searchPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#DCD5C8] rounded-xl focus:outline-none focus:border-teal-700 shadow-2xs font-sans placeholder:text-stone-400"
        />
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-stone-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-teal-800" />
            <span className="text-xs">{t.common.loading}</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <p className="text-sm font-medium">{isKm ? 'រកមិនឃើញទិន្នន័យអ្នកជំងឺទេ' : 'No patient records found'}</p>
            <p className="text-xs text-stone-400 mt-1">
              {isKm
                ? 'សូមសាកល្បងស្វែងរកពាក្យផ្សេង ឬចុច «ចុះឈ្មោះអ្នកជំងឺថ្មី»'
                : 'Try another search term or click "Register New Patient"'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead className="bg-[#FAF7F2] border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider font-mono">
                <tr>
                  {canDelete && (
                    <th className="px-3 py-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={patients.length > 0 && patients.slice(0, 10).every((p) => selectedIds.includes(p.id))}
                        onChange={toggleSelectPage}
                        className="rounded border-stone-300 text-teal-800 focus:ring-teal-700 cursor-pointer"
                        title="Select page (max 10)"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3">{t.patients.patientCode}</th>
                  <th className="px-4 py-3">{t.patients.fullNameEn}</th>
                  <th className="px-4 py-3">{isKm ? 'ភេទ / ប្រភេទឈាម' : 'Gender / Blood'}</th>
                  <th className="px-4 py-3">{t.patients.phone}</th>
                  <th className="px-4 py-3">{t.patients.allergies}</th>
                  <th className="px-4 py-3 text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {patients.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isSelected ? 'bg-teal-50/50' : ''
                      }`}
                    >
                      {canDelete && (
                        <td className="px-3 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(p.id)}
                            className="rounded border-stone-300 text-teal-800 focus:ring-teal-700 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-teal-900">
                        {p.patientCode}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-stone-900">{p.nameEn}</div>
                        {p.nameKh && <div className="text-xs text-stone-500 font-sans">{p.nameKh}</div>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700">
                            {p.gender}
                          </span>
                          {p.bloodType && (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[11px] font-mono bg-rose-50 text-rose-700 border border-rose-200">
                              {p.bloodType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-stone-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{p.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        {p.allergies && p.allergies.toLowerCase() !== 'none' ? (
                          <span className="inline-flex items-center gap-1 text-rose-800 font-medium bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            {p.allergies}
                          </span>
                        ) : (
                          <span className="text-stone-400">{isKm ? 'គ្មាន' : 'None reported'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/patients/${p.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-950 hover:underline"
                          >
                            <span>{t.patients.viewProfile}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setPatientToDelete(p)}
                              className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={isKm ? 'លុបទិន្នន័យអ្នកជំងឺ' : 'Delete patient record'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer pagination */}
        <div className="px-4 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 bg-[#FAF7F2]">
          <span>
            {isKm
              ? `បង្ហាញ ${patients.length} ក្នុងចំណោមអ្នកជំងឺសរុប ${total} នាក់`
              : `Showing ${patients.length} of ${total} registered patients`}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 border border-stone-200 rounded-xl bg-white hover:bg-stone-50 disabled:opacity-40 text-xs font-semibold cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={patients.length < 15}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 border border-stone-200 rounded-xl bg-white hover:bg-stone-50 disabled:opacity-40 text-xs font-semibold cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Register Patient Drawer */}
      <RegisterPatientDrawer
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onPatientCreated={handlePatientCreated}
      />

      {/* Quota Exceeded Modal */}
      <PatientQuotaExceededModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        currentCount={total}
        maxLimit={maxLimit}
        planTier={tenantPlanTier}
        onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
        onOpenDeleteManager={() => {
          setNotification({
            type: 'error',
            message: isKm
              ? 'សូមជ្រើសរើសប្រអប់ធីក Checkbox លើឈ្មោះអ្នកជំងឺក្នុងតារាង ដើម្បីលុបទិន្នន័យចាស់ចេញ។'
              : 'Please check the checkboxes next to patient records in the table to select and delete them.',
          });
        }}
        onExportCsv={handleExportCsv}
      />

      {/* Subscription Upgrade Modal */}
      <SubscriptionCheckoutModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        initialPlanTier={tenantPlanTier === 'PRO_8' ? 'ENTERPRISE_12' : 'PRO_8'}
      />

      {/* Single Patient Permanent Delete Confirmation Dialog */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  {isKm ? 'បញ្ជាក់ការលុបទិន្នន័យអ្នកជំងឺ' : 'Confirm Patient Deletion'}
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  {patientToDelete.nameEn || patientToDelete.patientCode} - {patientToDelete.patientCode}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
              <span className="font-bold block">
                {isKm ? 'ការព្រមានសំខាន់អំពីការលុប' : 'CRITICAL PERMANENT ERASURE'}
              </span>
              <p className="text-[11px] leading-relaxed">
                {isKm
                  ? 'ការព្រមានសំខាន់៖ សកម្មភាពលុបនេះ គឺលុបទិន្នន័យអ្នកជំងឺជាអចិន្ត្រៃយ៍ចេញពី Database របស់យើងជារៀងរហូត។ សូមប្រាកដថាអ្នកបាន Export ទាញយកឯកសារ Excel ឬកត់ត្រាទុកនៅក្រៅរួចរាល់ មុនពេលសម្រេចចិត្តលុប។'
                  : 'Important Notice: Deleting patient records permanently erases them from our database forever. Ensure you have exported an Excel backup or copied notes externally before confirming deletion.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteSingle}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isKm ? 'យល់ព្រមលុបជាអចិន្ត្រៃយ៍' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog (max 10) */}
      {isConfirmingBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  {isKm
                    ? `បញ្ជាក់ការលុបអ្នកជំងឺទាំង ${selectedIds.length} នាក់`
                    : `Confirm Deletion of ${selectedIds.length} Patients`}
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  {isKm ? `ចំនួនដែលបានជ្រើស៖ ${selectedIds.length} នាក់ - អតិបរមា ១០` : `Count: ${selectedIds.length} (max 10)`}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
              <span className="font-bold block">
                {isKm ? 'ការព្រមានសំខាន់អំពីការលុបទិន្នន័យ' : 'CRITICAL PERMANENT ERASURE'}
              </span>
              <p className="text-[11px] leading-relaxed">
                {isKm
                  ? 'ការព្រមានសំខាន់៖ សកម្មភាពលុបនេះ គឺលុបទិន្នន័យអ្នកជំងឺជាអចិន្ត្រៃយ៍ចេញពី Database របស់យើងជារៀងរហូត។ សូមប្រាកដថាអ្នកបាន Export ទាញយកឯកសារ Excel ឬកត់ត្រាទុកនៅក្រៅរួចរាល់ មុនពេលសម្រេចចិត្តលុប។'
                  : 'Important Notice: Deleting patient records permanently erases them from our database forever. Ensure you have exported an Excel backup or copied notes externally before confirming deletion.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingBulkDelete(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isKm ? `លុបទាំង ${selectedIds.length} នាក់ជាអចិន្ត្រៃយ៍` : 'Confirm Permanent Deletion'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
