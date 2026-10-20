export type ToothSurface = 'mesial' | 'distal' | 'occlusal' | 'buccal' | 'lingual';

export type ToothStatus =
  | 'HEALTHY'
  | 'CARIES'
  | 'FILLED'
  | 'CROWN'
  | 'IMPLANT'
  | 'MISSING'
  | 'ROOT_CANAL'
  | 'FRACTURED'
  | 'IMPACTED';

export interface ToothSurfaceCondition {
  mesial: boolean;
  distal: boolean;
  occlusal: boolean;
  buccal: boolean;
  lingual: boolean;
}

export interface ToothState {
  toothNumber: number;
  status: ToothStatus;
  surfaces: ToothSurfaceCondition;
  mobilityScore: number; // 0 (normal), 1 (slight), 2 (moderate), 3 (severe)
  pocketDepthsMm: [number, number, number, number, number, number]; // MB, B, DB, ML, L, DL
  bleedingOnProbing: [boolean, boolean, boolean, boolean, boolean, boolean];
  notes: string;
}

export interface DentalChart {
  chartId: string;
  patientId: string;
  patientName: string;
  dentistId: string;
  dentistName: string;
  examinationDate: string;
  numberingSystem: 'FDI_TWO_DIGIT' | 'UNIVERSAL';
  teeth: Record<number, ToothState>;
  dmftIndex: {
    decayed: number;
    missing: number;
    filled: number;
    totalDmft: number;
    riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  };
  plaqueScorePct: number;
  bleedingScorePct: number;
  generalNotes: string;
  updatedAt: string;
}

export interface DentalProcedure {
  code: string;
  name: string;
  category: 'PREVENTIVE' | 'RESTORATIVE' | 'ENDODONTIC' | 'PERIODONTIC' | 'PROSTHODONTIC' | 'ORAL_SURGERY' | 'IMPLANT';
  defaultFeeUsd: number;
  defaultFeeKhr: number;
  requiresToothNumber: boolean;
}

export interface TreatmentPlanItem {
  itemId: string;
  toothNumber?: number;
  surface?: string;
  procedureCode: string;
  procedureName: string;
  category: string;
  feeUsd: number;
  feeKhr: number;
  status: 'PLANNED' | 'DONE' | 'CANCELLED';
  notes?: string;
  completedAt?: string;
}

export interface DentalTreatmentPlan {
  planId: string;
  patientId: string;
  dentistId: string;
  dentistName: string;
  title: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';
  items: TreatmentPlanItem[];
  totalFeeUsd: number;
  totalFeeKhr: number;
  createdAt: string;
  updatedAt: string;
}

export class DentalService {
  private readonly exchangeRate = 4100;

  // Standard FDI Adult 32 Teeth Numbers
  // Upper Right (18 to 11), Upper Left (21 to 28)
  // Lower Left (31 to 38), Lower Right (48 to 41)
  static readonly ADULT_TEETH_NUMBERS: number[] = [
    18, 17, 16, 15, 14, 13, 12, 11,
    21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41,
    31, 32, 33, 34, 35, 36, 37, 38
  ];

  private procedures: DentalProcedure[] = [
    {
      code: 'D-PREV-01',
      name: 'Full Mouth Ultrasonic Scaling and Polishing',
      category: 'PREVENTIVE',
      defaultFeeUsd: 25.0,
      defaultFeeKhr: 25.0 * 4100,
      requiresToothNumber: false
    },
    {
      code: 'D-REST-01',
      name: 'Composite Resin Filling (1 Surface)',
      category: 'RESTORATIVE',
      defaultFeeUsd: 20.0,
      defaultFeeKhr: 20.0 * 4100,
      requiresToothNumber: true
    },
    {
      code: 'D-REST-02',
      name: 'Composite Resin Filling (Multi-Surface MO/DO/MOD)',
      category: 'RESTORATIVE',
      defaultFeeUsd: 35.0,
      defaultFeeKhr: 35.0 * 4100,
      requiresToothNumber: true
    },
    {
      code: 'D-ENDO-01',
      name: 'Root Canal Treatment (Anterior Single Canal)',
      category: 'ENDODONTIC',
      defaultFeeUsd: 80.0,
      defaultFeeKhr: 80.0 * 4100,
      requiresToothNumber: true
    },
    {
      code: 'D-ENDO-02',
      name: 'Root Canal Treatment (Molar Multi-Canal)',
      category: 'ENDODONTIC',
      defaultFeeUsd: 150.0,
      defaultFeeKhr: 150.0 * 4100,
      requiresToothNumber: true
    },
    {
      code: 'D-PROS-01',
      name: 'Porcelain-Fused-to-Metal (PFM) Crown',
      category: 'PROSTHODONTIC',
      defaultFeeUsd: 120.0,
      defaultFeeKhr: 120.0 * 4100,
      requiresToothNumber: true
    },
    {
      code: 'D-PROS-02',
      name: 'All-Ceramic Zirconia Premium Crown',
      category: 'PROSTHODONTIC',
      defaultFeeUsd: 220.0,
      defaultFeeKhr: 220.0 * 4100,
      requiresToothNumber: true
    },
    {
      code: 'D-SURG-01',
      name: 'Routine Tooth Extraction',
      category: 'ORAL_SURGERY',
      defaultFeeUsd: 25.0,
      defaultFeeKhr: 25.0 * 4100,
      requiresToothNumber: true
    },
    {
      code: 'D-SURG-02',
      name: 'Surgical Odontectomy for Impacted Wisdom Tooth',
      category: 'ORAL_SURGERY',
      defaultFeeUsd: 120.0,
      defaultFeeKhr: 120.0 * 4100,
      requiresToothNumber: true
    },
    {
      code: 'D-IMPL-01',
      name: 'Titanium Dental Implant Fixture and Healing Abutment',
      category: 'IMPLANT',
      defaultFeeUsd: 650.0,
      defaultFeeKhr: 650.0 * 4100,
      requiresToothNumber: true
    }
  ];

  private charts: Map<string, DentalChart> = new Map();
  private treatmentPlans: DentalTreatmentPlan[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed default dental chart for PT-1001 (Keo Samnang)
    const initialTeeth: Record<number, ToothState> = {};
    for (const tn of DentalService.ADULT_TEETH_NUMBERS) {
      initialTeeth[tn] = {
        toothNumber: tn,
        status: 'HEALTHY',
        surfaces: { mesial: false, distal: false, occlusal: false, buccal: false, lingual: false },
        mobilityScore: 0,
        pocketDepthsMm: [2, 2, 2, 2, 2, 2],
        bleedingOnProbing: [false, false, false, false, false, false],
        notes: ''
      };
    }

    // Caries on Tooth 16 (Upper Right First Molar) occlusal
    initialTeeth[16].status = 'CARIES';
    initialTeeth[16].surfaces.occlusal = true;
    initialTeeth[16].notes = 'Deep pit occlusal caries sensitive to cold';

    // Filled on Tooth 26 (Upper Left First Molar) MOD
    initialTeeth[26].status = 'FILLED';
    initialTeeth[26].surfaces.mesial = true;
    initialTeeth[26].surfaces.occlusal = true;
    initialTeeth[26].surfaces.distal = true;
    initialTeeth[26].notes = 'Composite restoration placed 2 years ago';

    // Missing Tooth 36 (Lower Left First Molar)
    initialTeeth[36].status = 'MISSING';
    initialTeeth[36].notes = 'Extracted in 2024 due to apical periodontitis';

    // Crown on Tooth 11 (Upper Right Central Incisor)
    initialTeeth[11].status = 'CROWN';
    initialTeeth[11].notes = 'Porcelain crown with good margin';

    // Caries on Tooth 47 (Lower Right Second Molar)
    initialTeeth[47].status = 'CARIES';
    initialTeeth[47].surfaces.occlusal = true;
    initialTeeth[47].surfaces.buccal = true;

    const dmft = this.calculateDmft(initialTeeth);

    const initialChart: DentalChart = {
      chartId: 'CHT-PT1001-01',
      patientId: 'PT-1001',
      patientName: 'Keo Samnang',
      dentistId: 'DOC-101',
      dentistName: 'Dr. Seng Chanthou',
      examinationDate: '2026-10-18',
      numberingSystem: 'FDI_TWO_DIGIT',
      teeth: initialTeeth,
      dmftIndex: dmft,
      plaqueScorePct: 18.5,
      bleedingScorePct: 12.0,
      generalNotes: 'Mild generalized gingivitis, localized deep caries on 16 and 47',
      updatedAt: '2026-10-18T10:30:00Z'
    };

    this.charts.set('PT-1001', initialChart);

    // Initial Treatment Plan for PT-1001
    this.treatmentPlans.push({
      planId: 'DTP-PT1001-202610',
      patientId: 'PT-1001',
      dentistId: 'DOC-101',
      dentistName: 'Dr. Seng Chanthou',
      title: 'Comprehensive Periodontal and Restorative Treatment Plan',
      status: 'IN_PROGRESS',
      items: [
        {
          itemId: 'DTI-001',
          procedureCode: 'D-PREV-01',
          procedureName: 'Full Mouth Ultrasonic Scaling and Polishing',
          category: 'PREVENTIVE',
          feeUsd: 25.0,
          feeKhr: 25.0 * 4100,
          status: 'DONE',
          completedAt: '2026-10-18T11:00:00Z'
        },
        {
          itemId: 'DTI-002',
          toothNumber: 16,
          surface: 'Occlusal',
          procedureCode: 'D-REST-01',
          procedureName: 'Composite Resin Filling (1 Surface)',
          category: 'RESTORATIVE',
          feeUsd: 20.0,
          feeKhr: 20.0 * 4100,
          status: 'PLANNED'
        },
        {
          itemId: 'DTI-003',
          toothNumber: 47,
          surface: 'Occlusal-Buccal',
          procedureCode: 'D-REST-02',
          procedureName: 'Composite Resin Filling (Multi-Surface MO/DO/MOD)',
          category: 'RESTORATIVE',
          feeUsd: 35.0,
          feeKhr: 35.0 * 4100,
          status: 'PLANNED'
        },
        {
          itemId: 'DTI-004',
          toothNumber: 36,
          procedureCode: 'D-IMPL-01',
          procedureName: 'Titanium Dental Implant Fixture and Healing Abutment',
          category: 'IMPLANT',
          feeUsd: 650.0,
          feeKhr: 650.0 * 4100,
          status: 'PLANNED'
        }
      ],
      totalFeeUsd: 730.0,
      totalFeeKhr: 730.0 * 4100,
      createdAt: '2026-10-18T11:15:00Z',
      updatedAt: '2026-10-18T11:15:00Z'
    });
  }

  calculateDmft(teeth: Record<number, ToothState>) {
    let decayed = 0;
    let missing = 0;
    let filled = 0;

    for (const tooth of Object.values(teeth)) {
      if (tooth.status === 'CARIES') {
        decayed += 1;
      } else if (tooth.status === 'MISSING') {
        missing += 1;
      } else if (tooth.status === 'FILLED' || tooth.status === 'CROWN') {
        filled += 1;
      }
    }

    const totalDmft = decayed + missing + filled;

    let riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
    if (totalDmft <= 2) riskCategory = 'LOW';
    else if (totalDmft <= 4) riskCategory = 'MODERATE';
    else if (totalDmft <= 8) riskCategory = 'HIGH';
    else riskCategory = 'VERY_HIGH';

    return {
      decayed,
      missing,
      filled,
      totalDmft,
      riskCategory
    };
  }

  getProceduresList(): DentalProcedure[] {
    return [...this.procedures];
  }

  getDentalChart(patientId: string): DentalChart {
    let chart = this.charts.get(patientId);
    if (!chart) {
      // Create empty default adult chart
      const teeth: Record<number, ToothState> = {};
      for (const tn of DentalService.ADULT_TEETH_NUMBERS) {
        teeth[tn] = {
          toothNumber: tn,
          status: 'HEALTHY',
          surfaces: { mesial: false, distal: false, occlusal: false, buccal: false, lingual: false },
          mobilityScore: 0,
          pocketDepthsMm: [2, 2, 2, 2, 2, 2],
          bleedingOnProbing: [false, false, false, false, false, false],
          notes: ''
        };
      }
      chart = {
        chartId: `CHT-${patientId.replace(/[^a-zA-Z0-9]/g, '')}-01`,
        patientId,
        patientName: 'Patient ' + patientId,
        dentistId: 'DOC-101',
        dentistName: 'Attending Dental Surgeon',
        examinationDate: new Date().toISOString().slice(0, 10),
        numberingSystem: 'FDI_TWO_DIGIT',
        teeth,
        dmftIndex: this.calculateDmft(teeth),
        plaqueScorePct: 15.0,
        bleedingScorePct: 10.0,
        generalNotes: 'Standard initial oral examination',
        updatedAt: new Date().toISOString()
      };
      this.charts.set(patientId, chart);
    }
    return chart;
  }

  saveDentalChart(patientId: string, updates: Partial<DentalChart>): DentalChart {
    const existing = this.getDentalChart(patientId);
    const updatedTeeth = updates.teeth || existing.teeth;
    const dmft = this.calculateDmft(updatedTeeth);

    const updatedChart: DentalChart = {
      ...existing,
      ...updates,
      teeth: updatedTeeth,
      dmftIndex: dmft,
      updatedAt: new Date().toISOString()
    };

    this.charts.set(patientId, updatedChart);
    return updatedChart;
  }

  updateToothCondition(patientId: string, toothNumber: number, data: Partial<ToothState>): DentalChart {
    const chart = this.getDentalChart(patientId);
    if (!chart.teeth[toothNumber]) {
      throw new Error(`Invalid tooth number ${toothNumber}. Expected standard FDI two-digit identifier.`);
    }

    chart.teeth[toothNumber] = {
      ...chart.teeth[toothNumber],
      ...data,
      surfaces: {
        ...chart.teeth[toothNumber].surfaces,
        ...(data.surfaces || {})
      }
    };

    chart.dmftIndex = this.calculateDmft(chart.teeth);
    chart.updatedAt = new Date().toISOString();

    this.charts.set(patientId, chart);
    return chart;
  }

  getTreatmentPlans(patientId: string): DentalTreatmentPlan[] {
    return this.treatmentPlans.filter(p => p.patientId === patientId);
  }

  createTreatmentPlan(patientId: string, data: {
    dentistId?: string;
    dentistName?: string;
    title: string;
    items: Array<{
      toothNumber?: number;
      surface?: string;
      procedureCode: string;
      notes?: string;
    }>;
  }): DentalTreatmentPlan {
    const planId = `DTP-${patientId.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-6)}`;
    const items: TreatmentPlanItem[] = [];
    let totalFeeUsd = 0;

    for (let i = 0; i < data.items.length; i++) {
      const it = data.items[i];
      const proc = this.procedures.find(p => p.code === it.procedureCode);
      const feeUsd = proc ? proc.defaultFeeUsd : 30.0;
      const feeKhr = Math.round(feeUsd * this.exchangeRate);
      totalFeeUsd += feeUsd;

      items.push({
        itemId: `DTI-${(i + 1).toString().padStart(3, '0')}`,
        toothNumber: it.toothNumber,
        surface: it.surface,
        procedureCode: it.procedureCode,
        procedureName: proc ? proc.name : 'Dental Procedure ' + it.procedureCode,
        category: proc ? proc.category : 'RESTORATIVE',
        feeUsd,
        feeKhr,
        status: 'PLANNED',
        notes: it.notes
      });
    }

    const totalFeeKhr = Math.round(totalFeeUsd * this.exchangeRate);

    const plan: DentalTreatmentPlan = {
      planId,
      patientId,
      dentistId: data.dentistId || 'DOC-101',
      dentistName: data.dentistName || 'Dr. Seng Chanthou',
      title: data.title || 'Comprehensive Dental Treatment Plan',
      status: 'PROPOSED',
      items,
      totalFeeUsd: Math.round(totalFeeUsd * 100) / 100,
      totalFeeKhr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.treatmentPlans.push(plan);
    return plan;
  }

  updateTreatmentItemStatus(planId: string, itemId: string, status: 'DONE' | 'CANCELLED'): DentalTreatmentPlan {
    const plan = this.treatmentPlans.find(p => p.planId === planId);
    if (!plan) {
      throw new Error(`Dental treatment plan not found: ${planId}`);
    }

    const item = plan.items.find(i => i.itemId === itemId);
    if (!item) {
      throw new Error(`Treatment item not found: ${itemId}`);
    }

    item.status = status;
    if (status === 'DONE') {
      item.completedAt = new Date().toISOString();
    }

    // Auto update plan status if all items are done
    const allDone = plan.items.every(i => i.status === 'DONE' || i.status === 'CANCELLED');
    if (allDone) {
      plan.status = 'COMPLETED';
    } else {
      plan.status = 'IN_PROGRESS';
    }

    plan.updatedAt = new Date().toISOString();
    return plan;
  }
}
