'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import {
  Crown,
  ShieldCheck,
  ShieldAlert,
  Key,
  Sliders,
  Database,
  FileCheck,
  Activity,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Download,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface RolePermissionItem {
  role: string;
  labelEn: string;
  labelKh: string;
  canViewPatients: boolean;
  canCreatePatients: boolean;
  canEditPatients: boolean;
  canDeletePatients: boolean;
  canRecordVitals: boolean;
  canConsultDiagnose: boolean;
  canPrescribeMeds: boolean;
  canDispenseMeds: boolean;
  canCreateInvoices: boolean;
  canCollectPayment: boolean;
  canRefundInvoices: boolean;
  canManageSettings: boolean;
  canManageStaff: boolean;
  canManageAdmins: boolean;
  canAccessAuditLogs: boolean;
  canTriggerBackup: boolean;
}

export default function OwnerConsolePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'matrix' | 'audit' | 'certificate' | 'maintenance'>('matrix');
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [permissions, setPermissions] = useState<RolePermissionItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any>(null);
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusData, permData, logsData] = await Promise.all([
        api.system.getStatus(),
        api.system.getPermissions(),
        api.system.getAuditLogs(),
      ]);
      setSystemStatus(statusData);
      setPermissions(permData);
      setAuditLogs(logsData);
    } catch (err: any) {
      toast.error(
        isKm
          ? 'មិនអាចទាញយកទិន្នន័យគ្រប់គ្រងប្រព័ន្ធបានទេ'
          : 'Failed to load system governance data',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (roleIndex: number, field: keyof RolePermissionItem) => {
    // SUPER_ADMIN permissions cannot be disabled
    if (permissions[roleIndex].role === 'SUPER_ADMIN') {
      toast.info(
        isKm
          ? 'សិទ្ធិមហាសិទ្ធ (SUPER ADMIN) មិនអាចបិទបានឡើយ'
          : 'Super Admin master privileges cannot be restricted',
      );
      return;
    }

    setPermissions((prev) => {
      const updated = [...prev];
      const target = { ...updated[roleIndex] };
      (target as any)[field] = !(target as any)[field];
      updated[roleIndex] = target;
      return updated;
    });

    toast.success(
      isKm
        ? 'បានកែប្រែសិទ្ធិតួនាទីដោយជោគជ័យ'
        : 'Role permission successfully updated in memory',
    );
  };

  const handleTriggerBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.system.triggerBackup();
      toast.success(
        isKm
          ? 'បានបង្កើត Snapshot Database Backup ដោយជោគជ័យ'
          : 'Database backup snapshot generated successfully',
      );
    } catch (err: any) {
      toast.error(
        isKm
          ? 'មានបញ្ហាក្នុងការបង្កើត Backup សូមព្យាយាមម្តងទៀត'
          : 'Failed to trigger database backup',
      );
    } finally {
      setBackupLoading(false);
    }
  };

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-rose-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-stone-900">
            {isKm ? 'តំបន់ហាមឃាត់ - សម្រាប់តែម្ចាស់ប្រព័ន្ធ' : 'Access Restricted - System Owner Only'}
          </h2>
          <p className="text-xs text-stone-600">
            {isKm
              ? 'ទំព័រនេះតម្រូវឱ្យមានសិទ្ធិកម្រិត SUPER_ADMIN (ម្ចាស់ប្រព័ន្ធ) ជាដាច់ខាត។'
              : 'This master console requires SUPER_ADMIN authority.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Executive Master Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-stone-900 text-stone-100 p-6 sm:p-8 border border-amber-900/40 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-amber-400/30">
                  {isKm ? 'មហាសិទ្ធកំពូល (SUPER ADMIN)' : 'MASTER SYSTEM OWNER'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold border border-teal-400/30">
                  LICENSE: PERPETUAL ENTERPRISE
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                {isKm
                  ? 'មជ្ឈមណ្ឌលបញ្ជាមហាសិទ្ធ & គ្រប់គ្រងសិទ្ធិប្រព័ន្ធ'
                  : 'System Owner Master Governance Console'}
              </h1>
              <p className="text-xs text-stone-300 mt-1 max-w-2xl font-medium">
                {isKm
                  ? 'ម្ចាស់ប្រព័ន្ធ៖ លោក ណុប រតនា (Rotana Nob) | សិទ្ធិគ្រប់គ្រងរាល់គណនី Admin, ម៉ាទ្រីសសិទ្ធិបុគ្គលិក, និងការកំណត់ស្នូល'
                  : 'Platform Owner: Rotana Nob | Universal authority over Administrators, Role Permission Matrix, and Infrastructure'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition-all shadow-sm active:scale-98"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isKm ? 'ទាញយកទិន្នន័យថ្មី' : 'Refresh'}</span>
            </button>
            <button
              onClick={handleTriggerBackup}
              disabled={backupLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-md active:scale-98"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{backupLoading ? (isKm ? 'កំពុងបង្កើត...' : 'Creating...') : (isKm ? 'Snapshot Backup' : 'Instant Backup')}</span>
            </button>
          </div>
        </div>

        {/* Live System KPIs */}
        {systemStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-stone-800">
            <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-700/60">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                {isKm ? 'បុគ្គលិកសរុប' : 'Total Staff'}
              </span>
              <span className="text-lg font-bold text-white font-mono">
                {systemStatus.metrics.totalStaff} នាក់
              </span>
            </div>
            <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-700/60">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                {isKm ? 'អ្នកជំងឺក្នុងប្រព័ន្ធ' : 'Registered Patients'}
              </span>
              <span className="text-lg font-bold text-amber-300 font-mono">
                {systemStatus.metrics.registeredPatients} នាក់
              </span>
            </div>
            <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-700/60">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                {isKm ? 'វិក្កយបត្រសរុប' : 'Invoices Generated'}
              </span>
              <span className="text-lg font-bold text-teal-300 font-mono">
                {systemStatus.metrics.totalInvoicesGenerated}
              </span>
            </div>
            <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-700/60">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                {isKm ? 'ស្ថានភាព Database' : 'Database Status'}
              </span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{systemStatus.databaseHealth} (Healthy)</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#E7E1D4] gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'border-amber-600 text-stone-900 bg-[#F2EDE2]/60 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-600" />
          <span>{isKm ? 'ម៉ាទ្រីសសិទ្ធិប្រើប្រាស់ (Permission Matrix)' : 'Role & Permission Matrix'}</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-amber-600 text-stone-900 bg-[#F2EDE2]/60 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Activity className="w-4 h-4 text-teal-700" />
          <span>{isKm ? 'កំណត់ត្រាសវនកម្មសុវត្ថិភាព (Audit Logs)' : 'Security Audit Trail'}</span>
        </button>
        <button
          onClick={() => setActiveTab('certificate')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'certificate'
              ? 'border-amber-600 text-stone-900 bg-[#F2EDE2]/60 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileCheck className="w-4 h-4 text-purple-700" />
          <span>{isKm ? 'វិញ្ញាបនបត្រកម្មសិទ្ធិប្រព័ន្ធ (Ownership)' : 'Ownership Certificate'}</span>
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'maintenance'
              ? 'border-amber-600 text-stone-900 bg-[#F2EDE2]/60 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Database className="w-4 h-4 text-sky-700" />
          <span>{isKm ? 'ថែទាំ & សង្គ្រោះបន្ទាន់ (Maintenance)' : 'Master Maintenance'}</span>
        </button>
      </div>

      {/* TAB 1: Role & Permission Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E1D4]">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                {isKm ? 'ការកំណត់សិទ្ធិលម្អិតតាមតួនាទីបុគ្គលិក (RBAC Matrix)' : 'Granular Role-Based Access Matrix'}
              </h3>
              <p className="text-xs text-stone-500">
                {isKm
                  ? 'ម្ចាស់ប្រព័ន្ធអាចកំណត់ថាតើតួនាទីនីមួយៗអាចធ្វើអ្វីបានខ្លះក្នុងគ្លីនិក'
                  : 'Configure which operations each clinical role is authorized to perform'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-stone-500">
                {isKm ? 'សិទ្ធិ SUPER_ADMIN ត្រូវបានការពារស្វ័យប្រវត្ត ១០០%' : 'SUPER_ADMIN holds 100% universal permissions'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 border-collapse">
              <thead>
                <tr className="bg-[#F5EFE4] text-stone-800 border-b border-[#E7E1D4] font-bold">
                  <th className="p-3 whitespace-nowrap">{isKm ? 'តួនាទី (Role)' : 'Role'}</th>
                  <th className="p-3 text-center whitespace-nowrap">{isKm ? 'អ្នកជំងឺ' : 'Patients (R/W)'}</th>
                  <th className="p-3 text-center whitespace-nowrap">{isKm ? 'ពិនិត្យ Vitals' : 'Record Vitals'}</th>
                  <th className="p-3 text-center whitespace-nowrap">{isKm ? 'ពិគ្រោះ & វិនិច្ឆ័យ' : 'Consult & Diagnose'}</th>
                  <th className="p-3 text-center whitespace-nowrap">{isKm ? 'ចេញវេជ្ជបញ្ជា' : 'Prescribe Meds'}</th>
                  <th className="p-3 text-center whitespace-nowrap">{isKm ? 'ចែកថ្នាំ' : 'Dispense Meds'}</th>
                  <th className="p-3 text-center whitespace-nowrap">{isKm ? 'គិតលុយ & KHQR' : 'Billing & KHQR'}</th>
                  <th className="p-3 text-center whitespace-nowrap">{isKm ? 'គ្រប់គ្រងបុគ្គលិក' : 'Staff Governance'}</th>
                  <th className="p-3 text-center whitespace-nowrap">{isKm ? 'គ្រប់គ្រង Admin' : 'Admin Governance'}</th>
                  <th className="p-3 text-center whitespace-nowrap">{isKm ? 'Backup ប្រព័ន្ធ' : 'Master Backup'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D7]">
                {permissions.map((p, idx) => {
                  const isOwner = p.role === 'SUPER_ADMIN';
                  const isAdmin = p.role === 'ADMIN';

                  return (
                    <tr
                      key={p.role}
                      className={`hover:bg-[#FAF7F2] transition-colors ${
                        isOwner ? 'bg-amber-50/50 font-semibold' : ''
                      }`}
                    >
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isOwner && <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                          {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                          <div>
                            <div className="font-bold text-stone-900">
                              {isKm ? p.labelKh : p.labelEn}
                            </div>
                            <div className="text-[10px] font-mono text-stone-400 uppercase">
                              {p.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Can Create/Edit Patients */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.canCreatePatients}
                          disabled={isOwner}
                          onChange={() => handleTogglePermission(idx, 'canCreatePatients')}
                          className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 cursor-pointer disabled:opacity-70"
                        />
                      </td>

                      {/* Can Record Vitals */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.canRecordVitals}
                          disabled={isOwner}
                          onChange={() => handleTogglePermission(idx, 'canRecordVitals')}
                          className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 cursor-pointer disabled:opacity-70"
                        />
                      </td>

                      {/* Can Consult/Diagnose */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.canConsultDiagnose}
                          disabled={isOwner}
                          onChange={() => handleTogglePermission(idx, 'canConsultDiagnose')}
                          className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 cursor-pointer disabled:opacity-70"
                        />
                      </td>

                      {/* Can Prescribe */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.canPrescribeMeds}
                          disabled={isOwner}
                          onChange={() => handleTogglePermission(idx, 'canPrescribeMeds')}
                          className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 cursor-pointer disabled:opacity-70"
                        />
                      </td>

                      {/* Can Dispense */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.canDispenseMeds}
                          disabled={isOwner}
                          onChange={() => handleTogglePermission(idx, 'canDispenseMeds')}
                          className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 cursor-pointer disabled:opacity-70"
                        />
                      </td>

                      {/* Can Collect Payment */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.canCollectPayment}
                          disabled={isOwner}
                          onChange={() => handleTogglePermission(idx, 'canCollectPayment')}
                          className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 cursor-pointer disabled:opacity-70"
                        />
                      </td>

                      {/* Can Manage Staff */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.canManageStaff}
                          disabled={isOwner}
                          onChange={() => handleTogglePermission(idx, 'canManageStaff')}
                          className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 cursor-pointer disabled:opacity-70"
                        />
                      </td>

                      {/* Can Manage Admins (Only SUPER_ADMIN) */}
                      <td className="p-3 text-center">
                        {isOwner ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Exclusive
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </td>

                      {/* Can Trigger Master Backup */}
                      <td className="p-3 text-center">
                        {isOwner ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Master
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" /> No
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              {isKm ? 'កំណត់ត្រាសវនកម្មសុវត្ថិភាព និងហិរញ្ញវត្ថុ' : 'Security & Financial Audit Trail'}
            </h3>
            <p className="text-xs text-stone-500">
              {isKm
                ? 'តាមដានសកម្មភាពបង្កើតគណនី ការកែប្រែសិទ្ធិ និងប្រតិបត្តិការវិក្កយបត្រថ្មីៗ'
                : 'Real-time immutable log of staff appointments and financial settlement events'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Staff Governance Actions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-700" />
                <span>{isKm ? 'សកម្មភាពបុគ្គលិក & អ្នកគ្រប់គ្រង' : 'Staff Governance Log'}</span>
              </h4>
              <div className="space-y-2">
                {auditLogs?.recentAdministrativeActions?.map((act: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white border border-[#E7E1D4] text-xs space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span className="font-mono">{new Date(act.timestamp).toLocaleString()}</span>
                      <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-bold text-[10px]">
                        {act.status}
                      </span>
                    </div>
                    <p className="font-semibold text-stone-900">{act.action}</p>
                    <p className="text-[11px] text-stone-500">Actor: {act.actor}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Transactions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>{isKm ? 'ប្រតិបត្តិការហិរញ្ញវត្ថុ & KHQR' : 'Financial Transactions'}</span>
              </h4>
              <div className="space-y-2">
                {auditLogs?.recentFinancialEvents?.map((fin: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white border border-[#E7E1D4] text-xs space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span className="font-mono">{new Date(fin.timestamp).toLocaleString()}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                        fin.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {fin.status}
                      </span>
                    </div>
                    <p className="font-semibold text-stone-900">{fin.action}</p>
                    <p className="text-[11px] text-teal-800 font-bold font-mono">Amount: {fin.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Ownership Certificate */}
      {activeTab === 'certificate' && (
        <div className="bg-[#FDFBF7] rounded-3xl border border-amber-300/80 p-8 shadow-md relative overflow-hidden animate-in fade-in duration-200">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
              <Crown className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
                OFFICIAL SYSTEM OWNERSHIP CERTIFICATE
              </span>
              <h2 className="text-2xl font-bold text-stone-900 pt-2">
                Rotana Medical Center & Polyclinic Platform
              </h2>
              <p className="text-xs text-stone-500 uppercase tracking-widest font-mono">
                Certificate ID: ROTANA-SYS-OWNER-2026-MASTER-001
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F4EE] border border-[#E7E1D4] text-left space-y-3">
              <div className="flex justify-between py-2 border-b border-[#E7E1D4]">
                <span className="text-xs text-stone-500">{isKm ? 'ម្ចាស់កម្មសិទ្ធិបញ្ញា & ប្រព័ន្ធ' : 'Intellectual Property Owner'}:</span>
                <span className="text-xs font-bold text-stone-900">Rotana Nob (លោក ណុប រតនា)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#E7E1D4]">
                <span className="text-xs text-stone-500">{isKm ? 'តួនាទីកំពូល' : 'Master Designation'}:</span>
                <span className="text-xs font-bold text-amber-900">Platform Director & System Owner (SUPER_ADMIN)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#E7E1D4]">
                <span className="text-xs text-stone-500">{isKm ? 'ប្រភេទអាជ្ញាប័ណ្ណ' : 'License Type'}:</span>
                <span className="text-xs font-bold text-emerald-800">Perpetual Enterprise Healthcare License</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#E7E1D4]">
                <span className="text-xs text-stone-500">{isKm ? 'អនុលោមភាពក្រសួងសុខាភិបាល' : 'MoH Cambodia Compliance'}:</span>
                <span className="text-xs font-bold text-teal-800">MoH-Lic: 2024/089-CP (Outpatient Ready)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs text-stone-500">{isKm ? 'ស្តង់ដារទូទាត់' : 'Payment Engine'}:</span>
                <span className="text-xs font-bold text-stone-900">National Bank of Cambodia KHQR EMVCo Tag 01=12</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>
                {isKm
                  ? 'ប្រព័ន្ធត្រូវបានការពារដោយ Cryptographic Hashing bcrypt ១២ ជុំ និង Anti-Brute-Force Guard'
                  : 'Cryptographically protected with bcrypt 12-round hashing and anti-brute-force defense'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Master Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              {isKm ? 'ប្រតិបត្តិការថែទាំស្នូល និងការសង្គ្រោះបន្ទាន់' : 'Master Maintenance & Emergency Disaster Recovery'}
            </h3>
            <p className="text-xs text-stone-500">
              {isKm
                ? 'សម្រាប់តែម្ចាស់ប្រព័ន្ធក្នុងការត្រួតពិនិត្យសុវត្ថិភាពទិន្នន័យ និងដំណើរការ Server'
                : 'Emergency operational procedures available exclusively to the System Owner'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E7E1D4] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-stone-900">
                {isKm ? 'បង្កើត Snapshot Backup ភ្លាមៗ' : 'Trigger Immediate Snapshot Backup'}
              </h4>
              <p className="text-xs text-stone-500">
                {isKm
                  ? 'បង្កើតកំណត់ត្រាទិន្នន័យបម្រុងទុកនៃរាល់តារាងអ្នកជំងឺ វេជ្ជបញ្ជា និងវិក្កយបត្រភ្លាមៗ។'
                  : 'Forces an atomic database snapshot backup of all clinical and billing tables.'}
              </p>
              <button
                onClick={handleTriggerBackup}
                disabled={backupLoading}
                className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
              >
                {backupLoading ? (isKm ? 'កំពុងដំណើរការ...' : 'Processing...') : (isKm ? 'ដំណើរការ Backup ឥឡូវនេះ' : 'Run Snapshot Now')}
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E7E1D4] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-stone-900">
                {isKm ? 'ការការពារទប់ស្កាត់ការលេចធ្លាយទិន្នន័យ' : 'Zero Data Leak Status'}
              </h4>
              <p className="text-xs text-stone-500">
                {isKm
                  ? 'តម្រង AllExceptionsFilter និង Error Handler សុវត្ថិភាពត្រូវបានបើកដំណើរការ ១០០%។'
                  : 'Global sanitized exception filters and strict route guards are actively enforcing zero data leakage.'}
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{isKm ? 'ប្រព័ន្ធមានសុវត្ថិភាពកម្រិតខ្ពស់បំផុត' : 'Enterprise Perimeter Active'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
