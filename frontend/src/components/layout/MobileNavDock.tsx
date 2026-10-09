'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, Monitor, CreditCard } from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';

export const MobileNavDock: React.FC = () => {
  const pathname = usePathname();
  const { locale } = useTranslation();

  const navItems = [
    { label: locale === 'km' ? 'ទំព័រដើម' : 'Home', href: '/', icon: LayoutDashboard },
    { label: locale === 'km' ? 'អ្នកជំងឺ' : 'Patients', href: '/patients', icon: Users },
    { label: locale === 'km' ? 'ជួរហៅលេខ' : 'Queue', href: '/queue', icon: Monitor },
    { label: locale === 'km' ? 'ពិគ្រោះ' : 'Visits', href: '/visits', icon: Calendar },
    { label: locale === 'km' ? 'គិតលុយ' : 'Billing', href: '/billing', icon: CreditCard },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-t border-[#E7E1D4] md:hidden pb-safe shadow-lg">
      <div className="grid grid-cols-5 h-14 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-all rounded-lg mx-0.5 active:scale-95 ${
                isActive
                  ? 'text-stone-900 font-bold bg-[#F2EDE2] border border-[#DFD8CA] shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.3] text-teal-800' : 'stroke-[1.8]'}`} />
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

