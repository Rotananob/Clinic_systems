// Mathematical and Algorithmic Engine for Automated Antimicrobial Stewardship Program (ASP)
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import {
  DotLotSummary,
  SaarMetric,
  SaarCategory,
  ProcalcitoninKinetics,
  IvToOralCandidate,
  BugDrugMismatchAlert,
  AntimicrobialAdministrationDay
} from './asp.types.ts';

export class AspMathEngine {
  /**
   * Calculates Days of Therapy (DOT) and Length of Therapy (LOT).
   * Overlapping antimicrobials on the same calendar day accumulate individually towards DOT,
   * while calendar day with at least 1 systemic antibiotic counts exactly once towards LOT.
   */
  public static calculateDotAndLot(
    administrations: AntimicrobialAdministrationDay[],
    patientDays: number
  ): DotLotSummary {
    const validPatientDays = Math.max(1, patientDays);
    const agentDotBreakdown: Record<string, number> = {};
    const lotDates = new Set<string>();
    let totalDot = 0;

    for (const record of administrations) {
      if (!record.agentCodes || record.agentCodes.length === 0) continue;
      lotDates.add(record.date);

      for (const agent of record.agentCodes) {
        agentDotBreakdown[agent] = (agentDotBreakdown[agent] || 0) + 1;
        totalDot += 1;
      }
    }

    const totalLot = lotDates.size;
    const dotPer1000 = Math.round((totalDot / validPatientDays) * 1000 * 100) / 100;
    const lotPer1000 = Math.round((totalLot / validPatientDays) * 1000 * 100) / 100;

    return {
      patientDays: validPatientDays,
      totalDaysOfTherapy: totalDot,
      totalLengthOfTherapy: totalLot,
      dotPer1000PatientDays: dotPer1000,
      lotPer1000PatientDays: lotPer1000,
      agentDotBreakdown
    };
  }

  /**
   * Computes the Standardized Antimicrobial Administration Ratio (SAAR).
   * Formula: SAAR = Observed DOT / Predicted DOT.
   * Categorizes stewardship consumption against clinical CDC benchmarks.
   */
  public static calculateSaar(observedDot: number, predictedDot: number): SaarMetric {
    const safePredicted = Math.max(0.1, predictedDot);
    const saarRatio = Math.round((observedDot / safePredicted) * 100) / 100;

    let category: SaarCategory = 'BENCHMARK';
    let clinicalInterpretationEn = '';
    let clinicalInterpretationKm = '';

    if (saarRatio < 0.70) {
      category = 'OPTIMAL';
      clinicalInterpretationEn = 'Antimicrobial usage is well below national benchmark, reflecting targeted therapy or rapid de-escalation.';
      clinicalInterpretationKm = 'ការប្រើប្រាស់ថ្នាំអង់ទីប៊ីយ៉ូទិកទាបជាងកម្រិតគោលដៅជាតិ បង្ហាញពីការព្យាបាលចំគោលដៅ ឬការបញ្ចុះកម្រិតថ្នាំបានលឿន';
    } else if (saarRatio <= 1.00) {
      category = 'BENCHMARK';
      clinicalInterpretationEn = 'Antimicrobial usage aligns closely with predicted facility consumption parameters.';
      clinicalInterpretationKm = 'ការប្រើប្រាស់ថ្នាំអង់ទីប៊ីយ៉ូទិកស្ថិតក្នុងកម្រិតសមស្របតាមការគ្រោងទុកសម្រាប់មន្ទីរពេទ្យ';
    } else if (saarRatio <= 1.30) {
      category = 'HIGH_CONSUMPTION';
      clinicalInterpretationEn = 'Elevated antimicrobial utilization identified. Clinical audit and de-escalation review recommended.';
      clinicalInterpretationKm = 'ការប្រើប្រាស់ថ្នាំអង់ទីប៊ីយ៉ូទិកកើនឡើងខ្ពស់ គួរតែធ្វើការត្រួតពិនិត្យគ្លីនិក និងពិចារណាបញ្ចុះកម្រិតថ្នាំ';
    } else {
      category = 'CRITICAL_OVERUTILIZATION';
      clinicalInterpretationEn = 'Critical antimicrobial overutilization flagged. Mandatory infectious disease stewardship review required.';
      clinicalInterpretationKm = 'ការប្រើប្រាស់ថ្នាំអង់ទីប៊ីយ៉ូទិកខ្ពស់ហួសកម្រិតធ្ងន់ធ្ងរ តម្រូវឱ្យមានការត្រួតពិនិត្យជាកាតព្វកិច្ចពីក្រុមការងារគ្រប់គ្រងថ្នាំ';
    }

    return {
      observedDot,
      predictedDot: safePredicted,
      saarRatio,
      category,
      clinicalInterpretationEn,
      clinicalInterpretationKm
    };
  }

  /**
   * Procalcitonin (PCT) Kinetics Cessation Algorithm.
   * Calculates delta PCT relative decrease and evaluates against evidence-based sepsis criteria.
   */
  public static evaluateProcalcitoninKinetics(
    baselinePct: number,
    currentPct: number,
    afebrileHours: number,
    meanArterialPressure: number
  ): ProcalcitoninKinetics {
    let deltaPctPercent = 0;
    if (baselinePct > 0) {
      deltaPctPercent = Math.round(((baselinePct - currentPct) / baselinePct) * 100 * 10) / 10;
    }

    const isAfebrileAtLeast24h = afebrileHours >= 24;
    const isHemodynamicallyStable = meanArterialPressure >= 65;

    let recommendation: ProcalcitoninKinetics['recommendation'] = 'CONTINUE_ANTIBIOTICS';
    let rationaleEn = '';
    let rationaleKm = '';

    if (currentPct < 0.25 || deltaPctPercent >= 80) {
      if (isAfebrileAtLeast24h && isHemodynamicallyStable) {
        recommendation = 'STRONG_CESSATION_RECOMMENDED';
        rationaleEn = 'Procalcitonin declined by at least 80% or reached under 0.25 mcg/L with hemodynamic stability and no fever for 24 hours. Discontinuation of empiric antibiotics is strongly advised.';
        rationaleKm = 'កម្រិត Procalcitonin បានធ្លាក់ចុះលើសពី ៨០ ភាគរយ ឬទាបជាង ០.២៥ mcg/L រួមជាមួយសម្ពាធឈាមថេរ និងគ្មានគ្រុនក្តៅលើស ២៤ ម៉ោង ផ្ដល់អនុសាសន៍យ៉ាងម៉ឺងម៉ាត់ឱ្យបញ្ឈប់ថ្នាំអង់ទីប៊ីយ៉ូទិក';
      } else {
        recommendation = 'CONSIDER_CESSATION';
        rationaleEn = 'Biochemical resolution evident with PCT drop over 80%, but patient still requires continuous hemodynamic or temperature monitoring prior to full antibiotic cessation.';
        rationaleKm = 'កម្រិត PCT ធ្លាក់ចុះលើស ៨០ ភាគរយល្អ ប៉ុន្តែអ្នកជំងឺនៅត្រូវការតាមដានសម្ពាធឈាម និងកម្តៅបន្ថែមមុននឹងបញ្ឈប់ថ្នាំទាំងស្រុង';
      }
    } else if (currentPct >= baselinePct) {
      recommendation = 'TREATMENT_FAILURE_OR_RESISTANCE_RISK';
      rationaleEn = 'Procalcitonin levels remain persistently elevated or have risen, indicating possible uncontrolled infectious focus, resistant pathogen, or therapeutic failure.';
      rationaleKm = 'កម្រិត Procalcitonin នៅតែខ្ពស់ឬបន្តកើនឡើង បង្ហាញពីលទ្ធភាពនៃការឆ្លងរោគមិនទាន់គ្រប់គ្រងបាន មេរោគស៊ាំថ្នាំ ឬការព្យាបាលមិនមានប្រសិទ្ធភាព';
    } else {
      recommendation = 'CONTINUE_ANTIBIOTICS';
      rationaleEn = 'Procalcitonin shows partial decline but has not yet met the 80% resolution threshold. Continue current antimicrobial regimen with reassessment in 24 to 48 hours.';
      rationaleKm = 'កម្រិត Procalcitonin ធ្លាក់ចុះបានខ្លះតែមិនទាន់ដល់កម្រិត ៨០ ភាគរយឡើយ គួរតែបន្តថ្នាំបច្ចុប្បន្ន និងវាយតម្លៃឡើងវិញក្នុងរយៈពេល ២៤ ទៅ ៤៨ ម៉ោង';
    }

    return {
      baselinePct,
      currentPct,
      deltaPctPercent,
      afebrileHours,
      meanArterialPressure,
      recommendation,
      rationaleEn,
      rationaleKm
    };
  }

  /**
   * Evaluates criteria for IV-to-Oral (PO) Step-down switch.
   * Checks patient stability, GI tract function, duration on IV, and oral bioavailability equivalent.
   */
  public static evaluateIvToOralStepDown(
    agentCode: string,
    agentName: string,
    daysOnIv: number,
    afebrileHours: number,
    meanArterialPressure: number,
    wbcCount: number,
    functionalGiTract: boolean
  ): IvToOralCandidate {
    // High bioavailability oral switch dictionary
    const oralEquivalents: Record<string, { drug: string; dose: string; bioavailability: number }> = {
      CIPROFLOXACIN_IV: { drug: 'Ciprofloxacin Tablets', dose: '750 mg PO q12h', bioavailability: 80 },
      LEVOFLOXACIN_IV: { drug: 'Levofloxacin Tablets', dose: '750 mg PO q24h', bioavailability: 99 },
      LINEZOLID_IV: { drug: 'Linezolid Tablets', dose: '600 mg PO q12h', bioavailability: 100 },
      METRONIDAZOLE_IV: { drug: 'Metronidazole Tablets', dose: '500 mg PO q8h', bioavailability: 100 },
      FLUCONAZOLE_IV: { drug: 'Fluconazole Tablets', dose: '400 mg PO q24h', bioavailability: 95 },
      MOXIFLOXACIN_IV: { drug: 'Moxifloxacin Tablets', dose: '400 mg PO q24h', bioavailability: 90 },
      AMOX_CLAV_IV: { drug: 'Amoxicillin-Clavulanate Tablets', dose: '875/125 mg PO q12h', bioavailability: 75 }
    };

    const equivalent = oralEquivalents[agentCode.toUpperCase()] || {
      drug: 'Oral formulation not standardized',
      dose: 'Clinical pharmacist consultation needed',
      bioavailability: 50
    };

    const criteriaMet = {
      afebrileAtLeast24h: afebrileHours >= 24,
      hemodynamicallyStable: meanArterialPressure >= 65,
      wbcImproving: wbcCount >= 4000 && wbcCount <= 12000,
      functionalGiTract: functionalGiTract === true,
      daysOnIvAtLeast48h: daysOnIv >= 2
    };

    const allCriteriaMet = Object.values(criteriaMet).every(Boolean) && equivalent.bioavailability >= 70;

    let clinicalRecommendationEn = '';
    let clinicalRecommendationKm = '';

    if (allCriteriaMet) {
      clinicalRecommendationEn = `Eligible for IV-to-Oral step-down switch to ${equivalent.drug} ${equivalent.dose}. Reduces line-associated infection risks and hospital length of stay.`;
      clinicalRecommendationKm = `មានលក្ខខណ្ឌគ្រប់គ្រាន់សម្រាប់ប្តូរពីថ្នាំចាក់ទៅថ្នាំលេប ${equivalent.drug} កម្រិត ${equivalent.dose} ដែលជួយកាត់បន្ថយហានិភ័យឆ្លងរោគតាមសរសៃឈាម និងកាត់បន្ថយថ្ងៃសម្រាកពេទ្យ`;
    } else {
      const pendingCriteria: string[] = [];
      if (!criteriaMet.daysOnIvAtLeast48h) pendingCriteria.push('IV duration under 48 hours');
      if (!criteriaMet.afebrileAtLeast24h) pendingCriteria.push('Fever within past 24 hours');
      if (!criteriaMet.hemodynamicallyStable) pendingCriteria.push('Mean arterial pressure under 65 mmHg');
      if (!criteriaMet.wbcImproving) pendingCriteria.push('WBC outside normal limits');
      if (!criteriaMet.functionalGiTract) pendingCriteria.push('Gastrointestinal tract non-functional');

      clinicalRecommendationEn = `Not currently eligible for oral step-down. Pending clinical criteria: ${pendingCriteria.join(', ')}.`;
      clinicalRecommendationKm = `មិនទាន់អាចប្តូរទៅថ្នាំលេបបាននៅឡើយទេ ដោយសារនៅខ្វះលក្ខខណ្ឌគ្លីនិកដូចជា កម្តៅ ឬសម្ពាធឈាម ឬប្រព័ន្ធរំលាយអាហារមិនទាន់ដំណើរការល្អ`;
    }

    return {
      agentCode,
      agentName,
      currentRoute: 'IV',
      recommendedOralDrug: equivalent.drug,
      recommendedOralDose: equivalent.dose,
      bioavailabilityPercent: equivalent.bioavailability,
      isCandidate: allCriteriaMet,
      criteriaMet,
      clinicalRecommendationEn,
      clinicalRecommendationKm
    };
  }

  /**
   * Detects intrinsic bug-drug resistance mismatches based on CLSI and EUCAST guidelines.
   */
  public static detectBugDrugMismatches(pathogenCode: string, antibioticCode: string): BugDrugMismatchAlert {
    const cleanPathogen = pathogenCode.toUpperCase();
    const cleanAntibiotic = antibioticCode.toUpperCase();

    // Intrinsic resistance rules database
    const intrinsicRules: Record<string, Record<string, {
      pathogenName: string;
      antibioticName: string;
      reasonEn: string;
      reasonKm: string;
      altEn: string;
      altKm: string;
    }>> = {
      PSEUDOMONAS_AERUGINOSA: {
        CEFTRIAXONE: {
          pathogenName: 'Pseudomonas aeruginosa',
          antibioticName: 'Ceftriaxone',
          reasonEn: 'Pseudomonas aeruginosa has intrinsic resistance to Ceftriaxone due to AmpC beta-lactamase and low outer membrane permeability.',
          reasonKm: 'មេរោគ Pseudomonas aeruginosa មានភាពស៊ាំពីធម្មជាតិទៅនឹងថ្នាំ Ceftriaxone ដោយសារអង់ស៊ីម AmpC beta-lactamase',
          altEn: 'Cefepime, Ceftazidime, Piperacillin-Tazobactam, or Meropenem',
          altKm: 'Cefepime, Ceftazidime, Piperacillin-Tazobactam ឬ Meropenem'
        },
        ERTAPENEM: {
          pathogenName: 'Pseudomonas aeruginosa',
          antibioticName: 'Ertapenem',
          reasonEn: 'Ertapenem lacks microbiological activity against non-fermenting Gram-negative bacilli including Pseudomonas aeruginosa.',
          reasonKm: 'ថ្នាំ Ertapenem គ្មានប្រសិទ្ធភាពសម្លាប់មេរោគលើបាក់តេរី Pseudomonas aeruginosa ឡើយ',
          altEn: 'Meropenem or Cefepime',
          altKm: 'Meropenem ឬ Cefepime'
        }
      },
      KLEBSIELLA_PNEUMONIAE: {
        AMPICILLIN: {
          pathogenName: 'Klebsiella pneumoniae',
          antibioticName: 'Ampicillin',
          reasonEn: 'Klebsiella species are intrinsically resistant to Ampicillin due to constitutive chromosomal SHV-1 beta-lactamase.',
          reasonKm: 'មេរោគ Klebsiella pneumoniae មានភាពស៊ាំពីកំណើតទៅនឹង Ampicillin ដោយសារអង់ស៊ីម SHV-1 លើក្រូម៉ូសូម',
          altEn: 'Ampicillin-Sulbactam, Ceftriaxone, or Ciprofloxacin',
          altKm: 'Ampicillin-Sulbactam, Ceftriaxone ឬ Ciprofloxacin'
        }
      },
      ENTEROCOCCUS_FAECALIS: {
        CEFTRIAXONE: {
          pathogenName: 'Enterococcus faecalis',
          antibioticName: 'Ceftriaxone',
          reasonEn: 'Enterococci are intrinsically resistant to all cephalosporins due to low binding affinity of their PBPs.',
          reasonKm: 'មេរោគ Enterococcus faecalis ស៊ាំនឹងថ្នាំអង់ទីប៊ីយ៉ូទិកក្រុម Cephalosporins ទាំងអស់',
          altEn: 'Ampicillin or Vancomycin',
          altKm: 'Ampicillin ឬ Vancomycin'
        },
        CEFAZOLIN: {
          pathogenName: 'Enterococcus faecalis',
          antibioticName: 'Cefazolin',
          reasonEn: 'Enterococci possess low-affinity penicillin-binding proteins refractory to Cefazolin.',
          reasonKm: 'មេរោគ Enterococcus faecalis មិនឆ្លើយតបនឹងថ្នាំ Cefazolin ឡើយ',
          altEn: 'Ampicillin or Vancomycin',
          altKm: 'Ampicillin ឬ Vancomycin'
        }
      },
      ESCHERICHIA_COLI: {
        VANCOMYCIN: {
          pathogenName: 'Escherichia coli',
          antibioticName: 'Vancomycin',
          reasonEn: 'Gram-negative bacilli possess an outer membrane impermeable to large glycopeptide molecules like Vancomycin.',
          reasonKm: 'មេរោគ Escherichia coli ជាប្រភេទ Gram អវិជ្ជមាន ដែលមានភ្នាសការពារមិនឱ្យថ្នាំ Vancomycin ជ្រាបចូលបាន',
          altEn: 'Ceftriaxone, Ciprofloxacin, or Meropenem',
          altKm: 'Ceftriaxone, Ciprofloxacin ឬ Meropenem'
        }
      },
      STENOTROPHOMONAS_MALTOPHILIA: {
        MEROPENEM: {
          pathogenName: 'Stenotrophomonas maltophilia',
          antibioticName: 'Meropenem',
          reasonEn: 'Stenotrophomonas maltophilia produces intrinsic L1 metallo-beta-lactamase which hydrolyzes all carbapenems.',
          reasonKm: 'មេរោគ Stenotrophomonas maltophilia បញ្ចេញអង់ស៊ីម L1 metallo-beta-lactamase ដែលបំផ្លាញថ្នាំក្រុម Carbapenem ទាំងអស់',
          altEn: 'Co-trimoxazole (Trimethoprim-Sulfamethoxazole) or Levofloxacin',
          altKm: 'Co-trimoxazole ឬ Levofloxacin'
        }
      }
    };

    const pathogenRules = intrinsicRules[cleanPathogen];
    if (pathogenRules && pathogenRules[cleanAntibiotic]) {
      const match = pathogenRules[cleanAntibiotic];
      return {
        isMismatch: true,
        pathogenCode,
        pathogenName: match.pathogenName,
        antibioticCode,
        antibioticName: match.antibioticName,
        mismatchType: 'INTRINSIC_RESISTANCE',
        warningEn: match.reasonEn,
        warningKm: match.reasonKm,
        recommendedAlternativeEn: match.altEn,
        recommendedAlternativeKm: match.altKm
      };
    }

    // Default: no intrinsic resistance flagged
    return {
      isMismatch: false,
      pathogenCode,
      pathogenName: pathogenCode.replace(/_/g, ' '),
      antibioticCode,
      antibioticName: antibioticCode.replace(/_/g, ' '),
      mismatchType: 'MATCH',
      warningEn: 'No intrinsic resistance mismatch detected.',
      warningKm: 'មិនមានភាពស៊ាំពីធម្មជាតិត្រូវបានរកឃើញទេ',
      recommendedAlternativeEn: 'Maintain current regimen based on susceptibility test results.',
      recommendedAlternativeKm: 'បន្តការព្យាបាលតាមលទ្ធផលធ្វើតេស្តមន្ទីរពិសោធន៍'
    };
  }

  /**
   * Calculates Antibiogram Susceptibility Percentage:
   * %S = (Susceptible Isolates / Total Tested Isolates) * 100
   */
  public static calculateAntibiogramSusceptibility(susceptibleCount: number, testedCount: number): number {
    if (testedCount <= 0) return 0;
    return Math.round((susceptibleCount / testedCount) * 100 * 10) / 10;
  }
}
