// REST Controller for Pediatric & Neonatal Precision Pharmacotherapy Engine
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { PediatricService } from './pediatric.service.ts';

export class PediatricController {
  private readonly pediatricService: PediatricService;

  constructor() {
    this.pediatricService = PediatricService.getInstance();
  }

  public handleRequest(path: string, method: string, query: Record<string, string>, body: any): { status: number; data: any } {
    try {
      // 1. GET /api/pediatric/medications
      if (path === '/api/pediatric/medications' && method === 'GET') {
        if (query.code) {
          const med = this.pediatricService.getMedicationByCode(query.code);
          if (!med) return { status: 404, data: { error: 'Medication not found.' } };
          return { status: 200, data: med };
        }
        return { status: 200, data: this.pediatricService.getMedications() };
      }

      // 2. GET /api/pediatric/patients
      if (path === '/api/pediatric/patients' && method === 'GET') {
        if (query.patientId) {
          const pt = this.pediatricService.getPatientById(query.patientId);
          if (!pt) return { status: 404, data: { error: 'Patient not found.' } };
          return { status: 200, data: pt };
        }
        return { status: 200, data: this.pediatricService.getPatients() };
      }

      // 3. POST /api/pediatric/calculate-dosing
      if (path === '/api/pediatric/calculate-dosing' && method === 'POST') {
        const medicationCode = String(body.medicationCode || 'PARACETAMOL');
        const weightKg = parseFloat(body.weightKg || 15);
        const ageYears = parseFloat(body.ageYears || 3);
        const ageMonths = parseFloat(body.ageMonths || 36);
        const concentrationMgPerMl = body.concentrationMgPerMl ? parseFloat(body.concentrationMgPerMl) : undefined;

        const result = this.pediatricService.calculatePediatricDosing(
          medicationCode,
          weightKg,
          ageYears,
          ageMonths,
          concentrationMgPerMl
        );
        return { status: 200, data: result };
      }

      // 4. POST /api/pediatric/neonatal-gentamicin
      if (path === '/api/pediatric/neonatal-gentamicin' && method === 'POST') {
        const gestationalAgeWeeks = parseFloat(body.gestationalAgeWeeks || 38);
        const postnatalAgeDays = parseFloat(body.postnatalAgeDays || 3);
        const weightKg = parseFloat(body.weightKg || 3.0);

        const result = this.pediatricService.calculateNeonatalGentamicin(
          gestationalAgeWeeks,
          postnatalAgeDays,
          weightKg
        );
        return { status: 200, data: result };
      }

      // 5. POST /api/pediatric/evaluate-phototherapy
      if (path === '/api/pediatric/evaluate-phototherapy' && method === 'POST') {
        const postnatalHours = parseFloat(body.postnatalHours || 48);
        const totalSerumBilirubinMgDl = parseFloat(body.totalSerumBilirubinMgDl || 12.0);
        const gestationalAgeWeeks = parseFloat(body.gestationalAgeWeeks || 38);
        const hasNeurotoxicityRiskFactors = Boolean(body.hasNeurotoxicityRiskFactors ?? false);

        const result = this.pediatricService.evaluateBilirubinNomogram(
          postnatalHours,
          totalSerumBilirubinMgDl,
          gestationalAgeWeeks,
          hasNeurotoxicityRiskFactors
        );
        return { status: 200, data: result };
      }

      return { status: 404, data: { error: 'Pediatric route not found.' } };
    } catch (err: any) {
      return { status: 500, data: { error: err.message || 'Internal Pediatric Processing Error.' } };
    }
  }
}
