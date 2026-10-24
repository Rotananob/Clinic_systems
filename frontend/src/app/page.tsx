'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/I18nContext';
import { PublicNavbar } from '../components/landing/PublicNavbar';
import { LandingHero } from '../components/landing/LandingHero';
import { BeforeAfterSection } from '../components/landing/BeforeAfterSection';
import { RoiCalculatorSection } from '../components/landing/RoiCalculatorSection';
import { ClinicDisciplineSection } from '../components/landing/ClinicDisciplineSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { DoctorTestimonialsSection } from '../components/landing/DoctorTestimonialsSection';
import { PricingMatrix } from '../components/landing/PricingMatrix';
import { FaqSection } from '../components/landing/FaqSection';
import { BottomCtaBanner } from '../components/landing/BottomCtaBanner';
import { PublicFooter } from '../components/landing/PublicFooter';
import { ArrowRight } from 'lucide-react';

export default function RootHomePage() {
  const { user } = useAuth();
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const router = useRouter();

  // Redirect authenticated clinic users directly to dashboard
  React.useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('clinic_access_token') : null;
    if (token || user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE] text-stone-900 selection:bg-teal-800 selection:text-white">
      {/* If logged in, show an authenticated user quick-access ribbon */}
      {user && (
        <div className="bg-teal-900 text-teal-100 text-xs px-4 py-2 border-b border-teal-800">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {isKm
                  ? `លោកអ្នកកំពុង Login: ${user.tenant?.clinicNameKh || user.tenant?.clinicNameEn || 'គ្លីនិក'} - ${user.fullNameKh || user.fullNameEn}`
                  : `Signed in: ${user.tenant?.clinicNameEn || 'Clinic'} (${user.fullNameEn || user.email})`}
              </span>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 font-bold text-white hover:text-teal-200 underline decoration-teal-400 underline-offset-4"
            >
              <span>{isKm ? 'ចូលទៅកាន់ផ្ទាំងគ្រប់គ្រង Dashboard' : 'Open Clinic Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      <PublicNavbar />

      <main className="flex-1">
        {/* 1. Hero with 3D Interactive Console, Fast Subdomain Claimer & Real Audio Chimes */}
        <LandingHero />

        {/* 2. Before vs After: Direct Problem-Solution Transformation */}
        <BeforeAfterSection />

        {/* 3. Interactive ROI & Time Savings Estimator */}
        <RoiCalculatorSection />

        {/* 4. Specialized Disciplines: General, Dental, Polyclinic, Maternity, Pharmacy */}
        <ClinicDisciplineSection />

        {/* 5. Core Platform Features & Architecture */}
        <FeaturesSection />

        {/* 6. Authentic Physician & Clinic Owner Testimonials */}
        <DoctorTestimonialsSection />

        {/* 7. Transparent SaaS Pricing Matrix with Annual Savings */}
        <PricingMatrix />

        {/* 8. Frequently Asked Questions FAQ Addressing Hesitations */}
        <FaqSection />

        {/* 9. Final Irresistible 60-Second Conversion Call to Action */}
        <BottomCtaBanner />
      </main>

      <PublicFooter />
    </div>
  );
}
