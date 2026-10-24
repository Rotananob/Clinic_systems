'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  Compass,
  ArrowRight,
  Sparkles,
  Lock,
  Search,
  LayoutDashboard,
  Users,
  Calendar,
  Monitor,
  Pill,
  Boxes,
  CreditCard,
  BarChart3,
  FileCheck,
  CalendarDays,
  FolderOpen,
  Film,
  Tv,
  FlaskConical,
  BedDouble,
  TrendingUp,
  Video,
  FileSpreadsheet,
  ShieldCheck,
  ShieldPlus,
  HeartHandshake,
  Settings,
  LayoutTemplate,
  Building2,
  Globe,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../common/ClinicLogo';
import {
  isRouteAllowed,
  getRoleDisplayName,
  isModuleRelevantForClinic,
  isRouteAllowedForPlan,
  getRequiredPlanForRoute,
  PlanTier,
} from '../../lib/rbac';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  category: 'clinical' | 'pharmacy' | 'finance' | 'admin';
  labelKh: string;
  labelEn: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';

  const [searchQuery, setSearchQuery] = useState('');

  const role = user?.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const tenantPlanTier: PlanTier = (user?.tenant?.planTier as PlanTier) || 'FREE';
  const clinicType = user?.tenant?.clinicType;

  const allModules: NavItem[] = useMemo(
    () => [
      // Clinical
      { id: 'dashboard', category: 'clinical', labelKh: 'ផ្ទាំងគ្រប់គ្រងគ្លីនិក', labelEn: 'Clinic Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { id: 'patients', category: 'clinical', labelKh: 'បញ្ជីអ្នកជំងឺ', labelEn: 'Patient Registry', href: '/patients', icon: Users },
      { id: 'visits', category: 'clinical', labelKh: 'ការពិគ្រោះ & Vitals', labelEn: 'Active Queue & Visits', href: '/visits', icon: Calendar },
      { id: 'queue', category: 'clinical', labelKh: 'ក្ដារជួរ & ហៅលេខអ្នកជំងឺ', labelEn: 'Queue & Calling Display', href: '/queue', icon: Monitor },
      { id: 'follow-ups', category: 'clinical', labelKh: 'ការណាត់ជួប & តាមដាន', labelEn: 'Follow-Ups & Recalls', href: '/follow-ups', icon: CalendarDays },
      { id: 'pacs', category: 'clinical', labelKh: 'រូបភាពវេជ្ជសាស្ត្រ - PACS', labelEn: 'Medical Imaging (PACS)', href: '/pacs', icon: Film },
      { id: 'lab', category: 'clinical', labelKh: 'មន្ទីរពិសោធន៍ & តេស្តឈាម', labelEn: 'Laboratory & Analyzer (LIS)', href: '/lab', icon: FlaskConical },
      { id: 'ipd', category: 'clinical', labelKh: 'សម្រាកពេទ្យ & ថែទាំ e-MAR', labelEn: 'Inpatient & e-MAR (IPD)', href: '/ipd', icon: BedDouble },
      { id: 'dental', category: 'clinical', labelKh: 'ទន្តសាស្ត្រ និងដ្យាក្រាមធ្មេញ', labelEn: 'Dental & Odontogram', href: '/dental', icon: Sparkles },
      { id: 'teleconsult', category: 'clinical', labelKh: 'ពិគ្រោះជំងឺពីចម្ងាយ & Telemedicine', labelEn: 'Teleconsultation & Video', href: '/teleconsult', icon: Video },
      { id: 'signage', category: 'clinical', labelKh: 'ក្ដារទូរទស្សន៍ហៅលេខ Smart TV', labelEn: 'Waiting Room TV Signage', href: '/signage', icon: Tv },
      { id: 'concierge', category: 'clinical', labelKh: 'ប្រព័ន្ធថែទាំអ្នកជំងឺ & Adherence', labelEn: 'Care Concierge & Adherence', href: '/concierge', icon: HeartHandshake },

      // Pharmacy & Inventory
      { id: 'prescriptions', category: 'pharmacy', labelKh: 'ឱសថស្ថាន & ចែកថ្នាំ', labelEn: 'Pharmacy & Dispensing', href: '/prescriptions', icon: Pill },
      { id: 'inventory', category: 'pharmacy', labelKh: 'ឃ្លាំងឱសថ FEFO ច្រើនសាខា', labelEn: 'Warehouse & Multi-Branch Stock', href: '/inventory', icon: Boxes },

      // Finance
      { id: 'billing', category: 'finance', labelKh: 'វិក្កយបត្រ & ទូទាត់ KHQR POS', labelEn: 'Invoices & Dynamic KHQR POS', href: '/billing', icon: CreditCard },
      { id: 'reports', category: 'finance', labelKh: 'របាយការណ៍ចំណូល & ស្ថិតិ', labelEn: 'Revenue & Operations Reports', href: '/reports', icon: BarChart3 },
      { id: 'finance', category: 'finance', labelKh: 'គណនេយ្យវេជ្ជបណ្ឌិត & P&L', labelEn: 'Finance P&L & Commission', href: '/finance', icon: TrendingUp },
      { id: 'insurance', category: 'finance', labelKh: 'ធានារ៉ាប់រង & ប.ស.ស.', labelEn: 'Insurance & NSSF Claims', href: '/insurance', icon: ShieldPlus },
      { id: 'eclaim', category: 'finance', labelKh: 'សំណងអេឡិចត្រូនិក eClaim & MoH', labelEn: 'Insurance Claims & MoH Surveillance', href: '/eclaim', icon: FileSpreadsheet },

      // Administration & Tools
      { id: 'certificates', category: 'admin', labelKh: 'លិខិតបញ្ជាក់សុខភាព A4', labelEn: 'Medical Certificates A4', href: '/certificates', icon: FileCheck },
      { id: 'documents', category: 'admin', labelKh: 'ឯកសារវេជ្ជសាស្ត្រ & Lab', labelEn: 'Documents & Lab Files', href: '/documents', icon: FolderOpen },
      { id: 'staff', category: 'admin', labelKh: 'គ្រប់គ្រងបុគ្គលិក', labelEn: 'Staff Management', href: '/staff', icon: ShieldCheck },
      { id: 'settings', category: 'admin', labelKh: 'ការកំណត់គ្លីនិក', labelEn: 'Clinic Settings', href: '/settings', icon: Settings },
      { id: 'invoice-template', category: 'admin', labelKh: 'រចនាម៉ូតវិក្កយបត្រ', labelEn: 'Invoice Designer', href: '/invoice-template', icon: LayoutTemplate },
      { id: 'owner', category: 'admin', labelKh: 'ផ្ទាំងម្ចាស់គ្លីនិក - Owner', labelEn: 'Owner Control Panel', href: '/owner', icon: Building2 },
      { id: 'super-admin', category: 'admin', labelKh: 'បណ្តាញគ្លីនិក - Fleet', labelEn: 'Platform Fleet Hub', href: '/super-admin', icon: Globe },
    ],
    []
  );

  const filteredModules = useMemo(() => {
    return allModules.filter((m) => {
      // Must be allowed for the role
      if (!isRouteAllowed(role, m.href)) return false;
      if (!isModuleRelevantForClinic(clinicType, m.href, role)) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.labelKh.toLowerCase().includes(q) ||
        m.labelEn.toLowerCase().includes(q) ||
        m.href.toLowerCase().includes(q)
      );
    });
  }, [allModules, role, clinicType, searchQuery]);

  if (!isOpen) return null;

  const handleOpenExplore = () => {
    onClose();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-explore-modules'));
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-[86vw] max-w-[340px] bg-[#FDFBF7] h-full shadow-2xl border-r border-[#E7E1D4] flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#E7E1D4] bg-[#F7F3EA] flex items-center justify-between">
          <Link href="/dashboard" onClick={onClose} className="block">
            <ClinicLogo variant="sidebar" size="sm" />
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-[#EBE2D0] transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto touch-scroll p-3.5 space-y-3.5">
          {/* Eye-catching Explore All Tools & Features Banner */}
          <div
            onClick={handleOpenExplore}
            className="group relative p-3 rounded-2xl bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white shadow-md hover:shadow-lg border border-teal-700/60 transition-all cursor-pointer overflow-hidden active:scale-98"
          >
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between gap-1 mb-1 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[10px] font-black uppercase tracking-wider font-mono">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                </span>
                <span>{isKh ? '២៦ ម៉ូឌុលពេញលេញ' : 'All 26 Modules'}</span>
              </span>

              <span className="text-[10px] font-mono text-teal-200 font-bold flex items-center gap-0.5">
                <span>{isKh ? 'ពិនិត្យសិទ្ធិ' : 'Access Hub'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            <div className="relative z-10 flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black tracking-tight leading-snug text-white">
                  {isKh ? 'រុករកឧបករណ៍ & មុខងារទាំងអស់' : 'Explore All Tools & Features'}
                </div>
                <div className="text-[10px] text-teal-100/80 truncate mt-0.5">
                  {isKh ? 'ដឹងភ្លាមថាគ្លីនិកប្រើបានឬអត់' : 'Check which tools are unlocked'}
                </div>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] relative z-10">
              <span className="text-teal-200/90 font-medium">
                {isKh ? 'ស្ថានភាពគម្រោង៖' : 'Plan Status:'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-black/30 text-amber-300 font-mono font-bold text-[9px] border border-amber-300/30">
                {isSuperAdmin
                  ? (isKh ? 'ម្ចាស់ប្រព័ន្ធ - All Active' : 'Owner - All Active')
                  : tenantPlanTier === 'FREE'
                  ? (isKh ? 'Free - ដំឡើងប្រើ Pro' : 'Free - Upgrade to Pro')
                  : tenantPlanTier === 'STARTER_5'
                  ? (isKh ? '$5 - ១២ មុខងារសកម្ម' : '$5 - 12 Active')
                  : tenantPlanTier === 'PRO_8'
                  ? (isKh ? '$8 - ២៤ មុខងារសកម្ម' : '$8 - 24 Active')
                  : (isKh ? '$12 - ២៦ មុខងារពេញលេញ' : '$12 - 26 Active')}
              </span>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isKh ? 'ស្វែងរកឧបករណ៍ ឬម៉ូឌុល...' : 'Search tools or modules...'}
              className="w-full pl-8 pr-7 py-2 text-xs bg-[#F5EFE4] border border-[#DFD6C6] rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-teal-700 focus:bg-white shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-0.5 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Navigation List */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 font-mono">
              {isKh ? 'បញ្ជីឧបករណ៍ & មុខងារគ្លីនិក' : 'Clinical Modules & Tools'}
            </div>

            {filteredModules.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isPlanAllowed =
                isSuperAdmin || isRouteAllowedForPlan(tenantPlanTier, item.href, clinicType);
              const requiredPlan = getRequiredPlanForRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all active:scale-98 ${
                    isActive
                      ? 'bg-[#F2ECE0] text-stone-950 font-bold border border-[#DDD5C5] shadow-2xs'
                      : 'text-stone-700 hover:bg-[#F7F2E8]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-teal-800'
                          : isPlanAllowed
                          ? 'text-stone-500'
                          : 'text-stone-400'
                      }`}
                    />
                    <span className="truncate">{isKh ? item.labelKh : item.labelEn}</span>
                  </div>

                  {!isPlanAllowed ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0 font-mono">
                      <Lock className="w-2.5 h-2.5 text-amber-700" />
                      <span>${requiredPlan.priceUsd}</span>
                    </span>
                  ) : isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-700 shrink-0" />
                  ) : null}
                </Link>
              );
            })}
          </div>

          {/* Plan Upgrade Card at bottom for non-enterprise */}
          {!isSuperAdmin && tenantPlanTier !== 'ENTERPRISE_12' && (
            <div className="p-3 rounded-2xl bg-[#F6F1E6] border border-[#DFD6C6] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">
                  {isKh ? 'គម្រោងបច្ចុប្បន្ន' : 'Current Tier'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black border border-teal-200 font-mono">
                  {tenantPlanTier === 'FREE' ? 'FREE' : tenantPlanTier === 'STARTER_5' ? '$5/mo' : '$8/mo'}
                </span>
              </div>
              <Link
                href="/pricing"
                onClick={onClose}
                className="w-full py-1.5 px-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {tenantPlanTier === 'FREE'
                    ? (isKh ? 'ដំឡើងទៅ Starter - $5/mo' : 'Upgrade to Starter ($5/mo)')
                    : tenantPlanTier === 'STARTER_5'
                    ? (isKh ? 'ដំឡើងទៅ Pro - $8/mo' : 'Upgrade to Pro ($8/mo)')
                    : (isKh ? 'ដំឡើងទៅ Enterprise - $12/mo' : 'Upgrade to Enterprise ($12/mo)')}
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#E7E1D4] bg-[#F7F3EA] flex items-center justify-between text-xs">
          <LanguageSwitcher />

          {user && (
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-stone-600 hover:text-rose-700 hover:bg-rose-50 border border-[#DFD6C6] transition-colors font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.nav.logout}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
