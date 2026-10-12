'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, Monitor, CreditCard, Pill, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { isRouteAllowed } from '../../lib/rbac';

export const MobileNavDock: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { locale } = useTranslation();
  const isKh = locale === 'km';

  const potentialItems = [
    { label: isKh ? 'ទំព័រដើម' : 'Home', href: '/', icon: LayoutDashboard },
    { label: isKh ? 'អ្នកជំងឺ' : 'Patients', href: '/patients', icon: Users },
    { label: isKh ? 'ជួរហៅ' : 'Queue', href: '/queue', icon: Monitor },
    { label: isKh ? 'ពិគ្រោះ' : 'Visits', href: '/visits', icon: Calendar },
    { label: isKh ? 'បើកថ្នាំ' : 'Pharmacy', href: '/prescriptions', icon: Pill },
    { label: isKh ? 'គិតលុយ' : 'Billing', href: '/billing', icon: CreditCard },
    { label: isKh ? 'គណនី' : 'Profile', href: '/profile', icon: UserCheck },
  ];

  // Filter based on user's active role permissions
  const activeItems = potentialItems
    .filter((item) => isRouteAllowed(user?.role, item.href))
    .slice(0, 5); // Display top 5 relevant allowed items for mobile thumb zone

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-t border-[#E7E1D4] md:hidden pb-safe shadow-lg">
      <div
        className="grid h-14 items-center px-1"
        style={{ gridTemplateColumns: `repeat(${activeItems.length}, minmax(0, 1fr))` }}
      >
        {activeItems.map((item) => {
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
