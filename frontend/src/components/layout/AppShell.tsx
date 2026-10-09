'use client';

import React from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { I18nProvider } from '../../context/I18nContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNavDock } from './MobileNavDock';
import { OfflineSyncBanner } from '../common/OfflineSyncBanner';
import { PwaRegister } from '../common/PwaRegister';
import { CommandPalette } from '../common/CommandPalette';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <I18nProvider>
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
      </I18nProvider>
    </AuthProvider>
  );
};
