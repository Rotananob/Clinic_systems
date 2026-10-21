'use client';

import React from 'react';
import { PublicNavbar } from '../../components/landing/PublicNavbar';
import { LandingHero } from '../../components/landing/LandingHero';
import { BeforeAfterSection } from '../../components/landing/BeforeAfterSection';
import { RoiCalculatorSection } from '../../components/landing/RoiCalculatorSection';
import { ClinicDisciplineSection } from '../../components/landing/ClinicDisciplineSection';
import { FeaturesSection } from '../../components/landing/FeaturesSection';
import { DoctorTestimonialsSection } from '../../components/landing/DoctorTestimonialsSection';
import { PricingMatrix } from '../../components/landing/PricingMatrix';
import { FaqSection } from '../../components/landing/FaqSection';
import { BottomCtaBanner } from '../../components/landing/BottomCtaBanner';
import { PublicFooter } from '../../components/landing/PublicFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE] text-stone-900 selection:bg-teal-800 selection:text-white">
      <PublicNavbar />
      <main className="flex-1">
        <LandingHero />
        <BeforeAfterSection />
        <RoiCalculatorSection />
        <ClinicDisciplineSection />
        <FeaturesSection />
        <DoctorTestimonialsSection />
        <PricingMatrix />
        <FaqSection />
        <BottomCtaBanner />
      </main>
      <PublicFooter />
    </div>
  );
}
