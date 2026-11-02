'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Monitor,
  Pill,
  Boxes,
  CreditCard,
  FileCheck,
  CalendarDays,
  FolderOpen,
  Film,
  Tv,
  FlaskConical,
  BedDouble,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  ShieldPlus,
  HeartHandshake,
  Settings,
  BarChart3,
  LayoutTemplate,
  Building2,
  UserCheck,
  Globe,
  Video,
  FileSpreadsheet,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../common/ClinicLogo';
import { isRouteAllowed, getRoleDisplayName, isModuleRelevantForClinic, isRouteAllowedForPlan } from '../../lib/rbac';
import { isModuleHidden } from '../../lib/module-visibility';
import { CORE_9_ROUTES } from '../../lib/sidebar-navigation';
import { Sparkles as SparklesIcon } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';
  const [mounted, setMounted] = React.useState(false);
  const [moduleVersion, setModuleVersion] = React.useState(0);

  React.useEffect(() => {
    const handler = () => setModuleVersion((v) => v + 1);
    window.addEventListener('krupet-modules-changed', handler);
    return () => window.removeEventListener('krupet-modules-changed', handler);
  }, []);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const allNavItems = [
    { label: t.nav.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { label: t.nav.patients, href: '/patients', icon: Users },
    { label: t.nav.visits, href: '/visits', icon: Calendar },
    { label: t.nav.queue, href: '/queue', icon: Monitor },
    { label: t.nav.prescriptions, href: '/prescriptions', icon: Pill },
    { label: t.nav.warehouse, href: '/inventory', icon: Boxes },
    { label: t.nav.billing, href: '/billing', icon: CreditCard },
    { label: t.nav.reports, href: '/reports', icon: BarChart3 },
    { label: t.nav.certificates, href: '/certificates', icon: FileCheck },
    { label: t.nav.followUps, href: '/follow-ups', icon: CalendarDays },
    { label: t.nav.documents, href: '/documents', icon: FolderOpen },
    { label: t.nav.pacs || 'Medical Imaging - PACS', href: '/pacs', icon: Film },
    { label: t.nav.insurance || 'Insurance & NSSF', href: '/insurance', icon: ShieldPlus },
    { label: t.nav.concierge || 'Care Concierge', href: '/concierge', icon: HeartHandshake },
    { label: t.nav.signage || 'Waiting Room TV Signage', href: '/signage', icon: Tv },
    { label: t.nav.lab || 'Laboratory & Analyzer - LIS', href: '/lab', icon: FlaskConical },
    { label: t.nav.ipd || 'Inpatient & e-MAR - IPD', href: '/ipd', icon: BedDouble },
    { label: t.nav.finance || 'Finance & P&L', href: '/finance', icon: TrendingUp },
    { label: t.nav.dental || 'Dental & Odontogram', href: '/dental', icon: Sparkles },
    { label: t.nav.teleconsult || 'Teleconsultation', href: '/teleconsult', icon: Video },
    { label: t.nav.eclaim || 'Insurance Claims & MoH', href: '/eclaim', icon: FileSpreadsheet },
    { label: t.nav.staff, href: '/staff', icon: ShieldCheck },
    { label: isKh ? 'បណ្តាញគ្លីនិក - Fleet' : 'Platform Fleet', href: '/super-admin', icon: Globe },
    { label: t.nav.ownerControl, href: '/owner', icon: Building2 },
    { label: t.nav.invoiceTemplate, href: '/invoice-template', icon: LayoutTemplate },
    { label: t.nav.settings, href: '/settings', icon: Settings },
    { label: isKh ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'My Profile', href: '/profile', icon: UserCheck },
  ];

  if (!mounted) {
    return (
      <aside className="hidden md:flex flex-col w-64 border-r border-[#E7E1D4] bg-[#FDFBF7] min-h-[calc(100vh-4rem)] p-4 shadow-2xs">
        <div className="mb-4">
          <ClinicLogo variant="sidebar" />
        </div>
      </aside>
    );
  }

  const role = user?.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const tenantPlanTier = user?.tenant?.planTier || 'FREE';

  // Progressive SaaS plan feature gating: Free has minimal modules, Starter has more, Pro and Enterprise unlock higher clinical suites
  const allowedItems = allNavItems.filter((item) => {
    if (!isRouteAllowed(role, item.href)) return false;
    if (!isModuleRelevantForClinic(user?.tenant?.clinicType, item.href, role)) return false;
    if (!isSuperAdmin && !isRouteAllowedForPlan(tenantPlanTier, item.href, user?.tenant?.clinicType)) {
      return false;
    }
    if (item.href !== '/' && item.href !== '/settings' && item.href !== '/profile' && isModuleHidden(item.href)) {
      return false;
    }
    return true;
  });

  // Core 9 daily routes imported from sidebar-navigation

  const coreNavItems = allowedItems.filter((item) => (CORE_9_ROUTES as readonly string[]).includes(item.href));
  const activeExtraItem = allowedItems.find(
    (item) =>
      !(CORE_9_ROUTES as readonly string[]).includes(item.href) &&
      (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
  );
  const remainingCount = Math.max(0, allNavItems.length - CORE_9_ROUTES.length);

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[#E7E1D4] bg-[#FDFBF7] min-h-[calc(100vh-4rem)] p-4 shadow-2xs select-none">
      {/* Brand Badge in Sidebar */}
      <div className="mb-3">
        <Link href="/dashboard" className="block hover:opacity-90 transition-opacity">
          <ClinicLogo variant="sidebar" />
        </Link>
      </div>

      {/* Role Pill */}
      <div className="mb-4 p-2.5 rounded-xl bg-[#F6F1E6] border border-[#E7DFC9] flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
            {isKh ? 'តួនាទីបច្ចុប្បន្ន' : 'Current Role'}
          </div>
          <div className="text-xs font-bold text-stone-900 truncate flex items-center gap-1.5 mt-0.5">
            {isSuperAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
            <span className="truncate">{getRoleDisplayName(role, isKh)}</span>
          </div>
        </div>
        {isSuperAdmin ? (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 text-[10px] font-bold border border-amber-500/30 shrink-0">
            {isKh ? 'ម្ចាស់ប្រព័ន្ធ' : 'OWNER'}
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200 shrink-0">
            RBAC
          </span>
        )}
      </div>

      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-1.5 font-mono flex items-center justify-between">
        <span>{isKh ? '១០ ឧបករណ៍សំខាន់ៗ' : '10 Primary Tools'}</span>
        <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 font-semibold font-mono">
          10/10
        </span>
      </div>

      {/* Allowed Core Modules */}
      <nav className="space-y-1">
        {coreNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#F2ECE0] text-stone-900 font-semibold shadow-2xs border border-[#DFD8CA]'
                  : 'text-stone-600 hover:bg-[#F6F1E6] hover:text-stone-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-teal-800' : 'text-stone-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        {/* Active Specialty Module if navigating outside core 9 */}
        {activeExtraItem && (
          <div className="pt-1.5 mt-1 border-t border-[#E7E1D4]">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider px-3 mb-1 font-mono">
              {isKh ? 'ឧបករណ៍ឯកទេសកំពុងបើក' : 'Active Specialty Tool'}
            </div>
            <Link
              href={activeExtraItem.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-950 border border-amber-300 shadow-2xs"
            >
              <activeExtraItem.icon className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="truncate">{activeExtraItem.label}</span>
              <span className="ml-auto px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[9px] font-bold font-mono">
                {isKh ? 'សកម្ម' : 'Active'}
              </span>
            </Link>
          </div>
        )}

        {/* Button 10: Explore All Tools with dynamic +Count badge */}
        <div className="pt-1.5">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-explore-modules'))}
            className="group relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white shadow-xs hover:shadow-md hover:from-teal-800 hover:to-emerald-800 border border-teal-700/60 active:scale-98"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                <Compass className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <span className="truncate tracking-tight">
                {isKh ? 'រុករកឧបករណ៍ទាំងអស់' : 'Explore All Tools'}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-200 border border-amber-300/40 text-[10px] font-mono font-black shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
              </span>
              <span>+{remainingCount}</span>
            </span>
          </button>
        </div>
      </nav>

      {/* SaaS Progressive Plan Tier Card at bottom */}
      {!isSuperAdmin && (
        <div className="mt-auto pt-4 border-t border-[#E7E1D4]">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#F6F1E6] to-[#ECE5D6] border border-[#DDD5C5] shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">
                {isKh ? 'គម្រោងប្រើប្រាស់' : 'Current Plan'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                  tenantPlanTier === 'FREE'
                    ? 'bg-stone-200 text-stone-700 border-stone-300'
                    : tenantPlanTier === 'STARTER_5'
                    ? 'bg-teal-100 text-teal-800 border-teal-300'
                    : tenantPlanTier === 'PRO_8'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : tenantPlanTier === 'ENTERPRISE_12'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : tenantPlanTier === 'SPECIALIST_15'
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                    : 'bg-purple-100 text-purple-900 border-purple-300'
                }`}
              >
                {tenantPlanTier === 'FREE'
                  ? 'Free'
                  : tenantPlanTier === 'STARTER_5'
                  ? '$5/mo'
                  : tenantPlanTier === 'PRO_8'
                  ? '$8/mo'
                  : tenantPlanTier === 'ENTERPRISE_12'
                  ? '$12/mo'
                  : tenantPlanTier === 'SPECIALIST_15'
                  ? '$15/mo'
                  : '$20/mo'}
              </span>
            </div>

            <div>
              <div className="text-xs font-bold text-stone-900 font-sans">
                {tenantPlanTier === 'FREE'
                  ? 'Free Starter'
                  : tenantPlanTier === 'STARTER_5'
                  ? 'Clinic Starter'
                  : tenantPlanTier === 'PRO_8'
                  ? 'Polyclinic Pro'
                  : tenantPlanTier === 'ENTERPRISE_12'
                  ? 'Hospital Enterprise'
                  : tenantPlanTier === 'SPECIALIST_15'
                  ? 'Specialist Clinic'
                  : 'Unlimited PaaS'}
              </div>
              <p className="text-[10px] text-stone-600 mt-0.5 leading-relaxed">
                {tenantPlanTier === 'FREE'
                  ? (isKh
                      ? 'មុខងារមូលដ្ឋាន៖ អ្នកជំងឺ & ក្ដារហៅលេខ'
                      : 'Basic tier: Patient intake & queue board')
                  : tenantPlanTier === 'STARTER_5'
                  ? (isKh
                      ? 'រួមមាន វេជ្ជបញ្ជា, គិតលុយ KHQR & របាយការណ៍'
                      : 'Includes Prescriptions, POS KHQR & Reports')
                  : tenantPlanTier === 'PRO_8'
                  ? (isKh
                      ? 'រួមមាន ឃ្លាំងស្តុក, PACS, LIS, IPD & Signage'
                      : 'Includes Warehouse, PACS, LIS & IPD')
                  : tenantPlanTier === 'ENTERPRISE_12'
                  ? (isKh
                      ? 'បើកដំណើរការគ្រប់ម៉ូឌុលទាំងអស់ក្នុងប្រព័ន្ធ'
                      : 'Full platform unlimited access')
                  : tenantPlanTier === 'SPECIALIST_15'
                  ? (isKh
                      ? 'កញ្ចប់គ្លីនិកឯកទេស និងបញ្ជាសំឡេង AI'
                      : 'Specialist suite with AI voice dictation')
                  : (isKh
                      ? 'គម្រោងគ្មានដែនកំណត់ ដំឡើង White-label'
                      : 'Unlimited PaaS with white-label domain')}
              </p>
            </div>

            {tenantPlanTier !== 'UNLIMITED_20' && (
              <Link
                href="/pricing"
                className="w-full mt-1.5 py-1.5 px-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-[11px] font-bold shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                <SparklesIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>
                  {tenantPlanTier === 'FREE'
                    ? (isKh ? 'ដំឡើងទៅ Starter - $5/mo' : 'Upgrade to Starter ($5/mo)')
                    : tenantPlanTier === 'STARTER_5'
                    ? (isKh ? 'ដំឡើងទៅ Pro - $8/mo' : 'Upgrade to Pro ($8/mo)')
                    : tenantPlanTier === 'PRO_8'
                    ? (isKh ? 'ដំឡើងទៅ Enterprise - $12/mo' : 'Upgrade to Enterprise ($12/mo)')
                    : tenantPlanTier === 'ENTERPRISE_12'
                    ? (isKh ? 'ដំឡើងទៅ Specialist - $15/mo' : 'Upgrade to Specialist ($15/mo)')
                    : (isKh ? 'ដំឡើងទៅ Unlimited - $20/mo' : 'Upgrade to Unlimited ($20/mo)')}
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
