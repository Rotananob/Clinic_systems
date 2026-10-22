'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import {
  Globe,
  Building2,
  Users,
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  Search,
  Sliders,
  Trash2,
  ExternalLink,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  UserPlus,
  KeyRound,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react';

export default function SuperAdminFleetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [clinics, setClinics] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');

  // Modals state
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  // Form states for modals
  const [overrideForm, setOverrideForm] = useState({
    planTier: 'PRO_8',
    addDays: 30,
    reason: '',
  });
  const [freezeReason, setFreezeReason] = useState('');
  const [maintenanceForm, setMaintenanceForm] = useState({
    enabled: false,
    messageKh: '',
    messageEn: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'CLINICS' | 'USERS'>('CLINICS');

  // Global Users State
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [globalUsersLoading, setGlobalUsersLoading] = useState(false);
  const [globalUsersTotal, setGlobalUsersTotal] = useState(0);
  const [globalUsersPage, setGlobalUsersPage] = useState(1);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userTenantFilter, setUserTenantFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');

  // Global User Modals State
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isResetUserPasswordModalOpen, setIsResetUserPasswordModalOpen] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<any>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    password: '',
    fullNameEn: '',
    fullNameKh: '',
    role: 'DOCTOR',
    tenantId: '',
    phone: '',
    department: '',
  });

  const [editUserForm, setEditUserForm] = useState({
    fullNameEn: '',
    fullNameKh: '',
    role: 'DOCTOR',
    tenantId: '',
    phone: '',
    department: '',
    isActive: true,
  });

  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
  });

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/');
      return;
    }
    loadData();
  }, [user]);

  const loadGlobalUsers = async () => {
    try {
      setGlobalUsersLoading(true);
      const res = await api.superAdmin.getUsers({
        query: userSearchQuery,
        role: userRoleFilter,
        tenantId: userTenantFilter,
        isActive: userStatusFilter === 'ALL' ? undefined : userStatusFilter === 'ACTIVE',
        page: globalUsersPage,
        limit: 15,
      });
      if (res && res.users) {
        setGlobalUsers(res.users);
        setGlobalUsersTotal(res.pagination?.total || res.users.length);
      }
    } catch (err: any) {
      toast.error(isKm ? 'មិនអាចទាញយកទិន្នន័យអ្នកប្រើប្រាស់បានទេ' : 'Failed to fetch global users');
    } finally {
      setGlobalUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'USERS') {
      loadGlobalUsers();
    }
  }, [activeTab, globalUsersPage, userRoleFilter, userTenantFilter, userStatusFilter]);

  const handleSearchUsers = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalUsersPage(1);
    loadGlobalUsers();
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.superAdmin.createUser({
        email: createUserForm.email,
        password: createUserForm.password,
        fullNameEn: createUserForm.fullNameEn,
        fullNameKh: createUserForm.fullNameKh || undefined,
        role: createUserForm.role,
        tenantId: createUserForm.tenantId || undefined,
        phone: createUserForm.phone || undefined,
        department: createUserForm.department || undefined,
      });
      toast.success(isKm ? 'បានបង្កើតគណនីអ្នកប្រើប្រាស់ជោគជ័យ' : 'Global user created successfully');
      setIsCreateUserModalOpen(false);
      setCreateUserForm({
        email: '',
        password: '',
        fullNameEn: '',
        fullNameKh: '',
        role: 'DOCTOR',
        tenantId: '',
        phone: '',
        department: '',
      });
      loadGlobalUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditUser = (u: any) => {
    setSelectedUserForAction(u);
    setEditUserForm({
      fullNameEn: u.fullNameEn || '',
      fullNameKh: u.fullNameKh || '',
      role: u.role || 'DOCTOR',
      tenantId: u.tenantId || '',
      phone: u.phone || '',
      department: u.department || '',
      isActive: Boolean(u.isActive),
    });
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction) return;
    try {
      setActionLoading(true);
      await api.superAdmin.updateUser(selectedUserForAction.id, {
        fullNameEn: editUserForm.fullNameEn,
        fullNameKh: editUserForm.fullNameKh || undefined,
        role: editUserForm.role,
        tenantId: editUserForm.tenantId ? editUserForm.tenantId : null,
        phone: editUserForm.phone || undefined,
        department: editUserForm.department || undefined,
        isActive: editUserForm.isActive,
      });
      toast.success(isKm ? 'បានកែប្រែគណនីជោគជ័យ' : 'User updated successfully');
      setIsEditUserModalOpen(false);
      setSelectedUserForAction(null);
      loadGlobalUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenResetPassword = (u: any) => {
    setSelectedUserForAction(u);
    setResetPasswordForm({ newPassword: generateRandomPassword() });
    setCopiedPassword(false);
    setIsResetUserPasswordModalOpen(true);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction || !resetPasswordForm.newPassword) return;
    try {
      setActionLoading(true);
      await api.superAdmin.resetPassword(selectedUserForAction.id, resetPasswordForm.newPassword);
      toast.success(
        isKm
          ? `បានប្តូរលេខសម្ងាត់សម្រាប់ ${selectedUserForAction.email} ជោគជ័យ`
          : `Password reset successfully for ${selectedUserForAction.email}`,
      );
      setIsResetUserPasswordModalOpen(false);
      setSelectedUserForAction(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (u: any) => {
    try {
      const newStatus = !u.isActive;
      await api.superAdmin.updateUser(u.id, { isActive: newStatus });
      toast.success(
        newStatus
          ? isKm ? 'បានបើកដំណើរការគណនីឡើងវិញ' : 'Account activated'
          : isKm ? 'បានចាក់សោរផ្អាកគណនី' : 'Account suspended',
      );
      loadGlobalUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsRes, fleetRes, maintRes] = await Promise.all([
        api.superAdmin.getMetrics(),
        api.superAdmin.getTenants(),
        api.superAdmin.getMaintenanceMode(),
      ]);

      setMetrics(metricsRes);
      setClinics(fleetRes || []);
      setMaintenanceForm({
        enabled: maintRes.maintenanceMode,
        messageKh: maintRes.messageKh || '',
        messageEn: maintRes.messageEn || '',
      });
    } catch (err: any) {
      toast.error(
        isKm
          ? 'មិនអាចទាញយកទិន្នន័យបណ្តាញគ្លីនិកបានទេ'
          : 'Failed to load fleet governance metrics',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'CLINICS') {
      loadData();
    } else {
      loadGlobalUsers().finally(() => setRefreshing(false));
    }
  };

  // Emergency Lockout / Freeze
  const handleConfirmFreeze = async () => {
    if (!selectedClinic) return;
    try {
      setActionLoading(true);
      const isCurrentlyFrozen = !selectedClinic.isActive;
      if (isCurrentlyFrozen) {
        await api.superAdmin.unfreezeTenant(selectedClinic.id);
        toast.success(
          isKm
            ? `បានបើកដំណើរការគ្លីនិក ${selectedClinic.clinicNameKh} ឡើងវិញ`
            : `Restored workspace for ${selectedClinic.clinicNameEn}`,
        );
      } else {
        await api.superAdmin.freezeTenant(selectedClinic.id, freezeReason);
        toast.success(
          isKm
            ? `បានចាក់សោរផ្អាកដំណើរការគ្លីនិក ${selectedClinic.clinicNameKh}`
            : `Suspended workspace for ${selectedClinic.clinicNameEn}`,
        );
      }
      setIsFreezeModalOpen(false);
      setSelectedClinic(null);
      setFreezeReason('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Plan Override
  const handleConfirmOverride = async () => {
    if (!selectedClinic) return;
    try {
      setActionLoading(true);
      await api.superAdmin.overridePlan(selectedClinic.id, {
        planTier: overrideForm.planTier,
        addDays: Number(overrideForm.addDays),
        reason: overrideForm.reason,
      });
      toast.success(
        isKm
          ? `បានកែប្រែគម្រោង និងពន្យារសុពលភាពសម្រាប់ ${selectedClinic.clinicNameKh}`
          : `Plan override applied for ${selectedClinic.clinicNameEn}`,
      );
      setIsOverrideModalOpen(false);
      setSelectedClinic(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Override failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Purge Demo Data
  const handleConfirmPurge = async () => {
    if (!selectedClinic) return;
    try {
      setActionLoading(true);
      const res = await api.superAdmin.purgeDemoData(selectedClinic.id);
      toast.success(
        isKm
          ? `បានលុបទិន្នន័យសាកល្បង៖ ${res.purged.patients} អ្នកជំងឺ និង ${res.purged.invoices} វិក្កយបត្រ`
          : `Purged ${res.purged.patients} patients and ${res.purged.invoices} invoices`,
      );
      setIsPurgeModalOpen(false);
      setSelectedClinic(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Purge failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Maintenance Toggle
  const handleToggleMaintenance = async () => {
    try {
      setActionLoading(true);
      const newStatus = !maintenanceForm.enabled;
      await api.superAdmin.setMaintenanceMode({
        enabled: newStatus,
        messageKh: maintenanceForm.messageKh,
        messageEn: maintenanceForm.messageEn,
      });
      setMaintenanceForm((prev) => ({ ...prev, enabled: newStatus }));
      toast.success(
        newStatus
          ? isKm
            ? 'បានបើកដំណើរការ Maintenance Mode ទូទាំងប្រទេស'
            : 'Maintenance Mode has been activated platform-wide'
          : isKm
          ? 'បានបិទ Maintenance Mode និងបើកដំណើរការប្រព័ន្ធឡើងវិញ'
          : 'Maintenance Mode has been deactivated',
      );
      setIsMaintenanceModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Maintenance toggle failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter clinics
  const filteredClinics = clinics.filter((c) => {
    const matchesSearch =
      c.clinicNameKh?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clinicNameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phonePrimary?.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && c.isActive && c.subscriptionStatus === 'ACTIVE') ||
      (statusFilter === 'PAST_DUE' && c.subscriptionStatus === 'PAST_DUE') ||
      (statusFilter === 'FROZEN' && (!c.isActive || c.subscriptionStatus === 'CANCELLED'));

    const matchesTier = tierFilter === 'ALL' || c.planTier === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center py-24 space-y-3">
        <RefreshCw className="w-8 h-8 text-teal-800 animate-spin mx-auto" />
        <div className="text-sm font-bold text-stone-700">
          {isKm ? 'កំពុងទាញយកទិន្នន័យបណ្តាញគ្លីនិក PaaS...' : 'Loading Multi-Clinic Fleet Dashboard...'}
        </div>
      </div>
    );
  }

  const isGlobalMaintenance = metrics?.system?.maintenanceMode;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-800 text-white text-[10px] font-bold tracking-wider uppercase">
              Super Admin Fleet
            </span>
            <span className="text-xs text-stone-400 font-mono">ClinicOS PaaS v2.4</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 mt-1 font-sans">
            {isKm ? 'ផ្ទាំងគ្រប់គ្រងបណ្តាញគ្លីនិក & ប្រព័ន្ធកណ្តាល' : 'Multi-Clinic Fleet Hub & System Metrics'}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isKm
              ? 'គ្រប់គ្រង Workspace គ្លីនិកទាំងអស់ ត្រួតពិនិត្យចំណូល SaaS និងបញ្ជាបិទបើកប្រព័ន្ធពីចម្ងាយ'
              : 'Enterprise multi-tenant clinic fleet governance, subscription revenue, and remote toggles'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMaintenanceModalOpen(true)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isGlobalMaintenance
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>
              {isGlobalMaintenance
                ? isKm
                  ? 'Maintenance: កំពុងបើក'
                  : 'Maintenance: ACTIVE'
                : isKm
                ? 'កុងតាក់ Maintenance'
                : 'Maintenance Switch'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{isKm ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh Fleet'}</span>
          </button>
        </div>
      </div>

      {/* Global Maintenance Alert if Active */}
      {isGlobalMaintenance && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-600/40 text-amber-950 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-extrabold uppercase tracking-wide">
              {isKm
                ? 'ប្រព័ន្ធកំពុងស្ថិតក្នុង MAINTENANCE MODE ទូទាំងប្រទេស'
                : 'NATIONWIDE PLATFORM MAINTENANCE MODE IS ACTIVE'}
            </div>
            <p className="leading-relaxed opacity-90">
              {metrics?.system?.maintenanceMessageKh ||
                'រាល់ការតភ្ជាប់ពីគ្លីនិកទាំងអស់ត្រូវបានផ្អាកបណ្ដោះអាសន្ន។ មានតែ Super Admin ប៉ុណ្ណោះដែលអាចចូលប្រើប្រាស់បាន។'}
            </p>
          </div>
        </div>
      )}

      {/* Super Admin Central Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('CLINICS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'CLINICS'
              ? 'bg-teal-800 text-white shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{isKm ? 'គ្រប់គ្រងគ្លីនិកទាំងអស់ (Clinics Fleet)' : 'All Clinics Fleet'}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'CLINICS'
                ? 'bg-teal-900 text-teal-100'
                : 'bg-stone-200 text-stone-700'
            }`}
          >
            {clinics.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'USERS'
              ? 'bg-teal-800 text-white shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isKm ? 'គ្រប់គ្រងអ្នកប្រើប្រាស់ទាំងអស់ (Global Users)' : 'Global User Governance'}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'USERS'
                ? 'bg-teal-900 text-teal-100'
                : 'bg-stone-200 text-stone-700'
            }`}
          >
            {globalUsersTotal || 0}
          </span>
        </button>
      </div>

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Clinic Fleet */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isKm ? 'បណ្តាញគ្លីនិកសរុប' : 'Clinic Fleet Total'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-stone-900 font-mono">
              {metrics?.fleet?.totalClinics || 0}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-medium">
              <span className="text-emerald-700 font-bold">
                {metrics?.fleet?.activeClinics || 0} {isKm ? 'សកម្ម' : 'Active'}
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-amber-700 font-bold">
                {metrics?.fleet?.pastDueClinics || 0} {isKm ? 'ហួសកំណត់' : 'Past Due'}
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-red-700 font-bold">
                {metrics?.fleet?.frozenClinics || 0} {isKm ? 'ចាក់សោ' : 'Frozen'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Financial MRR & Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isKm ? 'ចំណូល SaaS MRR' : 'Monthly Recurring (MRR)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-900 font-mono">
              ${metrics?.financial?.mrrUsd?.toFixed(2) || '0.00'}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
              <span>ARR: ${metrics?.financial?.arrUsd?.toLocaleString() || 0}</span>
              <span className="text-stone-300">•</span>
              <span className="font-semibold text-stone-700">
                All-Time: ${metrics?.financial?.totalRevenueUsd?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Patients Platform-Wide */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isKm ? 'អ្នកជំងឺក្នុងប្រព័ន្ធសរុប' : 'Total Fleet Patients'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-stone-900 font-mono">
              {metrics?.activity?.totalPatients?.toLocaleString() || 0}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
              <span>{metrics?.activity?.totalVisits?.toLocaleString() || 0} Visits</span>
              <span className="text-stone-300">•</span>
              <span>{metrics?.activity?.totalStaffAccounts || 0} Staff Members</span>
            </div>
          </div>
        </div>

        {/* Card 4: KHQR POS Volume */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isKm ? 'ប្រតិបត្តិការ KHQR សរុប' : 'Dynamic KHQR Processed'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-stone-900 font-mono">
              {metrics?.activity?.totalKhqrTransactions?.toLocaleString() || 0}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
              <span>Tag 01=12 Bakong Standard</span>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: CLINICS FLEET DIRECTORY */}
      {activeTab === 'CLINICS' && (
        <div className="space-y-6">
      {/* Multi-Clinic Fleet Directory Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-[#FAF7F2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isKm
                  ? 'ស្វែងរកតាមឈ្មោះគ្លីនិក, Subdomain, ឬលេខទូរស័ព្ទ...'
                  : 'Search by clinic name, subdomain, or phone...'
              }
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-teal-700"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label={isKm ? 'ត្រងតាមស្ថានភាព' : 'Filter by status'}
              className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 bg-white focus:outline-hidden"
            >
              <option value="ALL">{isKm ? 'គ្រប់ស្ថានភាព (All Status)' : 'All Statuses'}</option>
              <option value="ACTIVE">{isKm ? 'សកម្ម (Active)' : 'Active'}</option>
              <option value="PAST_DUE">{isKm ? 'ហួសកំណត់ (Past Due)' : 'Past Due'}</option>
              <option value="FROZEN">{isKm ? 'ចាក់សោ (Frozen)' : 'Frozen'}</option>
            </select>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              aria-label={isKm ? 'ត្រងតាមគម្រោង' : 'Filter by tier'}
              className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 bg-white focus:outline-hidden"
            >
              <option value="ALL">{isKm ? 'គ្រប់គម្រោង (All Tiers)' : 'All Plans'}</option>
              <option value="FREE">Free Plan</option>
              <option value="STARTER_5">Starter ($5/mo)</option>
              <option value="PRO_8">Pro ($8/mo)</option>
              <option value="ENTERPRISE_12">Enterprise ($12/mo)</option>
            </select>
          </div>
        </div>

        {/* Clinics Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100 text-stone-600 uppercase text-[10px] tracking-wider font-mono">
                <th className="py-3 px-4">Clinic Workspace</th>
                <th className="py-3 px-3">Plan Tier</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Daily KHQR</th>
                <th className="py-3 px-3 text-center">Patients</th>
                <th className="py-3 px-3">Expires / Days</th>
                <th className="py-3 px-3 text-right">Revenue</th>
                <th className="py-3 px-4 text-right">Remote Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredClinics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500 text-xs">
                    {isKm
                      ? 'មិនមានគ្លីនិកត្រូវនឹងការស្វែងរកនេះទេ'
                      : 'No clinic workspaces matching filter criteria'}
                  </td>
                </tr>
              ) : (
                filteredClinics.map((clinic) => {
                  const isFrozen = !clinic.isActive || clinic.subscriptionStatus === 'CANCELLED';
                  const isPastDue = clinic.subscriptionStatus === 'PAST_DUE';

                  return (
                    <tr
                      key={clinic.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isFrozen ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Clinic Info */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-stone-900 text-xs">
                          {clinic.clinicNameKh}
                        </div>
                        <div className="text-[11px] text-stone-600 font-medium">
                          {clinic.clinicNameEn}
                        </div>
                        <div className="text-[10px] font-mono text-teal-800 flex items-center gap-1 mt-0.5">
                          <span>{clinic.subdomain}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {clinic.phonePrimary || 'N/A'} • MoH: {clinic.mohLicenseNumber || 'N/A'}
                        </div>
                      </td>

                      {/* Plan Tier Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            clinic.planTier === 'ENTERPRISE_12'
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : clinic.planTier === 'PRO_8'
                              ? 'bg-teal-100 text-teal-900 border border-teal-200'
                              : clinic.planTier === 'STARTER_5'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {clinic.planTier}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        {isFrozen ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                            <Lock className="w-3 h-3" />
                            <span>FROZEN</span>
                          </span>
                        ) : isPastDue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>PAST DUE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ACTIVE</span>
                          </span>
                        )}
                      </td>

                      {/* KHQR Usage */}
                      <td className="py-3 px-3 text-center font-mono text-[11px]">
                        <span className="font-bold text-stone-900">
                          {clinic.stats?.todayKhqrCount || 0}
                        </span>
                        <span className="text-stone-400">
                          {' '}
                          /{' '}
                          {clinic.stats?.dailyKhqrQuota === -1
                            ? 'Unltd'
                            : clinic.stats?.dailyKhqrQuota}
                        </span>
                      </td>

                      {/* Patients Intake */}
                      <td className="py-3 px-3 text-center font-mono text-[11px]">
                        <span className="font-bold text-stone-900">
                          {clinic.stats?.patientCount || 0}
                        </span>
                        <span className="text-stone-400">
                          {' '}
                          /{' '}
                          {clinic.stats?.monthlyPatientQuota === -1
                            ? 'Unltd'
                            : clinic.stats?.monthlyPatientQuota}
                        </span>
                      </td>

                      {/* Expiration */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900">
                          {clinic.daysRemaining} {isKm ? 'ថ្ងៃ' : 'days left'}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {clinic.currentPeriodEnd
                            ? new Date(clinic.currentPeriodEnd).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </td>

                      {/* Revenue Paid */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                        ${clinic.stats?.totalRevenueUsd?.toFixed(2) || '0.00'}
                      </td>

                      {/* Remote Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Freeze / Unfreeze Toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClinic(clinic);
                              setIsFreezeModalOpen(true);
                            }}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isFrozen
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                            }`}
                            title={isFrozen ? 'Unfreeze clinic' : 'Emergency Lockout / Freeze'}
                          >
                            {isFrozen ? (
                              <Unlock className="w-3.5 h-3.5" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Plan Override */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClinic(clinic);
                              setOverrideForm({
                                planTier: clinic.planTier,
                                addDays: 30,
                                reason: '',
                              });
                              setIsOverrideModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors"
                            title="Override Plan / Extend Days"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* Purge Demo Data */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClinic(clinic);
                              setIsPurgeModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-stone-300 text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Purge Demo Patients & Encounters"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


        </div>
      )}
      {/* TAB 2: GLOBAL USER GOVERNANCE (Phase 1) */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          {/* User Search & Filters Toolbar */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <form onSubmit={handleSearchUsers} className="flex-1 relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder={
                    isKm
                      ? 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬលេខទូរស័ព្ទ...'
                      : 'Search by user name, email, or phone...'
                  }
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-hidden focus:border-teal-700 bg-stone-50/50"
                />
              </form>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Role Filter */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setGlobalUsersPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 bg-stone-50/50 focus:outline-hidden"
                >
                  <option value="ALL">{isKm ? 'គ្រប់តួនាទី (All Roles)' : 'All Roles'}</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  <option value="ADMIN">CLINIC ADMIN</option>
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="NURSE">NURSE</option>
                  <option value="PHARMACIST">PHARMACIST</option>
                  <option value="RECEPTIONIST">RECEPTIONIST</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="LAB_TECH">LAB TECH</option>
                </select>

                {/* Tenant Filter */}
                <select
                  value={userTenantFilter}
                  onChange={(e) => {
                    setUserTenantFilter(e.target.value);
                    setGlobalUsersPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 bg-stone-50/50 focus:outline-hidden max-w-[180px] truncate"
                >
                  <option value="ALL">{isKm ? 'គ្រប់គ្លីនិក (All Clinics)' : 'All Clinics'}</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isKm ? c.clinicNameKh : c.clinicNameEn}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={userStatusFilter}
                  onChange={(e) => {
                    setUserStatusFilter(e.target.value);
                    setGlobalUsersPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 bg-stone-50/50 focus:outline-hidden"
                >
                  <option value="ALL">{isKm ? 'គ្រប់ស្ថានភាព' : 'All Status'}</option>
                  <option value="ACTIVE">{isKm ? 'សកម្ម (Active)' : 'Active'}</option>
                  <option value="DISABLED">{isKm ? 'ចាក់សោ (Disabled)' : 'Disabled'}</option>
                </select>

                {/* Create User Button */}
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isKm ? 'បង្កើតគណនីថ្មី' : 'Create User'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Global Users Data Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            {globalUsersLoading ? (
              <div className="p-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-teal-800 animate-spin mx-auto" />
                <div className="text-xs text-stone-500 font-medium">
                  {isKm ? 'កំពុងទាញយកបញ្ជីអ្នកប្រើប្រាស់...' : 'Loading global users directory...'}
                </div>
              </div>
            ) : globalUsers.length === 0 ? (
              <div className="p-12 text-center space-y-2 text-stone-500">
                <Users className="w-8 h-8 text-stone-300 mx-auto" />
                <div className="text-sm font-bold text-stone-700">
                  {isKm ? 'មិនមានអ្នកប្រើប្រាស់ត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ' : 'No users match your criteria'}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase">
                    <tr>
                      <th className="p-4">{isKm ? 'អ្នកប្រើប្រាស់' : 'User'}</th>
                      <th className="p-4">{isKm ? 'តួនាទី' : 'Role'}</th>
                      <th className="p-4">{isKm ? 'គ្លីនិកសាមី' : 'Clinic Affiliation'}</th>
                      <th className="p-4">{isKm ? 'ផ្នែក / ជំនាញ' : 'Department'}</th>
                      <th className="p-4 text-center">{isKm ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="p-4 text-right">{isKm ? 'សកម្មភាព' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {globalUsers.map((u) => {
                      const roleColors: Record<string, string> = {
                        SUPER_ADMIN: 'bg-amber-100 text-amber-900 border-amber-300',
                        ADMIN: 'bg-teal-100 text-teal-900 border-teal-300',
                        DOCTOR: 'bg-blue-100 text-blue-900 border-blue-300',
                        NURSE: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                        PHARMACIST: 'bg-purple-100 text-purple-900 border-purple-300',
                        RECEPTIONIST: 'bg-sky-100 text-sky-900 border-sky-300',
                        ACCOUNTANT: 'bg-rose-100 text-rose-900 border-rose-300',
                        LAB_TECH: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                      };

                      return (
                        <tr key={u.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                {u.fullNameEn ? u.fullNameEn.substring(0, 2) : 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-stone-900 truncate">
                                  {u.fullNameKh || u.fullNameEn}
                                </div>
                                <div className="text-[11px] text-stone-500 font-mono truncate">
                                  {u.email}
                                </div>
                                {u.phone && (
                                  <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1 mt-0.5">
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>{u.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                                roleColors[u.role] || 'bg-stone-100 text-stone-800 border-stone-200'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="p-4">
                            {u.tenant ? (
                              <div>
                                <div className="font-bold text-stone-900 truncate max-w-[180px]">
                                  {isKm ? u.tenant.clinicNameKh : u.tenant.clinicNameEn}
                                </div>
                                <div className="text-[10px] text-stone-400 font-mono">
                                  {u.tenant.slug}.krupet.com
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Platform Core
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-stone-600">
                            {u.department || '-'}
                          </td>

                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                                u.isActive
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                              }`}
                            >
                              {u.isActive ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-700" />
                                  <span>{isKm ? 'សកម្ម' : 'Active'}</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3 text-red-700" />
                                  <span>{isKm ? 'ចាក់សោ' : 'Disabled'}</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenResetPassword(u)}
                                title={isKm ? 'ប្តូរលេខសម្ងាត់' : 'Reset Password'}
                                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                title={isKm ? 'កែប្រែព័ត៌មាន' : 'Edit Details'}
                                className="p-1.5 rounded-lg border border-stone-200 hover:bg-teal-50 hover:text-teal-800 text-stone-600 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {globalUsersTotal > 15 && (
              <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">
                  {isKm ? 'បង្ហាញសរុប:' : 'Total users:'}{' '}
                  <strong className="text-stone-900 font-bold">{globalUsersTotal}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={globalUsersPage <= 1}
                    onClick={() => setGlobalUsersPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-stone-300 hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-stone-700">
                    {isKm ? 'ទំព័រ' : 'Page'} {globalUsersPage} / {Math.ceil(globalUsersTotal / 15)}
                  </span>
                  <button
                    type="button"
                    disabled={globalUsersPage >= Math.ceil(globalUsersTotal / 15)}
                    onClick={() => setGlobalUsersPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-stone-300 hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL 1: Freeze / Emergency Lockout Confirmation */}
      {isFreezeModalOpen && selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs font-sans">
          <div className="bg-white border border-stone-300 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  selectedClinic.isActive ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {selectedClinic.isActive ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Unlock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  {selectedClinic.isActive
                    ? isKm
                      ? 'ចាក់សោរផ្អាកដំណើរការ (Emergency Freeze)'
                      : 'Emergency Lockout / Freeze Clinic'
                    : isKm
                    ? 'បើកដំណើរការគ្លីនិកឡើងវិញ (Unfreeze)'
                    : 'Restore Clinic Workspace Access'}
                </h3>
                <p className="text-xs text-stone-500">{selectedClinic.clinicNameKh}</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {selectedClinic.isActive
                ? isKm
                  ? 'នៅពេលចាក់សោរ បុគ្គលិកទាំងអស់របស់គ្លីនិកនេះនឹងមិនអាចចូលប្រើប្រាស់ ឬទូទាត់ប្រាក់បានឡើយរហូតដល់មានការដោះសោរដោយ Super Admin។'
                  : 'Freezing this clinic will immediately block all staff logins, dynamic KHQR creation, and operations until unlocked.'
                : isKm
                ? 'តើលោកអ្នកចង់បើកដំណើរការគ្លីនិកនេះឡើងវិញដោយកំណត់ស្ថានភាពទៅ ACTIVE មែនដែរឬទេ?'
                : 'Restoring this clinic will re-enable staff logins and all features instantly.'}
            </p>

            {selectedClinic.isActive && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">
                  {isKm ? 'មូលហេតុនៃការចាក់សោរ (Reason):' : 'Lockout Reason:'}
                </label>
                <input
                  type="text"
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  placeholder={
                    isKm
                      ? 'ឧ. បំពានលក្ខខណ្ឌសេវាកម្ម, សង្ស័យការក្លែងបន្លំ...'
                      : 'e.g. Terms violation, payment dispute, audit request...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-hidden"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsFreezeModalOpen(false);
                  setSelectedClinic(null);
                }}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmFreeze}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs ${
                  selectedClinic.isActive
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {actionLoading
                  ? isKm
                    ? 'កំពុងដំណើរការ...'
                    : 'Processing...'
                  : selectedClinic.isActive
                  ? isKm
                    ? 'បញ្ជាក់ការចាក់សោរ'
                    : 'Confirm Freeze'
                  : isKm
                  ? 'បញ្ជាក់ការបើកឡើងវិញ'
                  : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Plan Override & Extension */}
      {isOverrideModalOpen && selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs font-sans">
          <div className="bg-white border border-stone-300 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  {isKm ? 'កែប្រែគម្រោង និងពន្យារសុពលភាព' : 'Plan Override & Validity Extension'}
                </h3>
                <p className="text-xs text-stone-500">{selectedClinic.clinicNameKh}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {isKm ? 'ជ្រើសរើស Plan Tier ថ្មី:' : 'Select Target Plan Tier:'}
                </label>
                <select
                  value={overrideForm.planTier}
                  onChange={(e) => setOverrideForm({ ...overrideForm, planTier: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900"
                >
                  <option value="FREE">Free Plan ($0/mo)</option>
                  <option value="STARTER_5">Clinic Starter ($5/mo - 250 KHQR/day)</option>
                  <option value="PRO_8">Polyclinic Pro ($8/mo - 1,500 KHQR/day)</option>
                  <option value="ENTERPRISE_12">Hospital Enterprise ($12/mo - Unlimited)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {isKm ? 'ពន្យារសុពលភាពបន្ថែម (ថ្ងៃ):' : 'Add Complimentary Days:'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 90, 365].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setOverrideForm({ ...overrideForm, addDays: days })}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        overrideForm.addDays === days
                          ? 'bg-teal-800 text-white border-teal-800'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      +{days}d
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {isKm ? 'កំណត់សម្គាល់រដ្ឋបាល (Reason):' : 'Administrative Reason:'}
                </label>
                <input
                  type="text"
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                  placeholder={
                    isKm
                      ? 'ឧ. ការឧបត្ថម្ភពិសេស, VIP Partnership, សាកល្បង...'
                      : 'e.g. VIP promotion, institutional contract, manual adjustment'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsOverrideModalOpen(false);
                  setSelectedClinic(null);
                }}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
              >
                {actionLoading
                  ? isKm
                    ? 'កំពុងរក្សាទុក...'
                    : 'Saving...'
                  : isKm
                  ? 'រក្សាទុកការកែប្រែ'
                  : 'Apply Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Purge Demo Data Confirmation */}
      {isPurgeModalOpen && selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs font-sans">
          <div className="bg-white border border-stone-300 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-red-950">
                  {isKm ? 'លុបទិន្នន័យសាកល្បងរបស់គ្លីនិក' : 'Purge Clinic Demo Data'}
                </h3>
                <p className="text-xs text-stone-500">{selectedClinic.clinicNameKh}</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {isKm
                ? 'សកម្មភាពនេះនឹងលុបអ្នកជំងឺ ប្រវត្តិពិនិត្យ វេជ្ជបញ្ជា និងវិក្កយបត្រទាំងអស់របស់គ្លីនិកនេះដើម្បីត្រៀមដំណើរការជាក់ស្តែង។ គណនីបុគ្គលិក និងការកំណត់ផ្សេងៗនឹងត្រូវបានរក្សាទុកដដែល។'
                : 'This will purge all staging patients, visits, prescriptions, and invoices for this clinic. User credentials and settings will be preserved.'}
            </p>

            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-[11px] text-red-800 font-semibold">
              {isKm
                ? 'ការព្រមាន៖ ទិន្នន័យដែលបានលុបមិនអាចទាញយកមកវិញបានឡើយ។'
                : 'Warning: This action is irreversible.'}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsPurgeModalOpen(false);
                  setSelectedClinic(null);
                }}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmPurge}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs"
              >
                {actionLoading
                  ? isKm
                    ? 'កំពុងលុប...'
                    : 'Purging...'
                  : isKm
                  ? 'លុបទិន្នន័យ Demo ឥឡូវនេះ'
                  : 'Purge Demo Data Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Nationwide Maintenance Mode Switch */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs font-sans">
          <div className="bg-white border border-stone-300 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  maintenanceForm.enabled
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  {isKm
                    ? 'កុងតាក់ថែទាំប្រព័ន្ធទូទាំងប្រទេស (Maintenance Mode)'
                    : 'Nationwide Maintenance Mode Switch'}
                </h3>
                <p className="text-xs text-stone-500">Platform-Wide Infrastructure Control</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {isKm
                ? 'នៅពេលបើក Maintenance Mode រាល់ Traffic ពីគ្លីនិកទាំងអស់នឹងឃើញផ្ទាំងជូនដំណឹងអំពីការថែទាំម៉ាស៊ីនបម្រើការ (503 Service Unavailable)។ មានតែ Super Admin ប៉ុណ្ណោះដែលអាចបញ្ជាបាន។'
                : 'Activating maintenance mode will shield all incoming clinical traffic with a 503 maintenance screen. Only Super Admins can bypass.'}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {isKm ? 'សារជូនដំណឹងជាភាសាខ្មែរ:' : 'Khmer Broadcast Message:'}
                </label>
                <textarea
                  rows={2}
                  value={maintenanceForm.messageKh}
                  onChange={(e) =>
                    setMaintenanceForm({ ...maintenanceForm, messageKh: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {isKm ? 'សារជូនដំណឹងជាភាសាអង់គ្លេស:' : 'English Broadcast Message:'}
                </label>
                <textarea
                  rows={2}
                  value={maintenanceForm.messageEn}
                  onChange={(e) =>
                    setMaintenanceForm({ ...maintenanceForm, messageEn: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleToggleMaintenance}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs ${
                  maintenanceForm.enabled
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionLoading
                  ? isKm
                    ? 'កំពុងប្តូរ...'
                    : 'Updating...'
                  : maintenanceForm.enabled
                  ? isKm
                    ? 'បិទ Maintenance (បើកដំណើរការឡើងវិញ)'
                    : 'Deactivate Maintenance'
                  : isKm
                  ? 'បើក Maintenance Mode ឥឡូវនេះ'
                  : 'Activate Maintenance Mode'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal 1: Create Global User */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <UserPlus className="w-5 h-5 text-teal-800" />
                <span>{isKm ? 'បង្កើតគណនីអ្នកប្រើប្រាស់ថ្មី' : 'Create Global User'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {isKm ? 'អ៊ីមែល (Email) *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 font-mono text-xs focus:outline-hidden"
                  placeholder="doctor@clinic.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {isKm ? 'លេខសម្ងាត់ (Password) *' : 'Initial Password *'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-stone-900 font-mono text-xs focus:outline-hidden"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setCreateUserForm({ ...createUserForm, password: generateRandomPassword() })}
                    className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                  >
                    {isKm ? 'បង្កើតកូដ' : 'Generate'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isKm ? 'ឈ្មោះជាអង់គ្លេស *' : 'Full Name (EN) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={createUserForm.fullNameEn}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, fullNameEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-hidden"
                    placeholder="Dr. Sok Dara"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isKm ? 'ឈ្មោះជាខ្មែរ' : 'Full Name (KH)'}
                  </label>
                  <input
                    type="text"
                    value={createUserForm.fullNameKh}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, fullNameKh: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-hidden"
                    placeholder="វេជ្ជ. សុខ ដារ៉ា"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isKm ? 'តួនាទី (Role) *' : 'Role *'}
                  </label>
                  <select
                    value={createUserForm.role}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-hidden"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                    <option value="ADMIN">CLINIC ADMIN</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="NURSE">NURSE</option>
                    <option value="PHARMACIST">PHARMACIST</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="LAB_TECH">LAB TECH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isKm ? 'គ្លីនិកសាមី (Clinic)' : 'Clinic Tenant'}
                  </label>
                  <select
                    value={createUserForm.tenantId}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, tenantId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-hidden"
                  >
                    <option value="">{isKm ? 'គ្មាន (Platform Core)' : 'None (Platform Core)'}</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isKm ? c.clinicNameKh : c.clinicNameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isKm ? 'លេខទូរស័ព្ទ' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    value={createUserForm.phone}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-hidden"
                    placeholder="012345678"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isKm ? 'ផ្នែក / ជំនាញ' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={createUserForm.department}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-hidden"
                    placeholder="General Practice"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {actionLoading ? (isKm ? 'កំពុងបង្កើត...' : 'Creating...') : isKm ? 'បង្កើតគណនី' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Global User */}
      {isEditUserModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <Edit2 className="w-5 h-5 text-teal-800" />
                <span>{isKm ? 'កែប្រែព័ត៌មានអ្នកប្រើប្រាស់' : 'Edit User Profile'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <span className="text-stone-500">{isKm ? 'អ៊ីមែលគណនី:' : 'Account Email:'}</span>{' '}
              <strong className="font-mono text-stone-900">{selectedUserForAction.email}</strong>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isKm ? 'ឈ្មោះជាអង់គ្លេស *' : 'Full Name (EN) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editUserForm.fullNameEn}
                    onChange={(e) => setEditUserForm({ ...editUserForm, fullNameEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isKm ? 'ឈ្មោះជាខ្មែរ' : 'Full Name (KH)'}
                  </label>
                  <input
                    type="text"
                    value={editUserForm.fullNameKh}
                    onChange={(e) => setEditUserForm({ ...editUserForm, fullNameKh: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isKm ? 'តួនាទី (Role) *' : 'Role *'}
                  </label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-hidden"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                    <option value="ADMIN">CLINIC ADMIN</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="NURSE">NURSE</option>
                    <option value="PHARMACIST">PHARMACIST</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="LAB_TECH">LAB TECH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isKm ? 'គ្លីនិកសាមី (Clinic)' : 'Clinic Tenant'}
                  </label>
                  <select
                    value={editUserForm.tenantId}
                    onChange={(e) => setEditUserForm({ ...editUserForm, tenantId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-hidden"
                  >
                    <option value="">{isKm ? 'គ្មាន (Platform Core)' : 'None (Platform Core)'}</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isKm ? c.clinicNameKh : c.clinicNameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isKm ? 'លេខទូរស័ព្ទ' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    value={editUserForm.phone}
                    onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isKm ? 'ផ្នែក / ជំនាញ' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={editUserForm.department}
                    onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-800 block">
                    {isKm ? 'ស្ថានភាពដំណើរការគណនី' : 'Account Active Status'}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {isKm ? 'បើកដំណើរការ ឬផ្អាកការចូលប្រើប្រាស់' : 'Enable or disable platform login'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editUserForm.isActive}
                  onChange={(e) => setEditUserForm({ ...editUserForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-teal-800 rounded focus:ring-teal-700 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {actionLoading ? (isKm ? 'កំពុងរក្សាទុក...' : 'Saving...') : isKm ? 'រក្សាទុកការកែប្រែ' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reset Password Modal */}
      {isResetUserPasswordModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <KeyRound className="w-5 h-5 text-amber-700" />
                <span>{isKm ? 'ប្តូរលេខសម្ងាត់រដ្ឋបាល' : 'Administrative Password Reset'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsResetUserPasswordModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-stone-500">{isKm ? 'កំណត់លេខសម្ងាត់ថ្មីសម្រាប់:' : 'Reset password for user:'}</div>
              <div className="font-bold text-stone-900 font-mono text-sm">{selectedUserForAction.email}</div>
              <div className="text-[11px] text-stone-500">
                {selectedUserForAction.fullNameKh || selectedUserForAction.fullNameEn} ({selectedUserForAction.role})
              </div>
            </div>

            <form onSubmit={handleConfirmResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {isKm ? 'លេខសម្ងាត់ថ្មី (New Password) *' : 'New Secure Password *'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={resetPasswordForm.newPassword}
                    onChange={(e) => setResetPasswordForm({ newPassword: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs text-stone-900 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resetPasswordForm.newPassword);
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                    className="px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{isKm ? 'បានចម្លង' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isKm ? 'ចម្លង' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                {isKm
                  ? 'ការប្តូរលេខសម្ងាត់នេះនឹងមានសុពលភាពភ្លាមៗ។ សូមប្រគល់លេខសម្ងាត់នេះទៅកាន់អ្នកប្រើប្រាស់ដោយសុវត្ថិភាព។'
                  : 'This reset will take effect immediately. Please deliver the generated credentials to the user securely.'}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetUserPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold shadow-xs cursor-pointer"
                >
                  {actionLoading ? (isKm ? 'កំពុងប្តូរ...' : 'Resetting...') : isKm ? 'បញ្ជាក់ប្តូរលេខសម្ងាត់' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
