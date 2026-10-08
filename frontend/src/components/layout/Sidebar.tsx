'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, Pill, CreditCard, ShieldCheck, CalendarDays, FolderOpen, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: t.nav.dashboard, href: '/', icon: LayoutDashboard },
    { label: t.nav.patients, href: '/patients', icon: Users },
    { label: t.nav.visits, href: '/visits', icon: Calendar },
    { label: t.nav.prescriptions, href: '/prescriptions', icon: Pill },
    { label: t.nav.billing, href: '/billing', icon: CreditCard },
    { label: t.nav.followUps, href: '/follow-ups', icon: CalendarDays },
    { label: t.nav.documents, href: '/documents', icon: FolderOpen },
  ];

  if (mounted && user?.role === 'ADMIN') {
    navItems.push({ label: t.nav.staff, href: '/staff', icon: ShieldCheck });
  }

  navItems.push({ label: t.nav.settings, href: '/settings', icon: Settings });

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
        Clinical Modules
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-800 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
