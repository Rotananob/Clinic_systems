'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, Pill, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { label: 'Clinic Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Patient Registry', href: '/patients', icon: Users },
    { label: 'Active Queue & Visits', href: '/visits', icon: Calendar },
    { label: 'Pharmacy & Dispensing', href: '/prescriptions', icon: Pill },
    { label: 'Invoices & KHQR Settlement', href: '/billing', icon: CreditCard },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'Staff Management', href: '/staff', icon: ShieldCheck });
  }

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
