'use client';

import React from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { I18nProvider } from '../../context/I18nContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNavDock } from './MobileNavDock';
import { OfflineSyncBanner } from '../common/OfflineSyncBanner';
import { PwaRegister } from '../common/PwaRegister';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <I18nProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <OfflineSyncBanner />
          <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-6">
            <Sidebar />
            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
              {children}
            </main>
          </div>
          <MobileNavDock />
          <PwaRegister />
        </div>
      </I18nProvider>
    </AuthProvider>
  );
};
