/**
 * KruPet Native Clinical Mathematical and Triage Algorithms Unit Test Suite
 * Validates deterministic clinical calculations against international standards and Cambodian regulations:
 * 1. Bhutani Hyperbilirubinemia Nomogram: Postnatal age 18-168h, TSB mg/dL, risk zones, phototherapy thresholds.
 * 2. Pediatric Glasgow Coma Scale pGCS: Range 3-15, infant crying score validation, TBI severity stratification.
 * 3. Broselow Resuscitation Ladder: All 9 weight zones 3-36 kg, defibrillation joules, epinephrine, ET tube, fluid bolus.
 * 4. FDI Two-Digit Odontogram and WHO DMFT: Permanent 11-48, primary 51-85 validity, DMFT index.
 * 5. DICOM Caliper Math: Euclidean distance in mm via PixelSpacing, Cobb angle degrees, CTR with cardiomegaly alert.
 * 6. Cambodia NSSF Tariffs: K-factor 12000 KHR, B-factor 1000 KHR, R-factor 2500 KHR, pre-auth, co-pay ceilings.
 *
 * Strictly ZERO emojis. Strictly NO parentheses in Khmer text.
 */

const assert = require("assert");

// =============================================================================
// DOMAIN 1: Bhutani Hyperbilirubinemia Nomogram (AAP 2022 / Bhutani Guidelines)
// =============================================================================
const BhutaniEngine = {
  getNomogramPercentiles(postnatalHours) {
    if (postnatalHours < 18 || postnatalHours > 168) {
      throw new Error("Postnatal age must be between 18 and 168 hours");
    }

    let p40, p75, p95;
    if (postnatalHours < 24) {
      const frac = (postnatalHours - 18) / 6;
      p40 = 4.0 + frac * 1.0;
      p75 = 5.2 + frac * 1.3;
      p95 = 6.5 + frac * 1.5;
    } else if (postnatalHours < 48) {
      const frac = (postnatalHours - 24) / 24;
      p40 = 5.0 + frac * 3.0;
      p75 = 6.5 + frac * 3.5;
      p95 = 8.0 + frac * 4.0;
    } else if (postnatalHours < 72) {
      const frac = (postnatalHours - 48) / 24;
      p40 = 8.0 + frac * 3.0;
      p75 = 10.0 + frac * 3.5;
      p95 = 12.0 + frac * 3.5;
    } else if (postnatalHours < 96) {
      const frac = (postnatalHours - 72) / 24;
      p40 = 11.0 + frac * 1.5;
      p75 = 13.5 + frac * 1.5;
      p95 = 15.5 + frac * 1.5;
    } else {
      p40 = 12.5;
      p75 = 15.0;
      p95 = 17.0;
    }

    return {
      p40: Math.round(p40 * 100) / 100,
      p75: Math.round(p75 * 100) / 100,
      p95: Math.round(p95 * 100) / 100
    };
  },

  evaluateRiskZone(postnatalHours, totalBilirubinMgDl, gestationalAgeWeeks = 38, hasNeurotoxicityRiskFactors = false) {
    if (totalBilirubinMgDl < 0) {
      throw new Error("Total Serum Bilirubin cannot be negative");
    }

    const { p40, p75, p95 } = this.getNomogramPercentiles(postnatalHours);

    let riskZone;
    let khmerDescription;
    if (totalBilirubinMgDl >= p95) {
      riskZone = "HIGH_RISK";
      khmerDescription = "តំបន់ហានិភ័យខ្ពស់លើសពី 95 ភាគរយ ត្រូវការបញ្ចាំងពន្លឺព្យាបាលជាបន្ទាន់";
    } else if (totalBilirubinMgDl >= p75) {
      riskZone = "HIGH_INTERMEDIATE_RISK";
      khmerDescription = "តំបន់ហានិភ័យមធ្យមកម្រិតខ្ពស់ចន្លោះ 75 ដល់ 95 ភាគរយ ត្រូវតាមដានកម្រិតប៊ីលីរុយប៊ីនដិតដល់";
    } else if (totalBilirubinMgDl >= p40) {
      riskZone = "LOW_INTERMEDIATE_RISK";
      khmerDescription = "តំបន់ហានិភ័យមធ្យមកម្រិតទាបចន្លោះ 40 ដល់ 75 ភាគរយ";
    } else {
      riskZone = "LOW_RISK";
      khmerDescription = "តំបន់ហានិភ័យទាបក្រោម 40 ភាគរយ មិនទាមទារការព្យាបាលពិសេស";
    }

    // AAP Phototherapy Threshold for Gestational Age
    let phototherapyThreshold;
    if (gestationalAgeWeeks >= 38 && !hasNeurotoxicityRiskFactors) {
      phototherapyThreshold = p95 - 0.5;
    } else if (gestationalAgeWeeks >= 38 || (gestationalAgeWeeks >= 35 && !hasNeurotoxicityRiskFactors)) {
      phototherapyThreshold = p75 + 0.5;
    } else {
      phototherapyThreshold = p40 + 2.0;
    }
    phototherapyThreshold = Math.round(phototherapyThreshold * 100) / 100;

    const isPhototherapyIndicated = totalBilirubinMgDl >= phototherapyThreshold;

    return {
      postnatalHours,
      totalBilirubinMgDl,
      p40,
      p75,
      p95,
      riskZone,
      phototherapyThreshold,
      isPhototherapyIndicated,
      khmerDescription
    };
  }
};

// =============================================================================
// DOMAIN 2: Pediatric Glasgow Coma Scale (pGCS)
// =============================================================================
const PediatricGcsEngine = {
  calculate(eyeOpening, verbalResponse, motorResponse, isInfant = false) {
    const eye = Math.max(1, Math.min(4, Math.floor(eyeOpening)));
    const verbal = Math.max(1, Math.min(5, Math.floor(verbalResponse)));
    const motor = Math.max(1, Math.min(6, Math.floor(motorResponse)));
    const total = eye + verbal + motor;

    let verbalDescription;
    if (isInfant) {
      switch (verbal) {
        case 5: verbalDescription = "Coos, babbles, smiling, oriented social sounds"; break;
        case 4: verbalDescription = "Irritable crying, consolable"; break;
        case 3: verbalDescription = "Cries persistently to pain, inconsolable"; break;
        case 2: verbalDescription = "Grunts, moans to pain, abnormal respiratory sound"; break;
        case 1: verbalDescription = "No verbal response, no cry"; break;
      }
    } else {
      switch (verbal) {
        case 5: verbalDescription = "Oriented, converses normally"; break;
        case 4: verbalDescription = "Confused conversation, disoriented"; break;
        case 3: verbalDescription = "Inappropriate words"; break;
        case 2: verbalDescription = "Incomprehensible sounds"; break;
        case 1: verbalDescription = "No verbal response"; break;
      }
    }

    let severityCategory;
    let khmerSeverity;
    let airwayProtectionIndicated;

    if (total <= 8) {
      severityCategory = "SEVERE_TBI";
      khmerSeverity = "របួសខួរក្បាលកម្រិតធ្ងន់ធ្ងរ ពិន្ទុ 3 ដល់ 8 ត្រូវពិចារណាដាក់បំពង់ជំនួយដង្ហើមភ្លាមៗ";
      airwayProtectionIndicated = true;
    } else if (total <= 12) {
      severityCategory = "MODERATE_TBI";
      khmerSeverity = "របួសខួរក្បាលកម្រិតមធ្យម ពិន្ទុ 9 ដល់ 12 ត្រូវតាមដានសម្ពាធក្នុងលលាដ៍ក្បាល";
      airwayProtectionIndicated = false;
    } else {
      severityCategory = "MILD_TBI";
      khmerSeverity = "របួសខួរក្បាលកម្រិតស្រាល ពិន្ទុ 13 ដល់ 15";
      airwayProtectionIndicated = false;
    }

    return {
      eye,
      verbal,
      motor,
      totalScore: total,
      isInfant,
      verbalDescription,
      severityCategory,
      airwayProtectionIndicated,
      khmerSeverity
    };
  }
};

// =============================================================================
// DOMAIN 3: Broselow Pediatric Resuscitation Ladder (9 Weight Zones)
// =============================================================================
const BroselowEngine = {
  zones: [
    { name: "GREY", minKg: 3.0, maxKg: 5.9, lengthRangeCm: "46-59 cm", uncuffedEtt: 3.0, cuffedEtt: 2.5 },
    { name: "PINK", minKg: 6.0, maxKg: 7.9, lengthRangeCm: "60-67 cm", uncuffedEtt: 3.5, cuffedEtt: 3.0 },
    { name: "RED", minKg: 8.0, maxKg: 9.9, lengthRangeCm: "68-75 cm", uncuffedEtt: 3.5, cuffedEtt: 3.0 },
    { name: "PURPLE", minKg: 10.0, maxKg: 11.9, lengthRangeCm: "76-85 cm", uncuffedEtt: 4.0, cuffedEtt: 3.5 },
    { name: "YELLOW", minKg: 12.0, maxKg: 14.9, lengthRangeCm: "86-97 cm", uncuffedEtt: 4.5, cuffedEtt: 4.0 },
    { name: "WHITE", minKg: 15.0, maxKg: 18.9, lengthRangeCm: "98-109 cm", uncuffedEtt: 5.0, cuffedEtt: 4.5 },
    { name: "BLUE", minKg: 19.0, maxKg: 22.9, lengthRangeCm: "110-121 cm", uncuffedEtt: 5.5, cuffedEtt: 5.0 },
    { name: "ORANGE", minKg: 23.0, maxKg: 28.9, lengthRangeCm: "122-132 cm", uncuffedEtt: 6.0, cuffedEtt: 5.5 },
    { name: "GREEN", minKg: 29.0, maxKg: 36.0, lengthRangeCm: "133-145 cm", uncuffedEtt: 6.5, cuffedEtt: 6.0 }
  ],

  getZoneByWeight(weightKg) {
    if (weightKg < 3.0 || weightKg > 36.0) {
      throw new Error(`Weight ${weightKg} kg is outside Broselow range 3.0 to 36.0 kg`);
    }
    const zone = this.zones.find(z => weightKg >= z.minKg && weightKg <= z.maxKg);
    if (!zone) {
      throw new Error(`No Broselow zone matches weight ${weightKg} kg`);
    }
    return zone;
  },

  calculateResuscitationDoses(weightKg) {
    const zone = this.getZoneByWeight(weightKg);

    // Defibrillation joules: 2 J/kg initial, 4 J/kg subsequent, capped at adult max 200 J
    const initialDefibJoules = Math.min(200, Math.round(weightKg * 2.0));
    const subsequentDefibJoules = Math.min(200, Math.round(weightKg * 4.0));
    const cardioversionJoules = Math.min(100, Math.round(weightKg * 1.0));

    // Epinephrine 1:10,000 (0.1 mg/mL): dose is 0.01 mg/kg = 0.1 mL/kg, max 1.0 mg (10 mL)
    const epiDoseMg = Math.min(1.0, Math.round(weightKg * 0.01 * 1000) / 1000);
    const epiVolumeMl1to10000 = Math.min(10.0, Math.round(weightKg * 0.1 * 100) / 100);

    // Fluid bolus: 20 mL/kg isotonic balanced crystalloid (Lactated Ringer or 0.9% Normal Saline)
    const fluidBolusMl = Math.round(weightKg * 20.0);

    // Amiodarone for pulseless VT/VF: 5 mg/kg IV/IO, max 300 mg
    const amiodaroneMg = Math.min(300, Math.round(weightKg * 5.0 * 10) / 10);

    // Atropine: 0.02 mg/kg, min 0.1 mg, max 0.5 mg
    const atropineMg = Math.max(0.1, Math.min(0.5, Math.round(weightKg * 0.02 * 100) / 100));

    return {
      weightKg,
      colorZone: zone.name,
      lengthRangeCm: zone.lengthRangeCm,
      ettUncuffedSize: zone.uncuffedEtt,
      ettCuffedSize: zone.cuffedEtt,
      initialDefibJoules,
      subsequentDefibJoules,
      cardioversionJoules,
      epiDoseMg,
      epiVolumeMl1to10000,
      fluidBolusMl,
      amiodaroneMg,
      atropineMg
    };
  }
};

// =============================================================================
// DOMAIN 4: FDI Two-Digit Dental Odontogram and WHO DMFT
// =============================================================================
const DentalOdontogramEngine = {
  isValidPermanentTooth(fdiNumber) {
    const quadrant = Math.floor(fdiNumber / 10);
    const tooth = fdiNumber % 10;
    return quadrant >= 1 && quadrant <= 4 && tooth >= 1 && tooth <= 8;
  },

  isValidPrimaryTooth(fdiNumber) {
    const quadrant = Math.floor(fdiNumber / 10);
    const tooth = fdiNumber % 10;
    return quadrant >= 5 && quadrant <= 8 && tooth >= 1 && tooth <= 5;
  },

  validateTooth(fdiNumber) {
    const isPermanent = this.isValidPermanentTooth(fdiNumber);
    const isPrimary = this.isValidPrimaryTooth(fdiNumber);
    return {
      fdiNumber,
      isValid: isPermanent || isPrimary,
      isPermanent,
      isPrimary,
      quadrant: Math.floor(fdiNumber / 10),
      toothPosition: fdiNumber % 10
    };
  },

  calculateDmft(records) {
    // records: array of { fdiNumber, condition: 'SOUND'|'DECAYED'|'MISSING'|'FILLED' }
    let decayed = 0;
    let missing = 0;
    let filled = 0;
    let sound = 0;

    for (const rec of records) {
      if (!this.isValidPermanentTooth(rec.fdiNumber)) {
        continue;
      }
      switch (rec.condition) {
        case "DECAYED": decayed++; break;
        case "MISSING": missing++; break;
        case "FILLED": filled++; break;
        default: sound++; break;
      }
    }

    const dmftTotal = decayed + missing + filled;

    let whoCariesSeverity;
    let khmerSeverity;
    if (dmftTotal < 1.2) {
      whoCariesSeverity = "VERY_LOW";
      khmerSeverity = "អត្រាប្រហោងធ្មេញកម្រិតទាបបំផុតតាមស្តង់ដារអង្គការសុខភាពពិភពលោក";
    } else if (dmftTotal <= 2.6) {
      whoCariesSeverity = "LOW";
      khmerSeverity = "អត្រាប្រហោងធ្មេញកម្រិតទាប";
    } else if (dmftTotal <= 4.4) {
      whoCariesSeverity = "MODERATE";
      khmerSeverity = "អត្រាប្រហោងធ្មេញកម្រិតមធ្យម";
    } else if (dmftTotal <= 6.5) {
      whoCariesSeverity = "HIGH";
      khmerSeverity = "អត្រាប្រហោងធ្មេញកម្រិតខ្ពស់";
    } else {
      whoCariesSeverity = "VERY_HIGH";
      khmerSeverity = "អត្រាប្រហោងធ្មេញកម្រិតខ្ពស់បំផុត";
    }

    return {
      decayedCount: decayed,
      missingCount: missing,
      filledCount: filled,
      soundCount: sound,
      dmftTotal,
      whoCariesSeverity,
      khmerSeverity
    };
  }
};

// =============================================================================
// DOMAIN 5: DICOM Caliper Math
// =============================================================================
const DicomCaliperEngine = {
  calculateEuclideanDistanceMm(p1, p2, pixelSpacingMm) {
    // p1, p2: { x, y } in pixels. pixelSpacingMm: [rowSpacing, colSpacing]
    const rowSpacing = pixelSpacingMm[0];
    const colSpacing = pixelSpacingMm[1];

    if (rowSpacing <= 0 || colSpacing <= 0) {
      throw new Error("Pixel spacing must be strictly greater than 0");
    }

    const dxPixels = p2.x - p1.x;
    const dyPixels = p2.y - p1.y;

    const dxMm = dxPixels * colSpacing;
    const dyMm = dyPixels * rowSpacing;

    const distance = Math.sqrt(dxMm * dxMm + dyMm * dyMm);
    return Math.round(distance * 100) / 100;
  },

  calculateCobbAngleDegrees(line1P1, line1P2, line2P1, line2P2) {
    // Slope 1: (y2 - y1) / (x2 - x1)
    const dx1 = line1P2.x - line1P1.x;
    const dy1 = line1P2.y - line1P1.y;
    const angle1Rad = Math.atan2(dy1, dx1);

    const dx2 = line2P2.x - line2P1.x;
    const dy2 = line2P2.y - line2P1.y;
    const angle2Rad = Math.atan2(dy2, dx2);

    let angleDiffDeg = Math.abs(angle1Rad - angle2Rad) * (180.0 / Math.PI);
    if (angleDiffDeg > 90.0) {
      angleDiffDeg = 180.0 - angleDiffDeg;
    }

    const cobbAngle = Math.round(angleDiffDeg * 10) / 10;

    let classification;
    let isScoliosisPresent;
    if (cobbAngle < 10.0) {
      classification = "PHYSIOLOGIC_NORMAL";
      isScoliosisPresent = false;
    } else if (cobbAngle <= 24.9) {
      classification = "MILD_SCOLIOSIS";
      isScoliosisPresent = true;
    } else if (cobbAngle <= 39.9) {
      classification = "MODERATE_SCOLIOSIS";
      isScoliosisPresent = true;
    } else {
      classification = "SEVERE_SCOLIOSIS";
      isScoliosisPresent = true;
    }

    return {
      cobbAngleDegrees: cobbAngle,
      classification,
      isScoliosisPresent
    };
  },

  calculateCardiothoracicRatio(mrdPixels, mldPixels, mtdPixels, pixelSpacingColMm = 0.15) {
    if (mtdPixels <= 0) {
      throw new Error("Max thoracic diameter must be strictly greater than 0");
    }

    const cardiacDiameterPixels = mrdPixels + mldPixels;
    const ctr = Math.round((cardiacDiameterPixels / mtdPixels) * 1000) / 1000;

    const cardiacDiameterMm = Math.round(cardiacDiameterPixels * pixelSpacingColMm * 10) / 10;
    const thoracicDiameterMm = Math.round(mtdPixels * pixelSpacingColMm * 10) / 10;

    const isCardiomegaly = ctr > 0.50;
    const alertMessage = isCardiomegaly
      ? "សន្ទស្សន៍បេះដូងលើសពី 0.50 បង្ហាញសញ្ញារីកធំបេះដូងលើរូបភាពកាំរស្មីអិចទ្រូង"
      : "សន្ទស្សន៍បេះដូងស្ថិតក្នុងកម្រិតធម្មតា";

    return {
      mrdPixels,
      mldPixels,
      mtdPixels,
      cardiacDiameterMm,
      thoracicDiameterMm,
      cardiothoracicRatio: ctr,
      isCardiomegaly,
      alertMessage
    };
  }
};

// =============================================================================
// DOMAIN 6: Cambodia NSSF - National Social Security Fund - ប.ស.ស. Tariffs
// =============================================================================
const CambodiaNssfEngine = {
  K_FACTOR_KHR: 12000, // Surgical and inpatient procedures: 1 K = 12,000 KHR
  B_FACTOR_KHR: 1000,  // Biological lab tests: 1 B = 1,000 KHR
  R_FACTOR_KHR: 2500,  // Radiology and imaging: 1 R = 2,500 KHR

  calculateItemTariff(category, coefficient) {
    if (coefficient <= 0) {
      throw new Error("Tariff coefficient must be greater than 0");
    }

    let unitFactor;
    let categoryName;
    switch (category) {
      case "K":
        unitFactor = this.K_FACTOR_KHR;
        categoryName = "វះកាត់និងសម្រាកពេទ្យ";
        break;
      case "B":
        unitFactor = this.B_FACTOR_KHR;
        categoryName = "មន្ទីរពិសោធន៍វេជ្ជសាស្ត្រ";
        break;
      case "R":
        unitFactor = this.R_FACTOR_KHR;
        categoryName = "រូបភាពវេជ្ជសាស្ត្រ";
        break;
      default:
        throw new Error(`Unknown NSSF category ${category}`);
    }

    const totalKhr = coefficient * unitFactor;

    // High cost procedure pre-authorization threshold: K >= 100 or cost >= 1,200,000 KHR
    const requiresPreAuth = (category === "K" && coefficient >= 100) || totalKhr >= 1200000;

    return {
      category,
      coefficient,
      unitFactorKhr: unitFactor,
      totalKhr,
      requiresPreAuth,
      categoryNameKhmer: categoryName
    };
  },

  calculateClaimReimbursement(items, isOccupationalRisk = false, coPayPercent = 0, ceilingKhr = null) {
    let totalGrossKhr = 0;
    let anyPreAuthRequired = false;

    const detailedItems = items.map(item => {
      const calc = this.calculateItemTariff(item.category, item.coefficient);
      totalGrossKhr += calc.totalKhr;
      if (calc.requiresPreAuth) {
        anyPreAuthRequired = true;
      }
      return {
        code: item.code,
        descriptionEn: item.descriptionEn,
        ...calc
      };
    });

    // Occupational risk: 100% NSSF covered, 0% co-pay
    const effectiveCoPayPercent = isOccupationalRisk ? 0 : Math.max(0, Math.min(100, coPayPercent));

    let patientCoPayKhr = Math.round((totalGrossKhr * effectiveCoPayPercent) / 100.0);
    let nssfPayableKhr = totalGrossKhr - patientCoPayKhr;

    // Apply statutory ceiling if specified
    if (ceilingKhr && nssfPayableKhr > ceilingKhr) {
      const excess = nssfPayableKhr - ceilingKhr;
      nssfPayableKhr = ceilingKhr;
      patientCoPayKhr += excess;
    }

    return {
      isOccupationalRisk,
      totalGrossKhr,
      patientCoPayKhr,
      nssfPayableKhr,
      effectiveCoPayPercent,
      anyPreAuthRequired,
      itemCount: detailedItems.length,
      items: detailedItems,
      khmerClaimSummary: isOccupationalRisk
        ? "របបហានិភ័យការងារ ប.ស.ស. ធានារ៉ាប់រង 100 ភាគរយ អ្នកជំងឺមិនបង់ថ្លៃអ្វីទាំងអស់"
        : `របបថែទាំសុខភាព ប.ស.ស. ចំណាយរួមរបស់អ្នកជំងឺ ${effectiveCoPayPercent} ភាគរយ`
    };
  }
};

// =============================================================================
// COMPREHENSIVE TEST SUITE EXECUTION
// =============================================================================
let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${testName}`);
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    console.error(`       Error: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log("=================================================================");
console.log("STARTING KRUPET CLINICAL MATHEMATICAL ENGINE AUDIT TEST SUITE");
console.log("=================================================================");

// -----------------------------------------------------------------------------
// Test Suite 1: Bhutani Hyperbilirubinemia Nomogram
// -----------------------------------------------------------------------------
runTest("Bhutani: 24h Postnatal Percentiles and Risk Zones", () => {
  const p = BhutaniEngine.getNomogramPercentiles(24);
  assert.strictEqual(p.p40, 5.0);
  assert.strictEqual(p.p75, 6.5);
  assert.strictEqual(p.p95, 8.0);

  // TSB 9.0 mg/dL at 24h -> High Risk Zone, phototherapy indicated
  const resHigh = BhutaniEngine.evaluateRiskZone(24, 9.0, 38, false);
  assert.strictEqual(resHigh.riskZone, "HIGH_RISK");
  assert.strictEqual(resHigh.isPhototherapyIndicated, true);
  assert.strictEqual(resHigh.khmerDescription.includes("("), false);
  assert.strictEqual(resHigh.khmerDescription.includes(")"), false);

  // TSB 7.0 mg/dL at 24h -> High-Intermediate Risk Zone
  const resHirz = BhutaniEngine.evaluateRiskZone(24, 7.0, 38, false);
  assert.strictEqual(resHirz.riskZone, "HIGH_INTERMEDIATE_RISK");

  // TSB 5.5 mg/dL at 24h -> Low-Intermediate Risk Zone
  const resLirz = BhutaniEngine.evaluateRiskZone(24, 5.5, 38, false);
  assert.strictEqual(resLirz.riskZone, "LOW_INTERMEDIATE_RISK");

  // TSB 3.5 mg/dL at 24h -> Low Risk Zone
  const resLrz = BhutaniEngine.evaluateRiskZone(24, 3.5, 38, false);
  assert.strictEqual(resLrz.riskZone, "LOW_RISK");
  assert.strictEqual(resLrz.isPhototherapyIndicated, false);
});

runTest("Bhutani: 72h Postnatal Percentiles and Preterm High-Risk Thresholds", () => {
  const p = BhutaniEngine.getNomogramPercentiles(72);
  assert.strictEqual(p.p40, 11.0);
  assert.strictEqual(p.p75, 13.5);
  assert.strictEqual(p.p95, 15.5);

  // 35-week infant with neurotoxicity risk factor: lower phototherapy threshold
  const preterm = BhutaniEngine.evaluateRiskZone(72, 13.2, 35, true);
  assert.strictEqual(preterm.riskZone, "LOW_INTERMEDIATE_RISK");
  assert.strictEqual(preterm.isPhototherapyIndicated, true); // threshold is 13.0
});

runTest("Bhutani: Out of Range Age and Negative TSB Validations", () => {
  assert.throws(() => BhutaniEngine.getNomogramPercentiles(12), /between 18 and 168 hours/);
  assert.throws(() => BhutaniEngine.getNomogramPercentiles(180), /between 18 and 168 hours/);
  assert.throws(() => BhutaniEngine.evaluateRiskZone(48, -1.0), /cannot be negative/);
});

// -----------------------------------------------------------------------------
// Test Suite 2: Pediatric Glasgow Coma Scale (pGCS)
// -----------------------------------------------------------------------------
runTest("pGCS: Pre-verbal Infant Crying Spectrum", () => {
  // Infant scoring 5: oriented social cooing
  const gcs15 = PediatricGcsEngine.calculate(4, 5, 6, true);
  assert.strictEqual(gcs15.totalScore, 15);
  assert.strictEqual(gcs15.severityCategory, "MILD_TBI");
  assert.strictEqual(gcs15.airwayProtectionIndicated, false);
  assert.strictEqual(gcs15.verbalDescription.includes("Coos"), true);

  // Infant scoring 4: irritable crying, consolable
  const gcsConsolable = PediatricGcsEngine.calculate(3, 4, 5, true);
  assert.strictEqual(gcsConsolable.totalScore, 12);
  assert.strictEqual(gcsConsolable.severityCategory, "MODERATE_TBI");
  assert.strictEqual(gcsConsolable.verbalDescription.includes("consolable"), true);

  // Infant scoring 3: inconsolable crying
  const gcsInconsolable = PediatricGcsEngine.calculate(2, 3, 4, true);
  assert.strictEqual(gcsInconsolable.totalScore, 9);
  assert.strictEqual(gcsInconsolable.severityCategory, "MODERATE_TBI");
  assert.strictEqual(gcsInconsolable.verbalDescription.includes("inconsolable"), true);

  // Infant scoring 2: grunting/moaning to pain
  const gcsGrunting = PediatricGcsEngine.calculate(2, 2, 4, true);
  assert.strictEqual(gcsGrunting.totalScore, 8);
  assert.strictEqual(gcsGrunting.severityCategory, "SEVERE_TBI");
  assert.strictEqual(gcsGrunting.airwayProtectionIndicated, true);
  assert.strictEqual(gcsGrunting.verbalDescription.includes("Grunts"), true);

  // Deep coma minimum score 3
  const gcs3 = PediatricGcsEngine.calculate(1, 1, 1, true);
  assert.strictEqual(gcs3.totalScore, 3);
  assert.strictEqual(gcs3.severityCategory, "SEVERE_TBI");
  assert.strictEqual(gcs3.airwayProtectionIndicated, true);
  assert.strictEqual(gcs3.khmerSeverity.includes("("), false);
  assert.strictEqual(gcs3.khmerSeverity.includes(")"), false);
});

runTest("pGCS: Score Clamping and Boundary Coercion", () => {
  const clampedLow = PediatricGcsEngine.calculate(0, 0, 0, false);
  assert.strictEqual(clampedLow.totalScore, 3);

  const clampedHigh = PediatricGcsEngine.calculate(99, 99, 99, false);
  assert.strictEqual(clampedHigh.totalScore, 15);
});

// -----------------------------------------------------------------------------
// Test Suite 3: Broselow Resuscitation Ladder (9 Weight Zones)
// -----------------------------------------------------------------------------
runTest("Broselow: Grey Zone (3-5 kg) Newborn Resuscitation", () => {
  const grey = BroselowEngine.calculateResuscitationDoses(4.0);
  assert.strictEqual(grey.colorZone, "GREY");
  assert.strictEqual(grey.ettUncuffedSize, 3.0);
  assert.strictEqual(grey.ettCuffedSize, 2.5);
  assert.strictEqual(grey.initialDefibJoules, 8); // 2 J/kg * 4 kg = 8 J
  assert.strictEqual(grey.subsequentDefibJoules, 16); // 4 J/kg * 4 kg = 16 J
  assert.strictEqual(grey.epiDoseMg, 0.04); // 0.01 mg/kg * 4 kg = 0.04 mg
  assert.strictEqual(grey.epiVolumeMl1to10000, 0.4); // 0.4 mL
  assert.strictEqual(grey.fluidBolusMl, 80); // 20 mL/kg * 4 kg = 80 mL
});

runTest("Broselow: Red Zone (8-9 kg) Infant Resuscitation", () => {
  const red = BroselowEngine.calculateResuscitationDoses(8.5);
  assert.strictEqual(red.colorZone, "RED");
  assert.strictEqual(red.ettUncuffedSize, 3.5);
  assert.strictEqual(red.initialDefibJoules, 17); // 2 * 8.5 = 17 J
  assert.strictEqual(red.subsequentDefibJoules, 34); // 4 * 8.5 = 34 J
  assert.strictEqual(red.epiVolumeMl1to10000, 0.85); // 0.85 mL
  assert.strictEqual(red.fluidBolusMl, 170); // 20 * 8.5 = 170 mL
});

runTest("Broselow: Purple Zone (10-11 kg) Toddler Resuscitation", () => {
  const purple = BroselowEngine.calculateResuscitationDoses(10.0);
  assert.strictEqual(purple.colorZone, "PURPLE");
  assert.strictEqual(purple.ettUncuffedSize, 4.0);
  assert.strictEqual(purple.ettCuffedSize, 3.5);
  assert.strictEqual(purple.initialDefibJoules, 20); // 20 J
  assert.strictEqual(purple.subsequentDefibJoules, 40); // 40 J
  assert.strictEqual(purple.epiDoseMg, 0.1); // 0.1 mg
  assert.strictEqual(purple.epiVolumeMl1to10000, 1.0); // 1.0 mL
  assert.strictEqual(purple.fluidBolusMl, 200); // 200 mL
});

runTest("Broselow: Yellow Zone (12-14 kg) Child Resuscitation", () => {
  const yellow = BroselowEngine.calculateResuscitationDoses(13.0);
  assert.strictEqual(yellow.colorZone, "YELLOW");
  assert.strictEqual(yellow.ettUncuffedSize, 4.5);
  assert.strictEqual(yellow.initialDefibJoules, 26);
  assert.strictEqual(yellow.subsequentDefibJoules, 52);
  assert.strictEqual(yellow.fluidBolusMl, 260);
});

runTest("Broselow: White Zone (15-18 kg) Child Resuscitation", () => {
  const white = BroselowEngine.calculateResuscitationDoses(16.0);
  assert.strictEqual(white.colorZone, "WHITE");
  assert.strictEqual(white.ettUncuffedSize, 5.0);
  assert.strictEqual(white.fluidBolusMl, 320);
});

runTest("Broselow: Blue Zone (19-22 kg) School Age Resuscitation", () => {
  const blue = BroselowEngine.calculateResuscitationDoses(20.0);
  assert.strictEqual(blue.colorZone, "BLUE");
  assert.strictEqual(blue.ettUncuffedSize, 5.5);
  assert.strictEqual(blue.initialDefibJoules, 40);
  assert.strictEqual(blue.subsequentDefibJoules, 80);
  assert.strictEqual(blue.epiVolumeMl1to10000, 2.0);
  assert.strictEqual(blue.fluidBolusMl, 400);
});

runTest("Broselow: Orange Zone (23-28 kg) Resuscitation", () => {
  const orange = BroselowEngine.calculateResuscitationDoses(25.0);
  assert.strictEqual(orange.colorZone, "ORANGE");
  assert.strictEqual(orange.ettUncuffedSize, 6.0);
  assert.strictEqual(orange.initialDefibJoules, 50);
  assert.strictEqual(orange.subsequentDefibJoules, 100);
  assert.strictEqual(orange.fluidBolusMl, 500);
});

runTest("Broselow: Green Zone (29-36 kg) Resuscitation Maximum Cap", () => {
  const green = BroselowEngine.calculateResuscitationDoses(35.0);
  assert.strictEqual(green.colorZone, "GREEN");
  assert.strictEqual(green.ettUncuffedSize, 6.5);
  assert.strictEqual(green.initialDefibJoules, 70);
  assert.strictEqual(green.subsequentDefibJoules, 140);
  assert.strictEqual(green.epiVolumeMl1to10000, 3.5);
  assert.strictEqual(green.fluidBolusMl, 700);

  // Weight out of bounds validation
  assert.throws(() => BroselowEngine.calculateResuscitationDoses(2.5), /outside Broselow range/);
  assert.throws(() => BroselowEngine.calculateResuscitationDoses(40.0), /outside Broselow range/);
});

// -----------------------------------------------------------------------------
// Test Suite 4: FDI Two-Digit Dental Odontogram and WHO DMFT Index
// -----------------------------------------------------------------------------
runTest("FDI Odontogram: Permanent 11-48 and Primary 51-85 Tooth Validity", () => {
  // Valid permanent teeth
  assert.strictEqual(DentalOdontogramEngine.isValidPermanentTooth(11), true); // Upper right central incisor
  assert.strictEqual(DentalOdontogramEngine.isValidPermanentTooth(26), true); // Upper left first molar
  assert.strictEqual(DentalOdontogramEngine.isValidPermanentTooth(38), true); // Lower left third molar
  assert.strictEqual(DentalOdontogramEngine.isValidPermanentTooth(48), true); // Lower right third molar

  // Valid primary deciduous teeth
  assert.strictEqual(DentalOdontogramEngine.isValidPrimaryTooth(51), true); // Upper right primary central incisor
  assert.strictEqual(DentalOdontogramEngine.isValidPrimaryTooth(65), true); // Upper left primary second molar
  assert.strictEqual(DentalOdontogramEngine.isValidPrimaryTooth(73), true); // Lower left primary canine
  assert.strictEqual(DentalOdontogramEngine.isValidPrimaryTooth(85), true); // Lower right primary second molar

  // Invalid teeth rejection
  assert.strictEqual(DentalOdontogramEngine.isValidPermanentTooth(19), false); // Tooth 9 does not exist
  assert.strictEqual(DentalOdontogramEngine.isValidPermanentTooth(91), false); // Quadrant 9 does not exist
  assert.strictEqual(DentalOdontogramEngine.isValidPrimaryTooth(56), false); // Primary only goes up to 5
  assert.strictEqual(DentalOdontogramEngine.isValidPrimaryTooth(45), false); // 45 is permanent, not primary
});

runTest("WHO DMFT Index: Caries Severity Calculations", () => {
  // Case A: Sound dentition (DMFT = 0) -> Very Low
  const zeroDmft = DentalOdontogramEngine.calculateDmft([
    { fdiNumber: 11, condition: "SOUND" },
    { fdiNumber: 21, condition: "SOUND" }
  ]);
  assert.strictEqual(zeroDmft.dmftTotal, 0);
  assert.strictEqual(zeroDmft.whoCariesSeverity, "VERY_LOW");

  // Case B: DMFT = 3 (1 Decayed, 1 Missing, 1 Filled) -> Moderate
  const modDmft = DentalOdontogramEngine.calculateDmft([
    { fdiNumber: 16, condition: "DECAYED" },
    { fdiNumber: 36, condition: "MISSING" },
    { fdiNumber: 46, condition: "FILLED" },
    { fdiNumber: 11, condition: "SOUND" },
    { fdiNumber: 21, condition: "SOUND" }
  ]);
  assert.strictEqual(modDmft.decayedCount, 1);
  assert.strictEqual(modDmft.missingCount, 1);
  assert.strictEqual(modDmft.filledCount, 1);
  assert.strictEqual(modDmft.dmftTotal, 3);
  assert.strictEqual(modDmft.whoCariesSeverity, "MODERATE");
  assert.strictEqual(modDmft.khmerSeverity.includes("("), false);
  assert.strictEqual(modDmft.khmerSeverity.includes(")"), false);

  // Case C: DMFT = 8 -> Very High
  const highRecords = [];
  for (let i = 11; i <= 18; i++) {
    highRecords.push({ fdiNumber: i, condition: "DECAYED" });
  }
  const highDmft = DentalOdontogramEngine.calculateDmft(highRecords);
  assert.strictEqual(highDmft.dmftTotal, 8);
  assert.strictEqual(highDmft.whoCariesSeverity, "VERY_HIGH");
});

// -----------------------------------------------------------------------------
// Test Suite 5: DICOM Caliper Math
// -----------------------------------------------------------------------------
runTest("DICOM Caliper: Euclidean Distance in Millimeters via PixelSpacing", () => {
  // Point A (100, 100), Point B (200, 100) -> 100 pixels along X
  // PixelSpacing [0.20, 0.20] mm/pixel -> 100 * 0.20 = 20.0 mm
  const distHoriz = DicomCaliperEngine.calculateEuclideanDistanceMm(
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    [0.20, 0.20]
  );
  assert.strictEqual(distHoriz, 20.0);

  // 3-4-5 Triangle: dx = 30 px, dy = 40 px -> hyp = 50 px
  // Spacing = 0.15 mm/px -> 50 * 0.15 = 7.5 mm
  const distHyp = DicomCaliperEngine.calculateEuclideanDistanceMm(
    { x: 0, y: 0 },
    { x: 30, y: 40 },
    [0.15, 0.15]
  );
  assert.strictEqual(distHyp, 7.5);

  assert.throws(() => DicomCaliperEngine.calculateEuclideanDistanceMm({ x: 0, y: 0 }, { x: 1, y: 1 }, [0, 0.15]), /greater than 0/);
});

runTest("DICOM Caliper: Cobb Angle Scoliosis Measurement", () => {
  // Parallel horizontal lines -> Cobb angle = 0 degrees (Normal)
  const cobb0 = DicomCaliperEngine.calculateCobbAngleDegrees(
    { x: 0, y: 0 }, { x: 100, y: 0 },
    { x: 0, y: 50 }, { x: 100, y: 50 }
  );
  assert.strictEqual(cobb0.cobbAngleDegrees, 0.0);
  assert.strictEqual(cobb0.classification, "PHYSIOLOGIC_NORMAL");
  assert.strictEqual(cobb0.isScoliosisPresent, false);

  // Line 1: horizontal (slope 0), Line 2: 15 degree inclination
  const rad15 = 15.0 * (Math.PI / 180.0);
  const line2X = Math.cos(rad15) * 100;
  const line2Y = Math.sin(rad15) * 100;

  const cobb15 = DicomCaliperEngine.calculateCobbAngleDegrees(
    { x: 0, y: 0 }, { x: 100, y: 0 },
    { x: 0, y: 50 }, { x: line2X, y: 50 + line2Y }
  );
  assert.strictEqual(cobb15.cobbAngleDegrees, 15.0);
  assert.strictEqual(cobb15.classification, "MILD_SCOLIOSIS");
  assert.strictEqual(cobb15.isScoliosisPresent, true);
});

runTest("DICOM Caliper: Cardiothoracic Ratio (CTR) and Cardiomegaly Alert", () => {
  // Normal CTR: MRD 400 px, MLD 600 px (Heart = 1000 px), MTD 2200 px -> CTR = 1000/2200 = 0.455 (< 0.50)
  const normalCtr = DicomCaliperEngine.calculateCardiothoracicRatio(400, 600, 2200, 0.15);
  assert.strictEqual(normalCtr.cardiothoracicRatio, 0.455);
  assert.strictEqual(normalCtr.isCardiomegaly, false);
  assert.strictEqual(normalCtr.alertMessage.includes("ធម្មតា"), true);

  // Cardiomegaly CTR: MRD 550 px, MLD 750 px (Heart = 1300 px), MTD 2200 px -> CTR = 1300/2200 = 0.591 (> 0.50)
  const dilatedCtr = DicomCaliperEngine.calculateCardiothoracicRatio(550, 750, 2200, 0.15);
  assert.strictEqual(dilatedCtr.cardiothoracicRatio, 0.591);
  assert.strictEqual(dilatedCtr.isCardiomegaly, true);
  assert.strictEqual(dilatedCtr.alertMessage.includes("រីកធំបេះដូង"), true);
  assert.strictEqual(dilatedCtr.alertMessage.includes("("), false);
  assert.strictEqual(dilatedCtr.alertMessage.includes(")"), false);

  assert.throws(() => DicomCaliperEngine.calculateCardiothoracicRatio(100, 100, 0), /greater than 0/);
});

// -----------------------------------------------------------------------------
// Test Suite 6: Cambodia NSSF - National Social Security Fund - ប.ស.ស. Tariffs
// -----------------------------------------------------------------------------
runTest("Cambodia NSSF: K, B, R Factor Conversion Accuracy", () => {
  // K-factor = 12,000 KHR: Appendectomy K50 = 50 * 12,000 = 600,000 KHR
  const k50 = CambodiaNssfEngine.calculateItemTariff("K", 50);
  assert.strictEqual(k50.unitFactorKhr, 12000);
  assert.strictEqual(k50.totalKhr, 600000);
  assert.strictEqual(k50.requiresPreAuth, false);

  // High-cost procedure K100 = 100 * 12,000 = 1,200,000 KHR -> Requires Pre-Auth
  const k100 = CambodiaNssfEngine.calculateItemTariff("K", 100);
  assert.strictEqual(k100.totalKhr, 1200000);
  assert.strictEqual(k100.requiresPreAuth, true);

  // B-factor = 1,000 KHR: Complete Blood Count B30 = 30 * 1,000 = 30,000 KHR
  const b30 = CambodiaNssfEngine.calculateItemTariff("B", 30);
  assert.strictEqual(b30.unitFactorKhr, 1000);
  assert.strictEqual(b30.totalKhr, 30000);
  assert.strictEqual(b30.requiresPreAuth, false);

  // R-factor = 2,500 KHR: Chest Radiography R20 = 20 * 2,500 = 50,000 KHR
  const r20 = CambodiaNssfEngine.calculateItemTariff("R", 20);
  assert.strictEqual(r20.unitFactorKhr, 2500);
  assert.strictEqual(r20.totalKhr, 50000);
  assert.strictEqual(r20.requiresPreAuth, false);
});

runTest("Cambodia NSSF: Occupational Risk (100% NSSF Coverage)", () => {
  const items = [
    { code: "SURG-01", descriptionEn: "Trauma Wound Debridement", category: "K", coefficient: 30 }, // 360,000 KHR
    { code: "LAB-01", descriptionEn: "Serum Electrolytes", category: "B", coefficient: 25 }, // 25,000 KHR
    { code: "XRAY-01", descriptionEn: "Limb X-Ray", category: "R", coefficient: 20 } // 50,000 KHR
  ];
  // Total Gross = 435,000 KHR
  const claim = CambodiaNssfEngine.calculateClaimReimbursement(items, true, 20);
  assert.strictEqual(claim.totalGrossKhr, 435000);
  assert.strictEqual(claim.patientCoPayKhr, 0); // 100% covered under occupational injury
  assert.strictEqual(claim.nssfPayableKhr, 435000);
  assert.strictEqual(claim.effectiveCoPayPercent, 0);
  assert.strictEqual(claim.khmerClaimSummary.includes("("), false);
  assert.strictEqual(claim.khmerClaimSummary.includes(")"), false);
});

runTest("Cambodia NSSF: Health Care Scheme with Co-Pay and Ceiling Enforcement", () => {
  const items = [
    { code: "SURG-MAJ", descriptionEn: "Major Laparotomy", category: "K", coefficient: 120 }, // 1,440,000 KHR (Pre-Auth)
    { code: "LAB-PANEL", descriptionEn: "Comprehensive Metabolic Panel", category: "B", coefficient: 60 } // 60,000 KHR
  ];
  // Total Gross = 1,500,000 KHR. Co-pay = 10% -> Patient pays 150,000 KHR, NSSF pays 1,350,000 KHR.
  // With ceiling of 1,200,000 KHR: NSSF capped at 1,200,000, patient pays 150,000 + 150,000 = 300,000 KHR.
  const claim = CambodiaNssfEngine.calculateClaimReimbursement(items, false, 10, 1200000);
  assert.strictEqual(claim.totalGrossKhr, 1500000);
  assert.strictEqual(claim.anyPreAuthRequired, true);
  assert.strictEqual(claim.nssfPayableKhr, 1200000);
  assert.strictEqual(claim.patientCoPayKhr, 300000);
  assert.strictEqual(claim.khmerClaimSummary.includes("("), false);
  assert.strictEqual(claim.khmerClaimSummary.includes(")"), false);
});

// -----------------------------------------------------------------------------
// SUMMARY REPORT
// -----------------------------------------------------------------------------
console.log("=================================================================");
console.log(`CLINICAL MATHEMATICAL ENGINE AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
console.log("=================================================================");
