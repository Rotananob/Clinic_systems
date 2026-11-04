// REST Controller for Chemotherapy Oncology Precision Dosing Engine
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { ChemoService } from './chemo.service';

export class ChemoController {
  private readonly chemoService: ChemoService;

  constructor() {
    this.chemoService = ChemoService.getInstance();
  }

  public handleRequest(path: string, method: string, query: Record<string, string>, body: any): { status: number; data: any } {
    try {
      // 1. GET /api/chemo/regimens
      if (path === '/api/chemo/regimens' && method === 'GET') {
        if (query.code) {
          const reg = this.chemoService.getRegimenByCode(query.code);
          if (!reg) return { status: 404, data: { error: 'Chemotherapy regimen not found.' } };
          return { status: 200, data: reg };
        }
        return { status: 200, data: this.chemoService.getRegimens() };
      }

      // 2. GET /api/chemo/patients
      if (path === '/api/chemo/patients' && method === 'GET') {
        if (query.patientId) {
          const pt = this.chemoService.getPatientById(query.patientId);
          if (!pt) return { status: 404, data: { error: 'Oncology patient profile not found.' } };
          return { status: 200, data: pt };
        }
        return { status: 200, data: this.chemoService.getPatients() };
      }

      // 3. POST /api/chemo/calculate-bsa
      if (path === '/api/chemo/calculate-bsa' && method === 'POST') {
        const heightCm = parseFloat(body.heightCm || 170);
        const weightKg = parseFloat(body.weightKg || 70);
        const capAt2_0 = Boolean(body.capAt2_0 ?? false);

        const result = this.chemoService.calculateBsa(heightCm, weightKg, capAt2_0);
        return { status: 200, data: result };
      }

      // 4. POST /api/chemo/calculate-calvert
      if (path === '/api/chemo/calculate-calvert' && method === 'POST') {
        const targetAuc = parseFloat(body.targetAuc || 5.0);
        const measuredGfr = parseFloat(body.measuredGfr || 90);

        const result = this.chemoService.calculateCalvert(targetAuc, measuredGfr);
        return { status: 200, data: result };
      }

      // 5. POST /api/chemo/check-anthracycline
      if (path === '/api/chemo/check-anthracycline' && method === 'POST') {
        const currentCumulative = parseFloat(body.currentCumulative || 0);
        const newDoseMgM2 = parseFloat(body.newDoseMgM2 || 50);
        const agentCode = String(body.agentCode || 'DOXORUBICIN');

        const result = this.chemoService.checkAnthracyclineSafety(currentCumulative, newDoseMgM2, agentCode);
        return { status: 200, data: result };
      }

      // 6. POST /api/chemo/check-lab-safety
      if (path === '/api/chemo/check-lab-safety' && method === 'POST') {
        const wbc = parseFloat(body.wbc || 5000);
        const neutrophilPercent = parseFloat(body.neutrophilPercent || 50);
        const bandPercent = parseFloat(body.bandPercent || 2);
        const platelets = parseFloat(body.platelets || 180000);
        const totalBilirubin = parseFloat(body.totalBilirubin || 0.9);
        const astAltRatio = parseFloat(body.astAltRatio || 1.0);
        const crCl = parseFloat(body.crCl || 85);

        const result = this.chemoService.checkLabSafetyGate(
          wbc,
          neutrophilPercent,
          bandPercent,
          platelets,
          totalBilirubin,
          astAltRatio,
          crCl
        );
        return { status: 200, data: result };
      }

      // 7. POST /api/chemo/patient-cycle-dosing
      if (path === '/api/chemo/patient-cycle-dosing' && method === 'POST') {
        const patientId = String(body.patientId || '');
        const regimenCode = String(body.regimenCode || '');

        const result = this.chemoService.calculatePatientCycleDosing(patientId, regimenCode);
        return { status: 200, data: result };
      }

      return { status: 404, data: { error: 'Chemotherapy oncology endpoint not found.' } };
    } catch (err: any) {
      return { status: 500, data: { error: err.message || 'Internal Chemotherapy Engine error.' } };
    }
  }
}
