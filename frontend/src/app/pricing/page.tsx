'use client';

import React from 'react';
import { PublicNavbar } from '../../components/landing/PublicNavbar';
import { PricingMatrix } from '../../components/landing/PricingMatrix';
import { PublicFooter } from '../../components/landing/PublicFooter';

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE] text-stone-900 selection:bg-teal-800 selection:text-white">
      <PublicNavbar />
      <main className="flex-1 py-6">
        <PricingMatrix />
      </main>
      <PublicFooter />
    </div>
  );
}
