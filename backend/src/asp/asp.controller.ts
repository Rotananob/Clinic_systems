// REST Controller for Automated Antimicrobial Stewardship Program (ASP) Engine
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { AspService } from './asp.service.ts';

export class AspController {
  private readonly aspService: AspService;

  constructor() {
    this.aspService = AspService.getInstance();
  }

  public handleRequest(path: string, method: string, query: Record<string, string>, body: any): { status: number; data: any } {
    try {
      // 1. GET /api/asp/metrics
      if (path === '/api/asp/metrics' && method === 'GET') {
        const unit = (query.unit as 'ICU' | 'GENERAL_WARD' | 'ALL') || 'ALL';
        const patientDays = parseFloat(query.patientDays || '100') || 100;
        const predictedDot = parseFloat(query.predictedDot || '60') || 60;

        const summary = this.aspService.calculateUnitMetrics(unit, patientDays);
        const saar = this.aspService.calculateSaar(summary.totalDaysOfTherapy, predictedDot);

        return {
          status: 200,
          data: {
            unit,
            summary,
            saar
          }
        };
      }

      // 2. GET /api/asp/antibiogram
      if (path === '/api/asp/antibiogram' && method === 'GET') {
        const records = this.aspService.getAntibiogram();
        return { status: 200, data: records };
      }

      // 3. GET /api/asp/agents
      if (path === '/api/asp/agents' && method === 'GET') {
        const agents = this.aspService.getAntimicrobialAgents();
        return { status: 200, data: agents };
      }

      // 4. GET /api/asp/patients
      if (path === '/api/asp/patients' && method === 'GET') {
        if (query.patientId) {
          const course = this.aspService.getPatientCourse(query.patientId);
          if (!course) {
            return { status: 404, data: { error: 'Patient antimicrobial course not found.' } };
          }
          return { status: 200, data: course };
        }
        const courses = this.aspService.getAllPatientCourses();
        return { status: 200, data: courses };
      }

      // 5. POST /api/asp/evaluate-pct
      if (path === '/api/asp/evaluate-pct' && method === 'POST') {
        const baselinePct = parseFloat(body.baselinePct ?? 2.0);
        const currentPct = parseFloat(body.currentPct ?? 0.2);
        const afebrileHours = parseFloat(body.afebrileHours ?? 24);
        const meanArterialPressure = parseFloat(body.meanArterialPressure ?? 75);

        const result = this.aspService.evaluatePct(baselinePct, currentPct, afebrileHours, meanArterialPressure);
        return { status: 200, data: result };
      }

      // 6. POST /api/asp/evaluate-stepdown
      if (path === '/api/asp/evaluate-stepdown' && method === 'POST') {
        const agentCode = String(body.agentCode || 'CIPROFLOXACIN_IV');
        const daysOnIv = parseFloat(body.daysOnIv ?? 3);
        const afebrileHours = parseFloat(body.afebrileHours ?? 36);
        const meanArterialPressure = parseFloat(body.meanArterialPressure ?? 75);
        const wbcCount = parseFloat(body.wbcCount ?? 7500);
        const functionalGiTract = Boolean(body.functionalGiTract ?? true);

        const result = this.aspService.evaluateStepDown(
          agentCode,
          daysOnIv,
          afebrileHours,
          meanArterialPressure,
          wbcCount,
          functionalGiTract
        );
        return { status: 200, data: result };
      }

      // 7. POST /api/asp/check-mismatch
      if (path === '/api/asp/check-mismatch' && method === 'POST') {
        const pathogenCode = String(body.pathogenCode || '');
        const antibioticCode = String(body.antibioticCode || '');

        const result = this.aspService.checkBugDrugMismatch(pathogenCode, antibioticCode);
        return { status: 200, data: result };
      }

      // 8. GET /api/asp/approvals
      if (path === '/api/asp/approvals' && method === 'GET') {
        const approvals = this.aspService.getApprovalRequests();
        return { status: 200, data: approvals };
      }

      // 9. POST /api/asp/request-approval
      if (path === '/api/asp/request-approval' && method === 'POST') {
        const created = this.aspService.submitApprovalRequest(body);
        return { status: 201, data: created };
      }

      // 10. POST /api/asp/review-approval
      if (path === '/api/asp/review-approval' && method === 'POST') {
        const { id, decision, comments, reviewer } = body;
        const updated = this.aspService.reviewApprovalRequest(id, decision, comments, reviewer);
        return { status: 200, data: updated };
      }

      return { status: 404, data: { error: 'ASP route not found.' } };
    } catch (err: any) {
      return { status: 500, data: { error: err.message || 'Internal ASP processing error.' } };
    }
  }
}
