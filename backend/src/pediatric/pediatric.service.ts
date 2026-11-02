// Pediatric & Neonatal Pharmacotherapy Service
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import {
  PediatricMedicationItem,
  PediatricPatientRecord,
  PediatricDosingCalculation,
  NeonatalAminoglycosideDosing,
  PhototherapyNomogramAssessment
} from './pediatric.types.ts';
import { PediatricMathEngine } from './pediatric-math.engine.ts';

export class PediatricService {
  private static instance: PediatricService;

  private readonly medications: Map<string, PediatricMedicationItem> = new Map();
  private readonly patients: Map<string, PediatricPatientRecord> = new Map();

  private constructor() {
    this.seedMedications();
    this.seedSamplePatients();
  }

  public static getInstance(): PediatricService {
    if (!PediatricService.instance) {
      PediatricService.instance = new PediatricService();
    }
    return PediatricService.instance;
  }

  private seedMedications(): void {
    const list: PediatricMedicationItem[] = [
      {
        code: 'PARACETAMOL',
        name: 'Paracetamol (Acetaminophen) Syrup',
        category: 'ANALGESIC_ANTIPYRETIC',
        standardDoseMgPerKg: 15,
        dosingIntervalHours: 6,
        maxDoseMgPerKgPerDay: 75,
        adultMaxSingleDoseMg: 1000,
        liquidFormulations: [
          { concentrationName: '120 mg / 5 mL (Infant/Child)', mgPerMl: 24 },
          { concentrationName: '250 mg / 5 mL (Forte)', mgPerMl: 50 }
        ]
      },
      {
        code: 'IBUPROFEN',
        name: 'Ibuprofen Oral Suspension',
        category: 'ANALGESIC_ANTIPYRETIC',
        standardDoseMgPerKg: 10,
        dosingIntervalHours: 8,
        maxDoseMgPerKgPerDay: 40,
        adultMaxSingleDoseMg: 400,
        liquidFormulations: [
          { concentrationName: '100 mg / 5 mL', mgPerMl: 20 }
        ]
      },
      {
        code: 'AMOXICILLIN',
        name: 'Amoxicillin Oral Suspension',
        category: 'ANTIBIOTIC',
        standardDoseMgPerKg: 45, // divided q12h
        dosingIntervalHours: 12,
        maxDoseMgPerKgPerDay: 90,
        adultMaxSingleDoseMg: 1000,
        liquidFormulations: [
          { concentrationName: '125 mg / 5 mL', mgPerMl: 25 },
          { concentrationName: '250 mg / 5 mL', mgPerMl: 50 }
        ]
      },
      {
        code: 'CEFTRIAXONE',
        name: 'Ceftriaxone IV/IM Injection',
        category: 'ANTIBIOTIC',
        standardDoseMgPerKg: 50,
        dosingIntervalHours: 24,
        maxDoseMgPerKgPerDay: 100,
        adultMaxSingleDoseMg: 2000,
        liquidFormulations: [
          { concentrationName: '1 g / 10 mL vial', mgPerMl: 100 }
        ]
      },
      {
        code: 'AZITHROMYCIN',
        name: 'Azithromycin Oral Suspension',
        category: 'ANTIBIOTIC',
        standardDoseMgPerKg: 10,
        dosingIntervalHours: 24,
        maxDoseMgPerKgPerDay: 10,
        adultMaxSingleDoseMg: 500,
        liquidFormulations: [
          { concentrationName: '200 mg / 5 mL', mgPerMl: 40 }
        ]
      }
    ];

    for (const med of list) {
      this.medications.set(med.code, med);
    }
  }

  private seedSamplePatients(): void {
    // Child 1: 5-year-old child (18 kg)
    this.patients.set('PED-PT-001', {
      patientId: 'PED-PT-001',
      patientName: 'Kosal Pich',
      birthDate: '2021-08-15',
      gestationalAgeWeeks: 39,
      currentAgeDays: 1890,
      weightKg: 18.0,
      heightCm: 110,
      isNeonatal: false,
      hasG6pdDeficiency: false,
      bloodGroup: 'O+'
    });

    // Neonate 2: 3-day-old newborn (3.1 kg, 38 weeks GA) with hyperbilirubinemia
    this.patients.set('NEO-PT-002', {
      patientId: 'NEO-PT-002',
      patientName: 'Baby of Sokha Meas',
      birthDate: '2026-10-31',
      gestationalAgeWeeks: 38,
      currentAgeDays: 3,
      weightKg: 3.1,
      heightCm: 49,
      isNeonatal: true,
      hasG6pdDeficiency: false,
      bloodGroup: 'A+'
    });

    // Preterm Neonate 3: 5-day-old preterm infant (1.8 kg, 32 weeks GA)
    this.patients.set('NEO-PT-003', {
      patientId: 'NEO-PT-003',
      patientName: 'Baby of Vanna Heng',
      birthDate: '2026-10-29',
      gestationalAgeWeeks: 32,
      currentAgeDays: 5,
      weightKg: 1.8,
      heightCm: 42,
      isNeonatal: true,
      hasG6pdDeficiency: true,
      bloodGroup: 'B+'
    });
  }

  public getMedications(): PediatricMedicationItem[] {
    return Array.from(this.medications.values());
  }

  public getMedicationByCode(code: string): PediatricMedicationItem | undefined {
    return this.medications.get(code);
  }

  public getPatients(): PediatricPatientRecord[] {
    return Array.from(this.patients.values());
  }

  public getPatientById(id: string): PediatricPatientRecord | undefined {
    return this.patients.get(id);
  }

  public calculatePediatricDosing(
    medicationCode: string,
    weightKg: number,
    ageYears: number,
    ageMonths: number,
    concentrationMgPerMl?: number
  ): PediatricDosingCalculation {
    const med = this.medications.get(medicationCode) || {
      code: medicationCode,
      name: medicationCode,
      category: 'ANALGESIC_ANTIPYRETIC',
      standardDoseMgPerKg: 15,
      dosingIntervalHours: 6,
      maxDoseMgPerKgPerDay: 75,
      adultMaxSingleDoseMg: 1000,
      liquidFormulations: [{ concentrationName: 'Standard', mgPerMl: 24 }]
    };

    const adultDose = med.adultMaxSingleDoseMg;
    const clarks = PediatricMathEngine.calculateClarksDose(weightKg, adultDose);
    const youngs = PediatricMathEngine.calculateYoungsDose(ageYears, adultDose);
    const frieds = PediatricMathEngine.calculateFriedsDose(ageMonths, adultDose);

    const weightBased = PediatricMathEngine.calculateWeightBasedDose(
      weightKg,
      med.standardDoseMgPerKg,
      med.adultMaxSingleDoseMg
    );

    const recommendedDoseMg = weightBased.finalCappedDoseMg;

    const conc = concentrationMgPerMl || (med.liquidFormulations[0]?.mgPerMl ?? 24);
    const liquidVolumeMl = Math.round((recommendedDoseMg / conc) * 10) / 10;

    let rationaleEn = '';
    let rationaleKm = '';

    if (weightBased.isCapped) {
      rationaleEn = `Dose capped at adult single-dose ceiling of ${med.adultMaxSingleDoseMg} mg (raw calculated: ${weightBased.rawDoseMg} mg) to prevent toxicity in high-weight child.`;
      rationaleKm = `កម្រិតថ្នាំត្រូវបានកំណត់ត្រឹមពិដានអតិបរមារបស់មនុស្សពេញវ័យ ${med.adultMaxSingleDoseMg} mg ដើម្បីការពារការពុលថ្នាំលើកុមារដែលមានទម្ងន់លើសកម្រិត`;
    } else {
      rationaleEn = `Precision dose of ${recommendedDoseMg} mg (${liquidVolumeMl} mL of ${conc} mg/mL) calculated at ${med.standardDoseMgPerKg} mg/kg for ${weightKg} kg patient.`;
      rationaleKm = `កម្រិតថ្នាំសុវត្ថិភាព ${recommendedDoseMg} mg ស្មើនឹង ${liquidVolumeMl} mL នៃកំហាប់ ${conc} mg/mL ត្រូវបានគណនាយ៉ាងត្រឹមត្រូវតាមទម្ងន់ ${weightKg} គីឡូក្រាម`;
    }

    return {
      weightKg,
      ageYears,
      ageMonths,
      adultDoseMg: adultDose,
      clarksRuleDoseMg: clarks,
      youngsRuleDoseMg: youngs,
      friedsRuleDoseMg: frieds,
      weightBasedDoseMg: weightBased.rawDoseMg,
      adultMaxSingleDoseMg: med.adultMaxSingleDoseMg,
      recommendedDoseMg,
      isCappedAtAdultMax: weightBased.isCapped,
      liquidVolumeMl,
      liquidConcentrationMgPerMl: conc,
      clinicalRationaleEn: rationaleEn,
      clinicalRationaleKm: rationaleKm
    };
  }

  public calculateNeonatalGentamicin(
    gestationalAgeWeeks: number,
    postnatalAgeDays: number,
    weightKg: number
  ): NeonatalAminoglycosideDosing {
    return PediatricMathEngine.calculateNeonatalGentamicinRegimen(gestationalAgeWeeks, postnatalAgeDays, weightKg);
  }

  public evaluateBilirubinNomogram(
    postnatalHours: number,
    totalSerumBilirubinMgDl: number,
    gestationalAgeWeeks: number,
    hasNeurotoxicityRiskFactors: boolean
  ): PhototherapyNomogramAssessment {
    return PediatricMathEngine.evaluatePhototherapyNomogram(
      postnatalHours,
      totalSerumBilirubinMgDl,
      gestationalAgeWeeks,
      hasNeurotoxicityRiskFactors
    );
  }
}
