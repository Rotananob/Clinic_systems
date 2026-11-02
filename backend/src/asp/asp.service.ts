// Antimicrobial Stewardship Program (ASP) Service
// Manages clinical formulary restrictions, surveillance metrics, antibiograms, and approval workflows.
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import {
  AntimicrobialAgent,
  PatientAntimicrobialCourse,
  DotLotSummary,
  SaarMetric,
  ProcalcitoninKinetics,
  IvToOralCandidate,
  BugDrugMismatchAlert,
  AntibiogramOrganismRecord,
  RestrictedApprovalRequest
} from './asp.types.ts';
import { AspMathEngine } from './asp-math.engine.ts';

export class AspService {
  private static instance: AspService;

  // Master antimicrobial catalog
  private readonly agents: Map<string, AntimicrobialAgent> = new Map();
  // Cumulative local antibiogram database
  private readonly antibiogram: Map<string, AntibiogramOrganismRecord> = new Map();
  // Restricted antimicrobial approval requests
  private readonly approvalRequests: Map<string, RestrictedApprovalRequest> = new Map();
  // Patient antimicrobial active regimens and courses
  private readonly patientCourses: Map<string, PatientAntimicrobialCourse> = new Map();

  private constructor() {
    this.seedMasterAgents();
    this.seedAntibiogram();
    this.seedSamplePatients();
  }

  public static getInstance(): AspService {
    if (!AspService.instance) {
      AspService.instance = new AspService();
    }
    return AspService.instance;
  }

  private seedMasterAgents(): void {
    const defaultAgents: AntimicrobialAgent[] = [
      {
        code: 'MEROPENEM',
        name: 'Meropenem IV',
        class: 'Carbapenem',
        isRestricted: true,
        requiresSpecialistApproval: true,
        spectrum: 'BROAD',
        oralBioavailabilityPercent: 0
      },
      {
        code: 'COLISTIN',
        name: 'Colistin IV',
        class: 'Polymyxin',
        isRestricted: true,
        requiresSpecialistApproval: true,
        spectrum: 'BROAD',
        oralBioavailabilityPercent: 0
      },
      {
        code: 'LINEZOLID',
        name: 'Linezolid IV/PO',
        class: 'Oxazolidinone',
        isRestricted: true,
        requiresSpecialistApproval: true,
        spectrum: 'NARROW',
        oralBioavailabilityPercent: 100,
        oralEquivalent: {
          drugName: 'Linezolid Tablets',
          standardOralDose: '600 mg PO q12h',
          bioavailabilityBioequivalent: true
        }
      },
      {
        code: 'VANCOMYCIN',
        name: 'Vancomycin IV',
        class: 'Glycopeptide',
        isRestricted: false,
        requiresSpecialistApproval: false,
        spectrum: 'NARROW',
        oralBioavailabilityPercent: 0
      },
      {
        code: 'CIPROFLOXACIN_IV',
        name: 'Ciprofloxacin IV',
        class: 'Fluoroquinolone',
        isRestricted: false,
        requiresSpecialistApproval: false,
        spectrum: 'EXTENDED',
        oralBioavailabilityPercent: 80,
        oralEquivalent: {
          drugName: 'Ciprofloxacin Tablets',
          standardOralDose: '750 mg PO q12h',
          bioavailabilityBioequivalent: true
        }
      },
      {
        code: 'LEVOFLOXACIN_IV',
        name: 'Levofloxacin IV',
        class: 'Fluoroquinolone',
        isRestricted: false,
        requiresSpecialistApproval: false,
        spectrum: 'BROAD',
        oralBioavailabilityPercent: 99,
        oralEquivalent: {
          drugName: 'Levofloxacin Tablets',
          standardOralDose: '750 mg PO q24h',
          bioavailabilityBioequivalent: true
        }
      },
      {
        code: 'METRONIDAZOLE_IV',
        name: 'Metronidazole IV',
        class: 'Nitroimidazole',
        isRestricted: false,
        requiresSpecialistApproval: false,
        spectrum: 'NARROW',
        oralBioavailabilityPercent: 100,
        oralEquivalent: {
          drugName: 'Metronidazole Tablets',
          standardOralDose: '500 mg PO q8h',
          bioavailabilityBioequivalent: true
        }
      },
      {
        code: 'FLUCONAZOLE_IV',
        name: 'Fluconazole IV',
        class: 'Azole Antifungal',
        isRestricted: false,
        requiresSpecialistApproval: false,
        spectrum: 'NARROW',
        oralBioavailabilityPercent: 95,
        oralEquivalent: {
          drugName: 'Fluconazole Tablets',
          standardOralDose: '400 mg PO q24h',
          bioavailabilityBioequivalent: true
        }
      },
      {
        code: 'CEFTRIAXONE',
        name: 'Ceftriaxone IV',
        class: '3rd Gen Cephalosporin',
        isRestricted: false,
        requiresSpecialistApproval: false,
        spectrum: 'EXTENDED',
        oralBioavailabilityPercent: 0
      },
      {
        code: 'PIPERACILLIN_TAZOBACTAM',
        name: 'Piperacillin-Tazobactam IV',
        class: 'Antipseudomonal Penicillin + Inhibitor',
        isRestricted: false,
        requiresSpecialistApproval: false,
        spectrum: 'BROAD',
        oralBioavailabilityPercent: 0
      }
    ];

    for (const a of defaultAgents) {
      this.agents.set(a.code, a);
    }
  }

  private seedAntibiogram(): void {
    const pathogens: AntibiogramOrganismRecord[] = [
      {
        pathogenCode: 'PSEUDOMONAS_AERUGINOSA',
        pathogenName: 'Pseudomonas aeruginosa',
        gramCategory: 'GRAM_NEGATIVE',
        isolateCount: 142,
        susceptibilities: {
          MEROPENEM: { testedCount: 142, susceptibleCount: 122, susceptibilityPercent: 85.9, resistancePattern: 'SUSCEPTIBLE' },
          PIPERACILLIN_TAZOBACTAM: { testedCount: 142, susceptibleCount: 118, susceptibilityPercent: 83.1, resistancePattern: 'SUSCEPTIBLE' },
          CIPROFLOXACIN: { testedCount: 142, susceptibleCount: 98, susceptibilityPercent: 69.0, resistancePattern: 'INTERMEDIATE' },
          AMIKACIN: { testedCount: 142, susceptibleCount: 131, susceptibilityPercent: 92.3, resistancePattern: 'SUSCEPTIBLE' },
          CEFTRIAXONE: { testedCount: 142, susceptibleCount: 0, susceptibilityPercent: 0.0, resistancePattern: 'INTRINSICALLY_RESISTANT' }
        }
      },
      {
        pathogenCode: 'ESCHERICHIA_COLI',
        pathogenName: 'Escherichia coli ESBL Positive',
        gramCategory: 'GRAM_NEGATIVE',
        isolateCount: 285,
        susceptibilities: {
          MEROPENEM: { testedCount: 285, susceptibleCount: 281, susceptibilityPercent: 98.6, resistancePattern: 'SUSCEPTIBLE' },
          AMIKACIN: { testedCount: 285, susceptibleCount: 270, susceptibilityPercent: 94.7, resistancePattern: 'SUSCEPTIBLE' },
          CEFTRIAXONE: { testedCount: 285, susceptibleCount: 12, susceptibilityPercent: 4.2, resistancePattern: 'RESISTANT' },
          CIPROFLOXACIN: { testedCount: 285, susceptibleCount: 114, susceptibilityPercent: 40.0, resistancePattern: 'RESISTANT' },
          VANCOMYCIN: { testedCount: 285, susceptibleCount: 0, susceptibilityPercent: 0.0, resistancePattern: 'INTRINSICALLY_RESISTANT' }
        }
      },
      {
        pathogenCode: 'STAPHYLOCOCCUS_AUREUS_MRSA',
        pathogenName: 'Staphylococcus aureus MRSA',
        gramCategory: 'GRAM_POSITIVE',
        isolateCount: 96,
        susceptibilities: {
          VANCOMYCIN: { testedCount: 96, susceptibleCount: 96, susceptibilityPercent: 100.0, resistancePattern: 'SUSCEPTIBLE' },
          LINEZOLID: { testedCount: 96, susceptibleCount: 96, susceptibilityPercent: 100.0, resistancePattern: 'SUSCEPTIBLE' },
          OXACILLIN: { testedCount: 96, susceptibleCount: 0, susceptibilityPercent: 0.0, resistancePattern: 'RESISTANT' },
          CEFAZOLIN: { testedCount: 96, susceptibleCount: 0, susceptibilityPercent: 0.0, resistancePattern: 'RESISTANT' }
        }
      },
      {
        pathogenCode: 'KLEBSIELLA_PNEUMONIAE',
        pathogenName: 'Klebsiella pneumoniae',
        gramCategory: 'GRAM_NEGATIVE',
        isolateCount: 180,
        susceptibilities: {
          MEROPENEM: { testedCount: 180, susceptibleCount: 168, susceptibilityPercent: 93.3, resistancePattern: 'SUSCEPTIBLE' },
          CEFTRIAXONE: { testedCount: 180, susceptibleCount: 126, susceptibilityPercent: 70.0, resistancePattern: 'INTERMEDIATE' },
          AMPICILLIN: { testedCount: 180, susceptibleCount: 0, susceptibilityPercent: 0.0, resistancePattern: 'INTRINSICALLY_RESISTANT' }
        }
      }
    ];

    for (const p of pathogens) {
      this.antibiogram.set(p.pathogenCode, p);
    }
  }

  private seedSamplePatients(): void {
    // Patient 1: ICU patient on dual Meropenem + Vancomycin
    this.patientCourses.set('P-ICU-8801', {
      patientId: 'P-ICU-8801',
      patientName: 'Sokha Ly',
      admissionDate: '2026-10-25',
      unit: 'ICU',
      administrations: [
        { date: '2026-10-25', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] },
        { date: '2026-10-26', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] },
        { date: '2026-10-27', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] },
        { date: '2026-10-28', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] },
        { date: '2026-10-29', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] }
      ],
      currentAntibiotics: [
        {
          agentCode: 'MEROPENEM',
          agentName: 'Meropenem IV',
          route: 'IV',
          dose: '1000 mg',
          frequency: 'q8h',
          startDate: '2026-10-25',
          indication: 'Hospital-Acquired Pneumonia with Sepsis',
          status: 'ACTIVE'
        },
        {
          agentCode: 'VANCOMYCIN',
          agentName: 'Vancomycin IV',
          route: 'IV',
          dose: '750 mg',
          frequency: 'q12h',
          startDate: '2026-10-25',
          indication: 'Empiric MRSA coverage',
          status: 'ACTIVE'
        }
      ]
    });

    // Patient 2: Step-down candidate on Ciprofloxacin IV
    this.patientCourses.set('P-WARD-4402', {
      patientId: 'P-WARD-4402',
      patientName: 'Bopha Chea',
      admissionDate: '2026-10-27',
      unit: 'GENERAL_WARD',
      administrations: [
        { date: '2026-10-27', agentCodes: ['CIPROFLOXACIN_IV'] },
        { date: '2026-10-28', agentCodes: ['CIPROFLOXACIN_IV'] },
        { date: '2026-10-29', agentCodes: ['CIPROFLOXACIN_IV'] }
      ],
      currentAntibiotics: [
        {
          agentCode: 'CIPROFLOXACIN_IV',
          agentName: 'Ciprofloxacin IV',
          route: 'IV',
          dose: '400 mg',
          frequency: 'q12h',
          startDate: '2026-10-27',
          indication: 'Complicated Pyelonephritis',
          status: 'ACTIVE'
        }
      ]
    });

    // Sample restricted approval request
    this.approvalRequests.set('REQ-ASP-2026-001', {
      id: 'REQ-ASP-2026-001',
      patientId: 'P-ICU-8801',
      patientName: 'Sokha Ly',
      prescribingDoctor: 'Dr. Chanthy Rath',
      agentCode: 'MEROPENEM',
      agentName: 'Meropenem IV',
      requestedDose: '1000 mg IV q8h extended infusion',
      clinicalIndication: 'Septic shock secondary to Ventilator-Associated Pneumonia',
      cultureSpecimenSent: true,
      requestTimestamp: new Date().toISOString(),
      status: 'APPROVED',
      approverComments: 'Approved for 5-day empiric course pending respiratory culture sensitivity results.',
      reviewedBy: 'Dr. Kimheng Meas - ASP Lead Specialist'
    });
  }

  // Retrieval & calculations
  public getAntimicrobialAgents(): AntimicrobialAgent[] {
    return Array.from(this.agents.values());
  }

  public getAntibiogram(): AntibiogramOrganismRecord[] {
    return Array.from(this.antibiogram.values());
  }

  public getPatientCourse(patientId: string): PatientAntimicrobialCourse | undefined {
    return this.patientCourses.get(patientId);
  }

  public getAllPatientCourses(): PatientAntimicrobialCourse[] {
    return Array.from(this.patientCourses.values());
  }

  public calculateUnitMetrics(unit: 'ICU' | 'GENERAL_WARD' | 'ALL', patientDays: number): DotLotSummary {
    const allAdministrations: { date: string; agentCodes: string[] }[] = [];

    for (const course of this.patientCourses.values()) {
      if (unit === 'ALL' || course.unit === unit) {
        allAdministrations.push(...course.administrations);
      }
    }

    return AspMathEngine.calculateDotAndLot(allAdministrations, patientDays);
  }

  public calculateSaar(observedDot: number, predictedDot: number): SaarMetric {
    return AspMathEngine.calculateSaar(observedDot, predictedDot);
  }

  public evaluatePct(
    baselinePct: number,
    currentPct: number,
    afebrileHours: number,
    meanArterialPressure: number
  ): ProcalcitoninKinetics {
    return AspMathEngine.evaluateProcalcitoninKinetics(baselinePct, currentPct, afebrileHours, meanArterialPressure);
  }

  public evaluateStepDown(
    agentCode: string,
    daysOnIv: number,
    afebrileHours: number,
    meanArterialPressure: number,
    wbcCount: number,
    functionalGiTract: boolean
  ): IvToOralCandidate {
    const agent = this.agents.get(agentCode) || {
      code: agentCode,
      name: agentCode,
      class: 'Antimicrobial',
      isRestricted: false,
      requiresSpecialistApproval: false,
      spectrum: 'EXTENDED',
      oralBioavailabilityPercent: 75
    };

    return AspMathEngine.evaluateIvToOralStepDown(
      agent.code,
      agent.name,
      daysOnIv,
      afebrileHours,
      meanArterialPressure,
      wbcCount,
      functionalGiTract
    );
  }

  public checkBugDrugMismatch(pathogenCode: string, antibioticCode: string): BugDrugMismatchAlert {
    return AspMathEngine.detectBugDrugMismatches(pathogenCode, antibioticCode);
  }

  public getApprovalRequests(): RestrictedApprovalRequest[] {
    return Array.from(this.approvalRequests.values());
  }

  public submitApprovalRequest(request: Omit<RestrictedApprovalRequest, 'id' | 'status' | 'requestTimestamp'>): RestrictedApprovalRequest {
    const id = `REQ-ASP-${Date.now().toString().slice(-6)}`;
    const newRequest: RestrictedApprovalRequest = {
      ...request,
      id,
      requestTimestamp: new Date().toISOString(),
      status: 'PENDING'
    };
    this.approvalRequests.set(id, newRequest);
    return newRequest;
  }

  public reviewApprovalRequest(
    id: string,
    decision: 'APPROVED' | 'REJECTED' | 'MODIFIED',
    comments: string,
    reviewer: string
  ): RestrictedApprovalRequest {
    const existing = this.approvalRequests.get(id);
    if (!existing) {
      throw new Error(`Restricted approval request with id ${id} not found.`);
    }

    existing.status = decision;
    existing.approverComments = comments;
    existing.reviewedBy = reviewer;
    this.approvalRequests.set(id, existing);
    return existing;
  }
}
