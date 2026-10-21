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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../common/ClinicLogo';
import { isRouteAllowed, getRoleDisplayName, isModuleRelevantForClinic } from '../../lib/rbac';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const allNavItems = [
    { label: t.nav.dashboard, href: '/', icon: LayoutDashboard },
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
    { label: t.nav.pacs || 'Medical Imaging (PACS)', href: '/pacs', icon: Film },
    { label: t.nav.insurance || 'Insurance & NSSF', href: '/insurance', icon: ShieldPlus },
    { label: t.nav.concierge || 'Care Concierge', href: '/concierge', icon: HeartHandshake },
    { label: t.nav.signage || 'Waiting Room TV Signage', href: '/signage', icon: Tv },
    { label: t.nav.lab || 'Laboratory & Analyzer (LIS)', href: '/lab', icon: FlaskConical },
    { label: t.nav.ipd || 'Inpatient & e-MAR (IPD)', href: '/ipd', icon: BedDouble },
    { label: t.nav.finance || 'Finance & P&L', href: '/finance', icon: TrendingUp },
    { label: t.nav.dental || 'Dental & Odontogram', href: '/dental', icon: Sparkles },
    { label: t.nav.teleconsult || 'Teleconsultation', href: '/teleconsult', icon: Video },
    { label: t.nav.eclaim || 'Insurance Claims & MoH', href: '/eclaim', icon: FileSpreadsheet },
    { label: t.nav.staff, href: '/staff', icon: ShieldCheck },
    { label: isKh ? 'បណ្តាញគ្លីនិក (Fleet)' : 'Platform Fleet', href: '/super-admin', icon: Globe },
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

  // Filter navigation items by verified server-side role and clinic specialization
  const allowedItems = allNavItems.filter((item) => {
    if (!isRouteAllowed(role, item.href)) return false;
    if (!isModuleRelevantForClinic(user?.tenant?.clinicType, item.href, role)) return false;
    return true;
  });

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[#E7E1D4] bg-[#FDFBF7] min-h-[calc(100vh-4rem)] p-4 shadow-2xs select-none">
      {/* Brand Badge in Sidebar */}
      <div className="mb-3">
        <ClinicLogo variant="sidebar" />
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

      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-1.5 font-mono">
        {isSuperAdmin
          ? (isKh ? 'ម៉ូឌុលទាំងអស់ (All Modules)' : 'All Clinic Modules')
          : (isKh ? 'ម៉ូឌុលអនុញ្ញាត (Allowed)' : 'Allowed Modules')}
      </div>

      {/* Allowed Modules */}
      <nav className="space-y-1">
        {allowedItems.map((item) => {
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
      </nav>
    </aside>
  );
};
