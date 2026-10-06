'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, Pill, CreditCard } from 'lucide-react';

import { useTranslation } from '../../context/I18nContext';

export const MobileNavDock: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { label: t.nav.dashboard, href: '/', icon: LayoutDashboard },
    { label: t.nav.patients, href: '/patients', icon: Users },
    { label: t.nav.visits, href: '/visits', icon: Calendar },
    { label: t.nav.prescriptions, href: '/prescriptions', icon: Pill },
    { label: t.nav.billing, href: '/billing', icon: CreditCard },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 md:hidden pb-safe">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? 'text-teal-700 font-medium'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
