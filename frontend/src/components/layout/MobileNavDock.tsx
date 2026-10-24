'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Monitor,
  CreditCard,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { isRouteAllowed, isRouteAllowedForPlan } from '../../lib/rbac';

export const MobileNavDock: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { locale } = useTranslation();
  const isKh = locale === 'km';
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tenantPlanTier = user?.tenant?.planTier || 'FREE';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const handleOpenExplore = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-explore-modules'));
  };

  const navItems = [
    {
      label: isKh ? 'ផ្ទាំងដើម' : 'Home',
      href: '/dashboard',
      icon: LayoutDashboard,
      isSpecial: false,
    },
    {
      label: isKh ? 'អ្នកជំងឺ' : 'Patients',
      href: '/patients',
      icon: Users,
      isSpecial: false,
    },
    {
      label: isKh ? 'រុករក ២៦' : 'All Tools',
      href: '#explore',
      icon: Compass,
      isSpecial: true,
      onClick: handleOpenExplore,
    },
    {
      label: isKh ? 'ជួរហៅ' : 'Queue',
      href: '/queue',
      icon: Monitor,
      isSpecial: false,
    },
    {
      label: isKh ? 'គិតលុយ' : 'POS',
      href: '/billing',
      icon: CreditCard,
      isSpecial: false,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-xl border-t border-[#E7E1D4] md:hidden pb-safe shadow-lg">
      <div className="grid grid-cols-5 h-14 items-center px-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isSpecial) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center justify-center py-0.5 active:scale-95 transition-transform"
                title={isKh ? 'រុករកឧបករណ៍ & មុខងារទាំងអស់ - ២៦ ម៉ូឌុល' : 'Explore All Tools & Features (26 Modules)'}
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-800 to-emerald-900 text-amber-300 flex items-center justify-center -mt-3 shadow-md border-2 border-white group">
                  <Icon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </div>
                <span className="text-[10px] leading-tight mt-0.5 font-bold text-teal-900 tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-all rounded-xl mx-0.5 active:scale-95 ${
                isActive
                  ? 'text-stone-900 font-bold bg-[#F2EDE2] border border-[#DFD8CA] shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 ${
                  isActive ? 'stroke-[2.3] text-teal-800' : 'stroke-[1.8]'
                }`}
              />
              <span className="text-[10px] leading-tight mt-0.5 truncate max-w-[62px] text-center font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
