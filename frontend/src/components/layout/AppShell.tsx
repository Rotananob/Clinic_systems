'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { I18nProvider, useTranslation } from '../../context/I18nContext';
import { ToastProvider } from '../../context/ToastContext';
import { PermissionModalProvider } from '../../context/PermissionModalContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNavDock } from './MobileNavDock';
import { OfflineSyncBanner } from '../common/OfflineSyncBanner';
import { PwaRegister } from '../common/PwaRegister';
import { PwaUpdatePrompt } from '../common/PwaUpdatePrompt';
import { CommandPalette } from '../common/CommandPalette';
import { ClinicLogo } from '../common/ClinicLogo';
import { FirstTimeClinicSetupModal } from '../onboarding/FirstTimeClinicSetupModal';
import { ShieldCheck, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { isRouteAllowed, getRoleDisplayName, isRouteAllowedForPlan, getRequiredPlanForRoute } from '../../lib/rbac';
import { trackPageView, trackUserAction } from '../../lib/tracker';
import { hardwareManager } from '../../lib/hardware/hardwareManager';

const AppShellContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const isLoginPage = pathname === '/login';

  const [hasToken, setHasToken] = React.useState<boolean>(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('clinic_access_token') : null;
    setHasToken(Boolean(token));
  }, []);

  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/landing' ||
    pathname === '/pricing' ||
    pathname === '/register' ||
    pathname === '/help' ||
    pathname === '/privacy' ||
    pathname === '/policy' ||
    pathname?.startsWith('/landing') ||
    pathname?.startsWith('/pricing') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/help') ||
    pathname?.startsWith('/privacy') ||
    pathname?.startsWith('/policy') ||
    (pathname === '/' && !user && !hasToken);

  // Initialize global hardware peripherals (POS auto-print & barcode scanner)
  useEffect(() => {
    hardwareManager.init();
  }, []);

  // Automatically track page view navigation, visitor IP, device and location
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  // Track unauthorized access attempts to restricted modules
  useEffect(() => {
    if (user && !isPublicRoute && !isRouteAllowed(user.role, pathname)) {
      trackUserAction('RESTRICTED_ACCESS_ATTEMPT', {
        attemptedPath: pathname,
        userRole: user.role,
        userEmail: user.email,
      });
    }
  }, [user, pathname, isPublicRoute]);

  // Strict browser history lock & back-button bypass defense
  useEffect(() => {
    const enforceAuthLock = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('clinic_access_token') : null;
      if (!token && !isPublicRoute && pathname !== '/') {
        if (typeof window !== 'undefined') {
          window.location.replace('/login');
        }
      }
    };

    enforceAuthLock();

    const handlePopState = () => {
      enforceAuthLock();
    };

    const handlePageShow = () => {
      enforceAuthLock();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isPublicRoute, pathname]);

  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute && pathname !== '/') {
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, user, isPublicRoute, router, pathname]);

  // If on public pages (login, landing, pricing, or public unauthenticated /), render clean layout without sidebar/navbar
  if (isPublicRoute) {
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

  // Unified SSR & Initial Hydration Guard: ensures server and client render identical loading screen
  if (!mounted && !isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F4EE] text-stone-900 p-4">
        <div className="flex flex-col items-center max-w-sm text-center space-y-4">
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

  // Authentication Loading State
  if (isLoading && !user && pathname !== '/') {
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

  // If not authenticated and not on login/public page, show transition screen while redirecting
  if (!user && pathname !== '/') {
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

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const routeRoleAllowed = user ? isRouteAllowed(user.role, pathname) : true;
  const routePlanAllowed =
    isSuperAdmin || !user?.tenant?.planTier
      ? true
      : isRouteAllowedForPlan(user.tenant.planTier, pathname, user.tenant.clinicType);

  const requiredPlanInfo = getRequiredPlanForRoute(pathname);

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
            {!routeRoleAllowed ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mb-4 shadow-xs">
                  <ShieldCheck className="w-7 h-7 text-amber-700" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 mb-1">
                  {isKm ? 'ទំព័រនេះត្រូវបានចាក់សោសម្រាប់តួនាទីរបស់អ្នក' : 'Restricted Module for Your Role'}
                </h2>
                <p className="text-xs text-stone-600 max-w-md mb-5 leading-relaxed">
                  {isKm
                    ? `គណនីរបស់អ្នកមានតួនាទីជា "${getRoleDisplayName(user ? user.role : "", true)}" ដែលមិនមានសិទ្ធិចូលមើល ឬកែប្រែទំព័រនេះឡើយ។ ប្រសិនបើអ្នកត្រូវការចូលប្រើប្រាស់ សូមទាក់ទងម្ចាស់គ្លីនិក (Super Admin)។`
                    : `Your current role "${getRoleDisplayName(user ? user.role : "", false)}" is not authorized to access this module. Please contact the Clinic Owner (Super Admin) for elevated privileges.`}
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  {isKm ? 'ត្រឡប់ទៅផ្ទាំងដើម' : 'Back to Dashboard'}
                </button>
              </div>
            ) : !routePlanAllowed ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mb-4 shadow-xs">
                  <Sparkles className="w-8 h-8 text-teal-700" />
                </div>
                <div className="inline-block px-3 py-1 bg-amber-100 border border-amber-300 rounded-full text-[11px] font-black text-amber-900 uppercase tracking-wide mb-2">
                  {isKm ? 'តម្រូវឱ្យដំឡើងគម្រោង' : 'Plan Upgrade Required'}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-2 font-sans">
                  {isKm ? `មុខងារនេះទាមទារ ${requiredPlanInfo.nameKh}` : `This Module Requires ${requiredPlanInfo.nameEn}`}
                </h2>
                <p className="text-xs text-stone-600 mb-6 leading-relaxed">
                  {isKm
                    ? `គ្លីនិករបស់លោកអ្នកបច្ចុប្បន្នស្ថិតលើគម្រោង "${user?.tenant?.planTier || 'FREE'}"។ មុខងារនេះអាចដំណើរការបានចាប់ពីគម្រោង ${requiredPlanInfo.nameKh} ($${requiredPlanInfo.priceUsd}/ខែ) ឡើងទៅ។`
                    : `Your clinic is currently on ${user?.tenant?.planTier || 'FREE'}. This feature is unlocked starting from ${requiredPlanInfo.nameEn} ($${requiredPlanInfo.priceUsd}/mo) and above.`}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                  <Link
                    href={`/pricing?upgrade=${requiredPlanInfo.tier}`}
                    className="w-full sm:w-auto px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>{isKm ? `ដំឡើងទៅ ${requiredPlanInfo.nameKh}` : `Upgrade to ${requiredPlanInfo.nameEn}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold border border-stone-300 transition-colors"
                  >
                    {isKm ? 'ត្រឡប់ទៅផ្ទាំងដើម' : 'Back to Dashboard'}
                  </button>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
        <MobileNavDock />
        <PwaRegister />
        <PwaUpdatePrompt />
        <CommandPalette />
        <FirstTimeClinicSetupModal
          isOpen={Boolean(
            mounted &&
            user &&
            !isPublicRoute &&
            (user.role === 'ADMIN' || user.role === 'DOCTOR') &&
            user.tenant &&
            (!user.tenant.clinicNameKh || user.tenant.clinicNameEn === 'New Clinic' || (!user.tenant.paywayPaymentUrl && !user.tenant.bakongAccountId))
          )}
          onComplete={() => {}}
        />
      </div>
    </div>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <I18nProvider>
        <ToastProvider>
          <PermissionModalProvider>
            <AppShellContent>{children}</AppShellContent>
          </PermissionModalProvider>
        </ToastProvider>
      </I18nProvider>
    </AuthProvider>
  );
};
