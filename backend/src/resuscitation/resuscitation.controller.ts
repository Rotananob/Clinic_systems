// Controller for Emergency Sepsis & Trauma Resuscitation Protocol Engine
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { ResuscitationService } from './resuscitation.service';

export class ResuscitationController {
  private service: ResuscitationService;

  constructor(service?: ResuscitationService) {
    this.service = service || new ResuscitationService();
  }

  public async evaluateSepsis(req: { body: any }) {
    const data = req.body || {};
    return this.service.evaluateSepsis({
      weightKg: Number(data.weightKg) || 70,
      respiratoryRate: Number(data.respiratoryRate) || 18,
      glasgowComaScale: Number(data.glasgowComaScale) || 15,
      systolicBp: Number(data.systolicBp) || 120,
      initialLactateMmolL: Number(data.initialLactateMmolL) || 1.8,
      measuredMapMmHg: Number(data.measuredMapMmHg) || 75,
      repeatLactateMmolL: data.repeatLactateMmolL !== undefined ? Number(data.repeatLactateMmolL) : undefined,
      elapsedHours: data.elapsedHours !== undefined ? Number(data.elapsedHours) : undefined,
      pao2Fio2Ratio: data.pao2Fio2Ratio !== undefined ? Number(data.pao2Fio2Ratio) : undefined,
      plateletsPerUl: data.plateletsPerUl !== undefined ? Number(data.plateletsPerUl) : undefined,
      bilirubinMgDl: data.bilirubinMgDl !== undefined ? Number(data.bilirubinMgDl) : undefined,
      creatinineMgDl: data.creatinineMgDl !== undefined ? Number(data.creatinineMgDl) : undefined,
      vasopressorTier: data.vasopressorTier !== undefined ? Number(data.vasopressorTier) as any : undefined,
    });
  }

  public async calculateParkland(req: { body: any }) {
    const data = req.body || {};
    return this.service.calculateParkland({
      weightKg: Number(data.weightKg) || 70,
      tbsaPercentage: Number(data.tbsaPercentage) || 20,
      hoursSinceInjury: Number(data.hoursSinceInjury) || 0,
      currentHourlyRateMlH: data.currentHourlyRateMlH !== undefined ? Number(data.currentHourlyRateMlH) : undefined,
      measuredHourlyUopMlH: data.measuredHourlyUopMlH !== undefined ? Number(data.measuredHourlyUopMlH) : undefined,
      isPediatric: Boolean(data.isPediatric),
    });
  }

  public async calculatePediatricBroselow(req: { body: any }) {
    const data = req.body || {};
    return this.service.calculatePediatricBroselow({
      ageYears: Number(data.ageYears) || 4,
      weightKg: Number(data.weightKg) || 16,
    });
  }

  public async evaluateMtp(req: { body: any }) {
    const data = req.body || {};
    return this.service.evaluateMtp({
      heartRate: Number(data.heartRate) || 80,
      systolicBp: Number(data.systolicBp) || 120,
      isPenetratingInjury: Boolean(data.isPenetratingInjury),
      fastUltrasoundPositive: Boolean(data.fastUltrasoundPositive),
      hoursSinceInjury: Number(data.hoursSinceInjury) || 1.0,
    });
  }

  public async getProtocols() {
    return this.service.getProtocols();
  }
}
