import { NotFoundException, BadRequestException } from '@nestjs/common';

export type InsuranceProviderType =
  | 'NSSF_CAMBODIA'
  | 'FORTE_INSURANCE'
  | 'SAFETYNET'
  | 'AIA_CAMBODIA'
  | 'MANULIFE';

export type PolicyStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
export type ClaimStatus = 'DRAFT' | 'PRE_AUTHORIZED' | 'SUBMITTED' | 'SETTLED' | 'REJECTED';

export interface InsurancePolicy {
  policyNumber: string;
  patientId: string;
  patientName: string;
  patientNationalId?: string;
  provider: InsuranceProviderType;
  providerDisplayName: string;
  planName: string;
  coveragePercentage: number; // e.g. 80 for 80% covered, 100 for NSSF occupational
  coPayFixedUsd: number; // Flat fee paid by patient per visit
  annualLimitUsd: number;
  remainingLimitUsd: number;
  validFrom: string;
  validUntil: string;
  status: PolicyStatus;
  eligibleCategories: string[]; // ['CONSULTATION', 'LABORATORY', 'PHARMACY', 'IMAGING', 'PROCEDURE']
}

export interface SplitInvoiceItem {
  category: string;
  description: string;
  unitPriceUsd: number;
  quantity: number;
  totalUsd: number;
  coveredAmountUsd: number;
  patientPortionUsd: number;
}

export interface SplitInvoiceCalculation {
  policyNumber: string;
  provider: InsuranceProviderType;
  totalInvoiceUsd: number;
  insurerPayableUsd: number;
  patientPayableUsd: number;
  coPayAppliedUsd: number;
  remainingAnnualLimitUsd: number;
  items: SplitInvoiceItem[];
  preAuthRecommended: boolean;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  policyNumber: string;
  patientId: string;
  patientName: string;
  provider: InsuranceProviderType;
  visitId: string;
  diagnosisCode: string;
  diagnosisDescription: string;
  totalClaimUsd: number;
  insurerCoveredUsd: number;
  patientOutOfPocketUsd: number;
  status: ClaimStatus;
  preAuthCode?: string;
  submissionBatchId?: string;
  adjudicationNotes?: string;
  items: SplitInvoiceItem[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export class InsuranceService {
  private policies: Map<string, InsurancePolicy> = new Map();
  private claims: Map<string, InsuranceClaim> = new Map();

  constructor() {
    this.seedDefaultPolicies();
    this.seedDefaultClaims();
  }

  private seedDefaultPolicies(): void {
    const defaultPolicies: InsurancePolicy[] = [
      {
        policyNumber: 'NSSF-KH-904812',
        patientId: 'PT-1001',
        patientName: 'KEO Sokha',
        patientNationalId: '010489214',
        provider: 'NSSF_CAMBODIA',
        providerDisplayName: 'National Social Security Fund (ប.ស.ស.)',
        planName: 'Healthcare & Occupational Risk Scheme',
        coveragePercentage: 100,
        coPayFixedUsd: 0,
        annualLimitUsd: 5000,
        remainingLimitUsd: 4820,
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        status: 'ACTIVE',
        eligibleCategories: ['CONSULTATION', 'LABORATORY', 'PHARMACY', 'IMAGING', 'PROCEDURE'],
      },
      {
        policyNumber: 'FORTE-MED-77102',
        patientId: 'PT-1002',
        patientName: 'CHHAY Bopha',
        patientNationalId: '090124810',
        provider: 'FORTE_INSURANCE',
        providerDisplayName: 'Forte Insurance (Cambodia)',
        planName: 'Executive Health Care Plus',
        coveragePercentage: 80,
        coPayFixedUsd: 5,
        annualLimitUsd: 15000,
        remainingLimitUsd: 14200,
        validFrom: '2026-03-01',
        validUntil: '2027-02-28',
        status: 'ACTIVE',
        eligibleCategories: ['CONSULTATION', 'LABORATORY', 'PHARMACY', 'IMAGING'],
      },
      {
        policyNumber: 'SNET-CAM-33491',
        patientId: 'PT-1003',
        patientName: 'MENG Dara',
        patientNationalId: '020581923',
        provider: 'SAFETYNET',
        providerDisplayName: 'SafetyNet Primary Care',
        planName: 'Family Health Guard',
        coveragePercentage: 85,
        coPayFixedUsd: 3,
        annualLimitUsd: 8000,
        remainingLimitUsd: 7650,
        validFrom: '2026-01-15',
        validUntil: '2027-01-14',
        status: 'ACTIVE',
        eligibleCategories: ['CONSULTATION', 'PHARMACY', 'LABORATORY'],
      },
      {
        policyNumber: 'AIA-VIP-88401',
        patientId: 'PT-1004',
        patientName: 'HENG Piseth',
        patientNationalId: '040819201',
        provider: 'AIA_CAMBODIA',
        providerDisplayName: 'AIA Premier Medical Cover',
        planName: 'Platinum Comprehensive Inpatient & Outpatient',
        coveragePercentage: 90,
        coPayFixedUsd: 10,
        annualLimitUsd: 25000,
        remainingLimitUsd: 23800,
        validFrom: '2026-05-01',
        validUntil: '2027-04-30',
        status: 'ACTIVE',
        eligibleCategories: ['CONSULTATION', 'LABORATORY', 'PHARMACY', 'IMAGING', 'PROCEDURE'],
      },
    ];

    for (const p of defaultPolicies) {
      this.policies.set(p.policyNumber, p);
    }
  }

  private seedDefaultClaims(): void {
    const defaultClaim: InsuranceClaim = {
      id: 'clm-001',
      claimNumber: 'CLM-2026-1001',
      policyNumber: 'NSSF-KH-904812',
      patientId: 'PT-1001',
      patientName: 'KEO Sokha',
      provider: 'NSSF_CAMBODIA',
      visitId: 'vis-1001',
      diagnosisCode: 'BA00',
      diagnosisDescription: 'Essential hypertension with mild cardiomegaly',
      totalClaimUsd: 48.0,
      insurerCoveredUsd: 48.0,
      patientOutOfPocketUsd: 0.0,
      status: 'SETTLED',
      preAuthCode: 'NSSF-AUTH-8821',
      submissionBatchId: 'BATCH-2026-W42',
      adjudicationNotes: 'Fully approved under MoH Primary Care Tariff.',
      items: [
        {
          category: 'CONSULTATION',
          description: 'Physician General Medical Consultation',
          unitPriceUsd: 15.0,
          quantity: 1,
          totalUsd: 15.0,
          coveredAmountUsd: 15.0,
          patientPortionUsd: 0.0,
        },
        {
          category: 'IMAGING',
          description: 'Chest Radiography PA View',
          unitPriceUsd: 20.0,
          quantity: 1,
          totalUsd: 20.0,
          coveredAmountUsd: 20.0,
          patientPortionUsd: 0.0,
        },
        {
          category: 'PHARMACY',
          description: 'Amlodipine Besylate 5mg (30 Tablets)',
          unitPriceUsd: 13.0,
          quantity: 1,
          totalUsd: 13.0,
          coveredAmountUsd: 13.0,
          patientPortionUsd: 0.0,
        },
      ],
      tenantId: 'default-tenant',
      createdAt: '2026-10-18T10:00:00Z',
      updatedAt: '2026-10-19T14:30:00Z',
    };

    this.claims.set(defaultClaim.claimNumber, defaultClaim);
  }

  public verifyPolicy(
    policyNumber: string,
    provider?: InsuranceProviderType,
  ): {
    valid: boolean;
    policy?: InsurancePolicy;
    message: string;
  } {
    const policy = this.policies.get(policyNumber.trim().toUpperCase());
    if (!policy) {
      return {
        valid: false,
        message: `Policy number ${policyNumber} was not found in the verified insurer registry.`,
      };
    }

    if (provider && policy.provider !== provider) {
      return {
        valid: false,
        message: `Policy belongs to ${policy.providerDisplayName}, not matching selected insurer ${provider}.`,
      };
    }

    const now = new Date();
    const expiry = new Date(policy.validUntil);
    if (now > expiry || policy.status !== 'ACTIVE') {
      return {
        valid: false,
        policy,
        message: `Policy is ${policy.status.toLowerCase()} (expired on ${policy.validUntil}).`,
      };
    }

    if (policy.remainingLimitUsd <= 0) {
      return {
        valid: false,
        policy,
        message: 'Policy annual benefit limit has been completely exhausted ($0 remaining).',
      };
    }

    return {
      valid: true,
      policy,
      message: `Policy verified active. Remaining benefit limit: $${policy.remainingLimitUsd.toFixed(2)} USD.`,
    };
  }

  public calculateSplitInvoice(
    policyNumber: string,
    rawItems: Array<{
      category: string;
      description: string;
      unitPriceUsd: number;
      quantity: number;
    }>,
  ): SplitInvoiceCalculation {
    const verifyResult = this.verifyPolicy(policyNumber);
    if (!verifyResult.valid || !verifyResult.policy) {
      throw new BadRequestException(verifyResult.message);
    }

    const policy = verifyResult.policy;
    let totalInvoiceUsd = 0;
    let totalCoveredUsd = 0;
    let totalPatientUsd = 0;

    const splitItems: SplitInvoiceItem[] = [];

    for (const item of rawItems) {
      const lineTotal = Math.round(item.unitPriceUsd * item.quantity * 100) / 100;
      totalInvoiceUsd += lineTotal;

      const isEligible = policy.eligibleCategories.includes(item.category.toUpperCase());

      let coveredPortion = 0;
      let patientPortion = lineTotal;

      if (isEligible) {
        coveredPortion = Math.round(((lineTotal * policy.coveragePercentage) / 100) * 100) / 100;
        patientPortion = Math.round((lineTotal - coveredPortion) * 100) / 100;
      }

      totalCoveredUsd += coveredPortion;
      totalPatientUsd += patientPortion;

      splitItems.push({
        category: item.category.toUpperCase(),
        description: item.description,
        unitPriceUsd: item.unitPriceUsd,
        quantity: item.quantity,
        totalUsd: lineTotal,
        coveredAmountUsd: coveredPortion,
        patientPortionUsd: patientPortion,
      });
    }

    // Apply fixed co-pay if applicable
    let coPayApplied = 0;
    if (policy.coPayFixedUsd > 0 && totalCoveredUsd > policy.coPayFixedUsd) {
      coPayApplied = policy.coPayFixedUsd;
      totalCoveredUsd = Math.round((totalCoveredUsd - coPayApplied) * 100) / 100;
      totalPatientUsd = Math.round((totalPatientUsd + coPayApplied) * 100) / 100;
    }

    // Cap against remaining annual limit
    if (totalCoveredUsd > policy.remainingLimitUsd) {
      const excess = Math.round((totalCoveredUsd - policy.remainingLimitUsd) * 100) / 100;
      totalCoveredUsd = policy.remainingLimitUsd;
      totalPatientUsd = Math.round((totalPatientUsd + excess) * 100) / 100;
    }

    totalInvoiceUsd = Math.round(totalInvoiceUsd * 100) / 100;
    totalCoveredUsd = Math.round(totalCoveredUsd * 100) / 100;
    totalPatientUsd = Math.round(totalPatientUsd * 100) / 100;

    return {
      policyNumber: policy.policyNumber,
      provider: policy.provider,
      totalInvoiceUsd,
      insurerPayableUsd: totalCoveredUsd,
      patientPayableUsd: totalPatientUsd,
      coPayAppliedUsd: coPayApplied,
      remainingAnnualLimitUsd: Math.max(0, policy.remainingLimitUsd - totalCoveredUsd),
      items: splitItems,
      preAuthRecommended: totalCoveredUsd >= 200,
    };
  }

  public submitClaim(
    tenantId: string,
    input: {
      policyNumber: string;
      patientId: string;
      patientName: string;
      visitId: string;
      diagnosisCode: string;
      diagnosisDescription: string;
      items: Array<{
        category: string;
        description: string;
        unitPriceUsd: number;
        quantity: number;
      }>;
    },
  ): InsuranceClaim {
    const split = this.calculateSplitInvoice(input.policyNumber, input.items);
    const policy = this.policies.get(input.policyNumber.toUpperCase())!;

    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const claimNumber = `CLM-${year}-${randomSeq}`;
    const preAuthCode = `${policy.provider.substring(0, 4)}-AUTH-${Math.floor(10000 + Math.random() * 90000)}`;

    const newClaim: InsuranceClaim = {
      id: `clm-${Date.now()}`,
      claimNumber,
      policyNumber: policy.policyNumber,
      patientId: input.patientId,
      patientName: input.patientName,
      provider: policy.provider,
      visitId: input.visitId,
      diagnosisCode: input.diagnosisCode,
      diagnosisDescription: input.diagnosisDescription,
      totalClaimUsd: split.totalInvoiceUsd,
      insurerCoveredUsd: split.insurerPayableUsd,
      patientOutOfPocketUsd: split.patientPayableUsd,
      status: split.preAuthRecommended ? 'PRE_AUTHORIZED' : 'SUBMITTED',
      preAuthCode,
      submissionBatchId: `BATCH-${year}-W${Math.ceil(new Date().getDate() / 7)}`,
      items: split.items,
      tenantId: tenantId || 'default-tenant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Deduct remaining limit
    policy.remainingLimitUsd = Math.max(0, policy.remainingLimitUsd - split.insurerPayableUsd);
    this.policies.set(policy.policyNumber, policy);

    this.claims.set(claimNumber, newClaim);
    return newClaim;
  }

  public settleClaim(claimNumber: string, settlementRef: string, settledAmountUsd: number): InsuranceClaim {
    const claim = this.claims.get(claimNumber);
    if (!claim) {
      throw new NotFoundException(`Claim ${claimNumber} not found.`);
    }

    claim.status = 'SETTLED';
    claim.adjudicationNotes = `Settlement verified with reference ${settlementRef}. Settled $${settledAmountUsd.toFixed(2)} USD.`;
    claim.updatedAt = new Date().toISOString();

    this.claims.set(claimNumber, claim);
    return claim;
  }

  public getClaims(
    tenantId: string,
    filters?: { provider?: string; status?: string; search?: string },
  ): InsuranceClaim[] {
    let result = Array.from(this.claims.values()).filter(
      (c) => c.tenantId === tenantId || c.tenantId === 'default-tenant',
    );

    if (filters?.provider && filters.provider !== 'ALL') {
      result = result.filter((c) => c.provider === filters.provider);
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.claimNumber.toLowerCase().includes(q) ||
          c.patientName.toLowerCase().includes(q) ||
          c.patientId.toLowerCase().includes(q) ||
          c.policyNumber.toLowerCase().includes(q),
      );
    }

    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public exportNssfBatch(batchId?: string): {
    facilityCode: string;
    batchNumber: string;
    generatedAt: string;
    totalClaims: number;
    totalAmountUsd: number;
    totalAmountKhr: number;
    claims: Array<{
      claimNumber: string;
      patientNationalId?: string;
      patientName: string;
      diagnosisIcd11: string;
      reimbursementUsd: number;
      reimbursementKhr: number;
    }>;
  } {
    const nssfClaims = Array.from(this.claims.values()).filter((c) => c.provider === 'NSSF_CAMBODIA');
    const totalUsd = nssfClaims.reduce((acc, c) => acc + c.insurerCoveredUsd, 0);
    const totalKhr = Math.round(totalUsd * 4100);

    return {
      facilityCode: 'HF-PP-10492',
      batchNumber: batchId || `NSSF-EXP-${new Date().getFullYear()}-01`,
      generatedAt: new Date().toISOString(),
      totalClaims: nssfClaims.length,
      totalAmountUsd: Math.round(totalUsd * 100) / 100,
      totalAmountKhr: totalKhr,
      claims: nssfClaims.map((c) => ({
        claimNumber: c.claimNumber,
        patientNationalId: '010489214',
        patientName: c.patientName,
        diagnosisIcd11: c.diagnosisCode,
        reimbursementUsd: c.insurerCoveredUsd,
        reimbursementKhr: Math.round(c.insurerCoveredUsd * 4100),
      })),
    };
  }
}
