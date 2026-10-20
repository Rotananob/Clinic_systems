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
    nameEn: 'Clinic Starter ($5/mo)',
    priceUsd: 5,
    maxMonthlyPatients: 500,
    maxDailyKhqr: 250, // 250 dynamic QR transactions / day
    maxStaffAccounts: 5,
    telegramTopicsAllowed: true,
    voiceCallAllowed: true,
    inventoryFullAllowed: true,
  },
  [PlanTier.PRO_8]: {
    tier: PlanTier.PRO_8,
    nameKh: 'គម្រោងវិជ្ជាជីវៈ',
    nameEn: 'Polyclinic Pro ($8/mo)',
    priceUsd: 8,
    maxMonthlyPatients: -1, // Unlimited
    maxDailyKhqr: 1500, // 1,500 dynamic QR transactions / day
    maxStaffAccounts: 15,
    telegramTopicsAllowed: true,
    voiceCallAllowed: true,
    inventoryFullAllowed: true,
  },
  [PlanTier.ENTERPRISE_12]: {
    tier: PlanTier.ENTERPRISE_12,
    nameKh: 'គម្រោងមន្ទីរពេទ្យធំ',
    nameEn: 'Hospital Enterprise ($12/mo)',
    priceUsd: 12,
    maxMonthlyPatients: -1, // Unlimited
    maxDailyKhqr: -1, // Unlimited dynamic QR transactions
    maxStaffAccounts: -1, // Unlimited
    telegramTopicsAllowed: true,
    voiceCallAllowed: true,
    inventoryFullAllowed: true,
  },
};
