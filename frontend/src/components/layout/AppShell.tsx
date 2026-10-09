'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { I18nProvider, useTranslation } from '../../context/I18nContext';
import { ToastProvider } from '../../context/ToastContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNavDock } from './MobileNavDock';
import { OfflineSyncBanner } from '../common/OfflineSyncBanner';
import { PwaRegister } from '../common/PwaRegister';
import { CommandPalette } from '../common/CommandPalette';
import { ClinicLogo } from '../common/ClinicLogo';
import { ShieldCheck, Loader2 } from 'lucide-react';

const AppShellContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading && !user && !isLoginPage) {
      router.replace('/login');
    }
  }, [isLoading, user, isLoginPage, router]);

  // If on login page, render clean focused layout without sidebar/navbar
  if (isLoginPage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F7F4EE] text-stone-900 w-full relative">
        <div className="fixed top-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-[#EADDC9]/30 blur-[100px] pointer-events-none animate-ambient-drift z-0" />
        <div className="fixed bottom-[15%] left-[-8%] w-[380px] h-[380px] rounded-full bg-[#E3D4BC]/25 blur-[90px] pointer-events-none animate-ambient-drift z-0" style={{ animationDelay: '-7s' }} />
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
        <PwaRegister />
      </div>
    );
  }

  // Authentication Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F4EE] text-stone-900 p-4">
        <div className="flex flex-col items-center max-w-sm text-center space-y-4 animate-in fade-in duration-300">
          <ClinicLogo variant="full" size="md" showSubtitle={false} />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-xs font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-800" />
            <span>
              {isKm
                ? 'កំពុងផ្ទៀងផ្ទាត់សិទ្ធិសុវត្ថិភាព...'
                : 'Verifying Clinical Security Session...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated and not on login page, show transition screen while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F4EE] text-stone-900 p-4">
        <div className="flex flex-col items-center max-w-sm text-center space-y-3 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-stone-900">
            {isKm ? 'តម្រូវឱ្យចូលគណនីជាមុន' : 'Authentication Required'}
          </h2>
          <p className="text-xs text-stone-500">
            {isKm
              ? 'សូមចូលគណនីបុគ្គលិកវេជ្ជសាស្ត្រ ដើម្បីចូលប្រើទិន្នន័យគ្លីនិក'
              : 'Please sign in with authorized medical credentials to continue.'}
          </p>
        </div>
      </div>
    );
  }

  // Authenticated: Render full clinical system
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE] text-stone-900 w-full max-w-[100vw] overflow-x-hidden relative">
      {/* Subtle 3D Ambient Background Glows */}
      <div className="fixed top-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-[#EADDC9]/30 blur-[100px] pointer-events-none animate-ambient-drift z-0" />
      <div className="fixed bottom-[15%] left-[-8%] w-[380px] h-[380px] rounded-full bg-[#E3D4BC]/25 blur-[90px] pointer-events-none animate-ambient-drift z-0" style={{ animationDelay: '-7s' }} />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <OfflineSyncBanner />
        <div className="flex-1 flex max-w-7xl w-full mx-auto pb-24 md:pb-6 min-w-0">
          <Sidebar />
          <main className="flex-1 min-w-0 max-w-full p-3 sm:p-4 md:p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
        <MobileNavDock />
        <PwaRegister />
        <CommandPalette />
      </div>
    </div>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <I18nProvider>
        <ToastProvider>
          <AppShellContent>{children}</AppShellContent>
        </ToastProvider>
      </I18nProvider>
    </AuthProvider>
  );
};
