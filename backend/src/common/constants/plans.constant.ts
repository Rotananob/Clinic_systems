import { PlanTier } from '@prisma/client';

export interface PlanConfig {
  tier: PlanTier;
  nameKh: string;
  nameEn: string;
  priceUsd: number;
  maxMonthlyPatients: number; // -1 for unlimited
  maxDailyKhqr: number; // -1 for unlimited
  maxStaffAccounts: number; // -1 for unlimited
  telegramTopicsAllowed: boolean;
  voiceCallAllowed: boolean;
  inventoryFullAllowed: boolean;
}

export const SAAS_PLANS: Record<PlanTier, PlanConfig> = {
  [PlanTier.FREE]: {
    tier: PlanTier.FREE,
    nameKh: 'គម្រោងសាកល្បង',
    nameEn: 'Free Starter',
    priceUsd: 0,
    maxMonthlyPatients: 50,
    maxDailyKhqr: 5,
    maxStaffAccounts: 2,
    telegramTopicsAllowed: false,
    voiceCallAllowed: false,
    inventoryFullAllowed: false,
  },
  [PlanTier.STARTER_5]: {
    tier: PlanTier.STARTER_5,
    nameKh: 'គម្រោងស្ដង់ដារ',
    nameEn: 'Clinic Starter 5$/mo',
    priceUsd: 5,
    maxMonthlyPatients: 1000,
    maxDailyKhqr: 250, // 250 dynamic QR transactions / day
    maxStaffAccounts: 5,
    telegramTopicsAllowed: true,
    voiceCallAllowed: true,
    inventoryFullAllowed: true,
  },
  [PlanTier.PRO_8]: {
    tier: PlanTier.PRO_8,
    nameKh: 'គម្រោងវិជ្ជាជីវៈ',
    nameEn: 'Polyclinic Pro 8$/mo',
    priceUsd: 8,
    maxMonthlyPatients: 5000, // 5,000 patients / account
    maxDailyKhqr: 1500, // 1,500 dynamic QR transactions / day
    maxStaffAccounts: 15,
    telegramTopicsAllowed: true,
    voiceCallAllowed: true,
    inventoryFullAllowed: true,
  },
  [PlanTier.ENTERPRISE_12]: {
    tier: PlanTier.ENTERPRISE_12,
    nameKh: 'គម្រោងមន្ទីរពេទ្យធំ',
    nameEn: 'Hospital Enterprise 12$/mo',
    priceUsd: 12,
    maxMonthlyPatients: -1, // Unlimited
    maxDailyKhqr: -1, // Unlimited dynamic QR transactions
    maxStaffAccounts: -1, // Unlimited
    telegramTopicsAllowed: true,
    voiceCallAllowed: true,
    inventoryFullAllowed: true,
  },
};

export const ROUTE_MINIMUM_PLAN: Record<string, PlanTier> = {
  '/': PlanTier.FREE,
  '/patients': PlanTier.FREE,
  '/visits': PlanTier.FREE,
  '/queue': PlanTier.FREE,
  '/profile': PlanTier.FREE,

  '/prescriptions': PlanTier.STARTER_5,
  '/billing': PlanTier.STARTER_5,
  '/certificates': PlanTier.STARTER_5,
  '/follow-ups': PlanTier.STARTER_5,
  '/documents': PlanTier.STARTER_5,
  '/reports': PlanTier.STARTER_5,
  '/staff': PlanTier.STARTER_5,
  '/settings': PlanTier.STARTER_5,

  '/inventory': PlanTier.PRO_8,
  '/dental': PlanTier.PRO_8,
  '/pacs': PlanTier.PRO_8,
  '/lab': PlanTier.PRO_8,
  '/ipd': PlanTier.PRO_8,
  '/signage': PlanTier.PRO_8,
  '/concierge': PlanTier.PRO_8,
  '/finance': PlanTier.PRO_8,
  '/insurance': PlanTier.PRO_8,

  '/teleconsult': PlanTier.ENTERPRISE_12,
  '/eclaim': PlanTier.ENTERPRISE_12,
  '/invoice-template': PlanTier.ENTERPRISE_12,
};

export const PLAN_TIER_RANK: Record<PlanTier, number> = {
  [PlanTier.FREE]: 0,
  [PlanTier.STARTER_5]: 1,
  [PlanTier.PRO_8]: 2,
  [PlanTier.ENTERPRISE_12]: 3,
};

export function isRouteAllowedForPlan(
  planTier: PlanTier | string | undefined | null,
  pathname: string,
  clinicType?: string | null,
): boolean {
  const normalizedTier = (planTier as PlanTier) || PlanTier.FREE;
  const normalizedPath = pathname === '/' ? '/' : `/${pathname.split('/')[1]}`;

  // Specialty exemptions: Allow core specialty module on FREE for clinics of that specialty
  if (clinicType) {
    const upper = clinicType.toUpperCase();
    if (
      normalizedPath === '/dental' &&
      (upper.includes('DENTAL') || upper.includes('TOOTH') || upper.includes('ធ្មេញ') || upper.includes('ទន្ត'))
    ) {
      return true;
    }
    if (
      normalizedPath === '/prescriptions' &&
      (upper.includes('PHARMACY') || upper.includes('DRUG') || upper.includes('ឱសថ'))
    ) {
      return true;
    }
  }

  const requiredTier = ROUTE_MINIMUM_PLAN[normalizedPath];
  if (!requiredTier) return true;

  const currentRank = PLAN_TIER_RANK[normalizedTier] ?? 0;
  const requiredRank = PLAN_TIER_RANK[requiredTier] ?? 0;

  return currentRank >= requiredRank;
}
