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

      {/* Structured SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MedicalBusiness',
            name: 'KruPet Clinical Enterprise System',
            description:
              'Cambodia premier bilingual cloud clinical management platform with Bakong KHQR, ABA PayWay, PACS, Pharmacy and MOH regulatory reporting.',
            url: 'https://krupet.app',
            currenciesAccepted: 'USD, KHR',
            paymentAccepted: 'Bakong KHQR, ABA PayWay, Cash',
            areaServed: 'Cambodia',
          }),
        }}
      />

      {/* Mobile Sticky Quick-Action Bar */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl shadow-xl p-1.5 flex items-center justify-between gap-1.5">
        <Link
          href="/explore-tools"
          className="flex-1 py-2 px-1 text-center bg-stone-50 border border-stone-200 rounded-xl text-[11px] font-bold text-stone-800 active:scale-95"
        >
          {isKm ? 'ឧបករណ៍ ៣០+' : '30+ Tools'}
        </Link>
        <Link
          href="/pricing"
          className="flex-1 py-2 px-1 text-center bg-stone-50 border border-stone-200 rounded-xl text-[11px] font-bold text-stone-800 active:scale-95"
        >
          {isKm ? 'គម្រោង SaaS' : 'Pricing'}
        </Link>
        <Link
          href="/paas"
          className="flex-1 py-2 px-1 text-center bg-stone-50 border border-stone-200 rounded-xl text-[11px] font-bold text-stone-800 active:scale-95"
        >
          {isKm ? 'PaaS' : 'PaaS'}
        </Link>
        <Link
          href="/login"
          className="flex-1 py-2 px-1 text-center bg-stone-100 border border-stone-300 rounded-xl text-[11px] font-bold text-teal-900 active:scale-95"
        >
          {isKm ? 'ចូល' : 'Sign In'}
        </Link>
        <Link
          href="/register"
          className="flex-1 py-2 px-1 text-center bg-teal-800 text-white rounded-xl text-[11px] font-bold shadow-xs active:scale-95"
        >
          {isKm ? 'ចុះឈ្មោះ' : 'Register'}
        </Link>
      </div>
    </div>
  );
}
