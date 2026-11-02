import { NotFoundException, BadRequestException } from '@nestjs/common';

export type BedStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'CLEANING_REQUIRED'
  | 'OUT_OF_SERVICE';

export type WardCode =
  | 'WARD_GENERAL_MED'
  | 'WARD_SURGICAL'
  | 'WARD_MATERNITY'
  | 'WARD_OBSERVATION';

export type MedAdminRoute = 'PO' | 'IV' | 'IM' | 'SC' | 'INH' | 'TOPICAL';

export type MedAdminStatus = 'SCHEDULED' | 'GIVEN' | 'MISSED' | 'REFUSED' | 'HELD_CLINICAL';

export interface Bed {
  id: string;
  bedNumber: string;
  ward: WardCode;
  wardNameKh: string;
  wardNameEn: string;
  dailyRateUsd: number;
  status: BedStatus;
  currentAdmissionId?: string;
  currentPatientId?: string;
  currentPatientName?: string;
}

export interface InpatientAdmission {
  id: string;
  admissionNumber: string;
  patientId: string;
  patientName: string;
  bedId: string;
  bedNumber: string;
  ward: WardCode;
  wardNameKh: string;
  wardNameEn: string;
  attendingDoctor: string;
  admittingDiagnosis: string;
  status: 'ADMITTED' | 'TRANSFERRED' | 'DISCHARGED';
  wristbandBarcode: string;
  admissionDate: string;
  dischargeDate?: string;
  depositAmountUsd: number;
  dailyRateUsd: number;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationAdminRecord {
  id: string;
  admissionId: string;
  patientId: string;
  medicationName: string;
  medicationBarcode: string;
  dose: string;
  route: MedAdminRoute;
  scheduledTime: string;
  administeredTime?: string;
  status: MedAdminStatus;
  administeringNurse?: string;
  notes?: string;
  verifiedBarcodeScan: boolean;
}

export interface FluidBalanceRecord {
  id: string;
  admissionId: string;
  patientId: string;
  recordTime: string;
  intakeOralMl: number;
  intakeIvMl: number;
  outputUrineMl: number;
  outputDrainMl: number;
  netBalanceMl: number;
  recordedByNurse: string;
}


export interface BradenScaleAssessment {
  id: string;
  admissionId: string;
  patientId: string;
  assessedAt: string;
  assessedByNurse: string;
  sensoryPerception: 1 | 2 | 3 | 4;
  moisture: 1 | 2 | 3 | 4;
  activity: 1 | 2 | 3 | 4;
  mobility: 1 | 2 | 3 | 4;
  nutrition: 1 | 2 | 3 | 4;
  frictionShear: 1 | 2 | 3;
  totalScore: number;
  riskLevel: 'VERY_HIGH_RISK' | 'HIGH_RISK' | 'MODERATE_RISK' | 'MILD_RISK' | 'NO_RISK';
  riskLevelKh: string;
  protocols: string[];
}

export interface NursingVitalFlowsheetEntry {
  id: string;
  admissionId: string;
  patientId: string;
  recordedAt: string;
  recordedByNurse: string;
  respiratoryRate: number;
  spo2Percent: number;
  onSupplementalOxygen: boolean;
  systolicBp: number;
  diastolicBp: number;
  pulseRate: number;
  consciousnessAvpu: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
  temperatureCelsius: number;
  news2Score: number;
  clinicalRisk: 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH_CRITICAL';
  monitoringFrequencyEn: string;
  monitoringFrequencyKh: string;
}

export class IpdService {
  private beds: Map<string, Bed> = new Map();
  private admissions: Map<string, InpatientAdmission> = new Map();
  private emarRecords: Map<string, MedicationAdminRecord[]> = new Map();
  private fluidRecords: Map<string, FluidBalanceRecord[]> = new Map();
  private bradenRecords: Map<string, BradenScaleAssessment[]> = new Map();
  private vitalRecords: Map<string, NursingVitalFlowsheetEntry[]> = new Map();

  constructor() {
    this.seedDefaultWardsAndBeds();
    this.seedDefaultAdmission();
  }

  private seedDefaultWardsAndBeds(): void {
    const defaultBeds: Bed[] = [
      {
        id: 'bed-101',
        bedNumber: 'MED-B1',
        ward: 'WARD_GENERAL_MED',
        wardNameKh: 'អគារជំងឺទូទៅ - General Ward',
        wardNameEn: 'General Medical Ward',
        dailyRateUsd: 25.0,
        status: 'OCCUPIED',
        currentAdmissionId: 'adm-20261020-01',
        currentPatientId: 'PT-1001',
        currentPatientName: 'KEO Sokha',
      },
      {
        id: 'bed-102',
        bedNumber: 'MED-B2',
        ward: 'WARD_GENERAL_MED',
        wardNameKh: 'អគារជំងឺទូទៅ - General Ward',
        wardNameEn: 'General Medical Ward',
        dailyRateUsd: 25.0,
        status: 'AVAILABLE',
      },
      {
        id: 'bed-103',
        bedNumber: 'MED-B3',
        ward: 'WARD_GENERAL_MED',
        wardNameKh: 'អគារជំងឺទូទៅ - General Ward',
        wardNameEn: 'General Medical Ward',
        dailyRateUsd: 25.0,
        status: 'CLEANING_REQUIRED',
      },
      {
        id: 'bed-201',
        bedNumber: 'SURG-B1',
        ward: 'WARD_SURGICAL',
        wardNameKh: 'អគារសង្គ្រោះក្រោយវះកាត់ - Surgical Post-Op',
        wardNameEn: 'Surgical Recovery Ward',
        dailyRateUsd: 45.0,
        status: 'AVAILABLE',
      },
      {
        id: 'bed-202',
        bedNumber: 'SURG-B2',
        ward: 'WARD_SURGICAL',
        wardNameKh: 'អគារសង្គ្រោះក្រោយវះកាត់ - Surgical Post-Op',
        wardNameEn: 'Surgical Recovery Ward',
        dailyRateUsd: 45.0,
        status: 'AVAILABLE',
      },
      {
        id: 'bed-301',
        bedNumber: 'MAT-B1',
        ward: 'WARD_MATERNITY',
        wardNameKh: 'អគារសម្ភព និងទារក - Maternity Suite',
        wardNameEn: 'Maternity & Neonatal Ward',
        dailyRateUsd: 50.0,
        status: 'AVAILABLE',
      },
      {
        id: 'bed-401',
        bedNumber: 'OBS-B1',
        ward: 'WARD_OBSERVATION',
        wardNameKh: 'បន្ទប់សម្រាកតាមដានខ្លី (Short-Stay Obs)',
        wardNameEn: 'Short-Stay Observation Unit',
        dailyRateUsd: 15.0,
        status: 'AVAILABLE',
      },
    ];

    for (const b of defaultBeds) {
      this.beds.set(b.id, b);
    }
  }

  private seedDefaultAdmission(): void {
    const admissionId = 'adm-20261020-01';
    const admission: InpatientAdmission = {
      id: admissionId,
      admissionNumber: 'IPD-20261020-001',
      patientId: 'PT-1001',
      patientName: 'KEO Sokha',
      bedId: 'bed-101',
      bedNumber: 'MED-B1',
      ward: 'WARD_GENERAL_MED',
      wardNameKh: 'អគារជំងឺទូទៅ - General Ward',
      wardNameEn: 'General Medical Ward',
      attendingDoctor: 'Dr. CHAN Vanna',
      admittingDiagnosis: 'Community-Acquired Pneumonia with Moderate Hypoxemia',
      status: 'ADMITTED',
      wristbandBarcode: 'WB-PT1001-20261020',
      admissionDate: '2026-10-20T08:00:00Z',
      depositAmountUsd: 100.0,
      dailyRateUsd: 25.0,
      emergencyContact: {
        name: 'KEO Samnang (Brother)',
        phone: '012987654',
        relation: 'Brother',
      },
      tenantId: 'default-tenant',
      createdAt: '2026-10-20T08:00:00Z',
      updatedAt: '2026-10-20T08:00:00Z',
    };

    this.admissions.set(admission.id, admission);

    // Seed default e-MAR records for PT-1001
    const emarList: MedicationAdminRecord[] = [
      {
        id: 'emar-01',
        admissionId,
        patientId: 'PT-1001',
        medicationName: 'Ceftriaxone 1g IV Infusion',
        medicationBarcode: 'MED-CEF1G-IV',
        dose: '1g in 100mL Normal Saline',
        route: 'IV',
        scheduledTime: '2026-10-20T09:00:00Z',
        administeredTime: '2026-10-20T09:05:00Z',
        status: 'GIVEN',
        administeringNurse: 'Nurse Sreymom',
        notes: 'Infused over 30 mins. No adverse reaction observed.',
        verifiedBarcodeScan: true,
      },
      {
        id: 'emar-02',
        admissionId,
        patientId: 'PT-1001',
        medicationName: 'Paracetamol 500mg Tablet',
        medicationBarcode: 'MED-PCM500-TAB',
        dose: '500mg (1 tab)',
        route: 'PO',
        scheduledTime: '2026-10-20T14:00:00Z',
        status: 'SCHEDULED',
        verifiedBarcodeScan: false,
      },
      {
        id: 'emar-03',
        admissionId,
        patientId: 'PT-1001',
        medicationName: 'Ceftriaxone 1g IV Infusion',
        medicationBarcode: 'MED-CEF1G-IV',
        dose: '1g in 100mL Normal Saline',
        route: 'IV',
        scheduledTime: '2026-10-20T21:00:00Z',
        status: 'SCHEDULED',
        verifiedBarcodeScan: false,
      },
    ];
    this.emarRecords.set(admissionId, emarList);

    // Seed default Fluid I/O
    const fluidList: FluidBalanceRecord[] = [
      {
        id: 'fl-01',
        admissionId,
        patientId: 'PT-1001',
        recordTime: '2026-10-20T12:00:00Z',
        intakeOralMl: 450,
        intakeIvMl: 500,
        outputUrineMl: 650,
        outputDrainMl: 0,
        netBalanceMl: 300,
        recordedByNurse: 'Nurse Sreymom',
      },
    ];
    this.fluidRecords.set(admissionId, fluidList);
    // Seed default Braden assessment
    const defaultBraden: BradenScaleAssessment = {
      id: 'braden-01',
      admissionId,
      patientId: 'PT-1001',
      assessedAt: '2026-10-20T08:30:00Z',
      assessedByNurse: 'Nurse Sreymom',
      sensoryPerception: 3,
      moisture: 3,
      activity: 2,
      mobility: 2,
      nutrition: 3,
      frictionShear: 2,
      totalScore: 15,
      riskLevel: 'MILD_RISK',
      riskLevelKh: 'ហានិភ័យទាប',
      protocols: [
        'លើកទឹកចិត្តឱ្យចលនាខ្លួនតាមដែលអាចធ្វើបាន',
        'ត្រួតពិនិត្យស្បែកជារៀងរាល់ថ្ងៃ',
        'រក្សាស្បែកឱ្យស្អាតនិងស្ងួតជានិច្ច'
      ]
    };
    this.bradenRecords.set(admissionId, [defaultBraden]);

    // Seed default Vital Flowsheet entry
    const defaultVital: NursingVitalFlowsheetEntry = {
      id: 'vital-01',
      admissionId,
      patientId: 'PT-1001',
      recordedAt: '2026-10-20T08:15:00Z',
      recordedByNurse: 'Nurse Sreymom',
      respiratoryRate: 22,
      spo2Percent: 94,
      onSupplementalOxygen: true,
      systolicBp: 118,
      diastolicBp: 76,
      pulseRate: 98,
      consciousnessAvpu: 'ALERT',
      temperatureCelsius: 38.2,
      news2Score: 6,
      clinicalRisk: 'MEDIUM',
      monitoringFrequencyEn: 'Minimum 1 hourly monitoring & urgent clinical review',
      monitoringFrequencyKh: 'តាមដានយ៉ាងតិចរៀងរាល់ ១ម៉ោងម្តង និងជូនដំណឹងគ្រូពេទ្យពិនិត្យបន្ទាន់'
    };
    this.vitalRecords.set(admissionId, [defaultVital]);
  }

  // Get all beds in clinic with occupancy stats
  getBeds(ward?: WardCode, status?: BedStatus, tenantId?: string): Bed[] {
    let list = Array.from(this.beds.values());
    if (tenantId) {
      list = list.filter((b) => !b.tenantId || b.tenantId === tenantId);
    }
    if (ward) {
      list = list.filter((b) => b.ward === ward);
    }
    if (status) {
      list = list.filter((b) => b.status === status);
    }
    return list;
  }

  // Get bed summary metrics
  getBedMetrics() {
    const list = Array.from(this.beds.values());
    const total = list.length;
    const occupied = list.filter((b) => b.status === 'OCCUPIED').length;
    const available = list.filter((b) => b.status === 'AVAILABLE').length;
    const cleaning = list.filter((b) => b.status === 'CLEANING_REQUIRED').length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return {
      totalBeds: total,
      occupiedBeds: occupied,
      availableBeds: available,
      cleaningRequired: cleaning,
      occupancyRatePercent: occupancyRate,
    };
  }

  // Admit patient to specific bed
  admitPatient(data: {
    patientId: string;
    patientName: string;
    bedId: string;
    attendingDoctor: string;
    admittingDiagnosis: string;
    depositAmountUsd?: number;
    emergencyContact: { name: string; phone: string; relation: string };
    tenantId?: string;
  }): InpatientAdmission {
    const bed = this.beds.get(data.bedId);
    if (!bed) {
      throw new NotFoundException(`Bed ${data.bedId} not found`);
    }
    if (data.tenantId && bed.tenantId && bed.tenantId !== data.tenantId) {
      throw new BadRequestException(`Cross-tenant bed admission violation: Bed ${bed.bedNumber} belongs to tenant ${bed.tenantId}`);
    }
    if (bed.status !== 'AVAILABLE') {
      throw new BadRequestException(`Bed ${bed.bedNumber} is currently ${bed.status} and cannot be assigned`);
    }

    const timestampStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900).toString();
    const admissionNumber = `IPD-${timestampStr}-${randSuffix}`;
    const cleanPt = data.patientId.replace(/[^a-zA-Z0-9]/g, '');
    const wristbandBarcode = `WB-${cleanPt}-${timestampStr}`;
    const randId = Math.floor(1000 + Math.random() * 9000);
    const admissionId = `adm-${Date.now()}-${randId}`;

    const newAdmission: InpatientAdmission = {
      id: admissionId,
      admissionNumber,
      patientId: data.patientId,
      patientName: data.patientName,
      bedId: bed.id,
      bedNumber: bed.bedNumber,
      ward: bed.ward,
      wardNameKh: bed.wardNameKh,
      wardNameEn: bed.wardNameEn,
      attendingDoctor: data.attendingDoctor,
      admittingDiagnosis: data.admittingDiagnosis,
      status: 'ADMITTED',
      wristbandBarcode,
      admissionDate: new Date().toISOString(),
      depositAmountUsd: data.depositAmountUsd || 0,
      dailyRateUsd: bed.dailyRateUsd,
      emergencyContact: data.emergencyContact,
      tenantId: data.tenantId || 'default-tenant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update bed state to OCCUPIED
    bed.status = 'OCCUPIED';
    bed.currentAdmissionId = admissionId;
    bed.currentPatientId = data.patientId;
    bed.currentPatientName = data.patientName;
    if (data.tenantId) bed.tenantId = data.tenantId;
    this.beds.set(bed.id, bed);

    this.admissions.set(admissionId, newAdmission);
    this.emarRecords.set(admissionId, []);
    this.fluidRecords.set(admissionId, []);

    return newAdmission;
  }

  // Transfer patient to different bed or ward
  transferBed(admissionId: string, targetBedId: string, transferNote?: string): InpatientAdmission {
    const admission = this.admissions.get(admissionId);
    if (!admission || admission.status !== 'ADMITTED') {
      throw new NotFoundException(`Active admission ${admissionId} not found`);
    }

    const targetBed = this.beds.get(targetBedId);
    if (!targetBed) {
      throw new NotFoundException(`Target bed ${targetBedId} not found`);
    }
    if (admission.tenantId && targetBed.tenantId && targetBed.tenantId !== admission.tenantId) {
      throw new BadRequestException(`Cross-tenant bed transfer violation: Target bed ${targetBed.bedNumber} belongs to tenant ${targetBed.tenantId}`);
    }
    if (targetBed.status !== 'AVAILABLE') {
      throw new BadRequestException(`Target bed ${targetBed.bedNumber} is not available`);
    }

    // Release old bed and set to CLEANING_REQUIRED
    const oldBed = this.beds.get(admission.bedId);
    if (oldBed) {
      oldBed.status = 'CLEANING_REQUIRED';
      oldBed.currentAdmissionId = undefined;
      oldBed.currentPatientId = undefined;
      oldBed.currentPatientName = undefined;
      this.beds.set(oldBed.id, oldBed);
    }

    // Assign new bed
    targetBed.status = 'OCCUPIED';
    targetBed.currentAdmissionId = admission.id;
    targetBed.currentPatientId = admission.patientId;
    targetBed.currentPatientName = admission.patientName;
    this.beds.set(targetBed.id, targetBed);

    admission.bedId = targetBed.id;
    admission.bedNumber = targetBed.bedNumber;
    admission.ward = targetBed.ward;
    admission.wardNameKh = targetBed.wardNameKh;
    admission.wardNameEn = targetBed.wardNameEn;
    admission.dailyRateUsd = targetBed.dailyRateUsd;
    admission.updatedAt = new Date().toISOString();

    this.admissions.set(admission.id, admission);
    return admission;
  }

  // Discharge inpatient and calculate stay days
  dischargePatient(admissionId: string, dischargeSummary?: string): InpatientAdmission {
    const admission = this.admissions.get(admissionId);
    if (!admission || admission.status !== 'ADMITTED') {
      throw new NotFoundException(`Active admission ${admissionId} not found`);
    }

    const dischargeDate = new Date().toISOString();
    admission.status = 'DISCHARGED';
    admission.dischargeDate = dischargeDate;
    admission.updatedAt = dischargeDate;

    // Release bed to CLEANING_REQUIRED
    const bed = this.beds.get(admission.bedId);
    if (bed) {
      bed.status = 'CLEANING_REQUIRED';
      bed.currentAdmissionId = undefined;
      bed.currentPatientId = undefined;
      bed.currentPatientName = undefined;
      this.beds.set(bed.id, bed);
    }

    this.admissions.set(admission.id, admission);
    return admission;
  }


  // Calculate daily stay charges and net balance due
  calculateStayCharges(admissionId: string, asOfDate?: string): {
    admissionNumber: string;
    patientId: string;
    ward: WardCode;
    dailyRateUsd: number;
    dailyRateKhr: number;
    admissionDate: string;
    calculateToDate: string;
    daysStayed: number;
    totalRoomChargesUsd: number;
    totalRoomChargesKhr: number;
    depositAmountUsd: number;
    netBalanceDueUsd: number;
    netBalanceDueKhr: number;
  } {
    const admission = this.admissions.get(admissionId);
    if (!admission) {
      throw new NotFoundException(`Admission ${admissionId} not found`);
    }

    const exchangeRate = 4100;
    const toDate = asOfDate ? new Date(asOfDate) : (admission.dischargeDate ? new Date(admission.dischargeDate) : new Date());
    const fromDate = new Date(admission.admissionDate);
    const diffMs = toDate.getTime() - fromDate.getTime();
    const rawDays = diffMs / (1000 * 60 * 60 * 24);
    const daysStayed = Math.max(1, Math.ceil(rawDays));

    const totalRoomChargesUsd = daysStayed * admission.dailyRateUsd;
    const totalRoomChargesKhr = totalRoomChargesUsd * exchangeRate;
    const netBalanceDueUsd = Math.max(0, totalRoomChargesUsd - admission.depositAmountUsd);
    const netBalanceDueKhr = netBalanceDueUsd * exchangeRate;

    return {
      admissionNumber: admission.admissionNumber,
      patientId: admission.patientId,
      ward: admission.ward,
      dailyRateUsd: admission.dailyRateUsd,
      dailyRateKhr: admission.dailyRateUsd * exchangeRate,
      admissionDate: admission.admissionDate,
      calculateToDate: toDate.toISOString(),
      daysStayed,
      totalRoomChargesUsd,
      totalRoomChargesKhr,
      depositAmountUsd: admission.depositAmountUsd,
      netBalanceDueUsd,
      netBalanceDueKhr,
    };
  }

  // Get detailed ward-by-ward bed occupancy breakdown
  getWardOccupancyBreakdown(tenantId?: string): Record<WardCode, {
    wardNameEn: string;
    wardNameKh: string;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRatePercent: number;
  }> {
    const wardCodes: WardCode[] = [
      'WARD_GENERAL_MED',
      'WARD_SURGICAL',
      'WARD_MATERNITY',
      'WARD_OBSERVATION',
    ];

    const result: any = {};
    for (const wc of wardCodes) {
      const beds = this.getBeds(wc, undefined, tenantId);
      const total = beds.length;
      const occupied = beds.filter((b) => b.status === 'OCCUPIED').length;
      const available = beds.filter((b) => b.status === 'AVAILABLE').length;
      const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
      const sample = beds[0];
      result[wc] = {
        wardNameEn: sample ? sample.wardNameEn : wc,
        wardNameKh: sample ? sample.wardNameKh : wc,
        totalBeds: total,
        occupiedBeds: occupied,
        availableBeds: available,
        occupancyRatePercent: rate,
      };
    }
    return result;
  }

  // Clean and mark bed as AVAILABLE
  markBedCleaned(bedId: string): Bed {
    const bed = this.beds.get(bedId);
    if (!bed) {
      throw new NotFoundException(`Bed ${bedId} not found`);
    }
    bed.status = 'AVAILABLE';
    this.beds.set(bed.id, bed);
    return bed;
  }

  // Get admission details
  getAdmission(admissionId: string): InpatientAdmission {
    const admission = this.admissions.get(admissionId);
    if (!admission) {
      throw new NotFoundException(`Admission ${admissionId} not found`);
    }
    return admission;
  }

  // List admissions
  listAdmissions(status?: 'ADMITTED' | 'TRANSFERRED' | 'DISCHARGED'): InpatientAdmission[] {
    let list = Array.from(this.admissions.values());
    if (status) {
      list = list.filter((a) => a.status === status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // e-MAR: Schedule new medication order for inpatient
  scheduleMedication(
    admissionId: string,
    data: {
      medicationName: string;
      medicationBarcode: string;
      dose: string;
      route: MedAdminRoute;
      scheduledTime: string;
    },
  ): MedicationAdminRecord {
    const admission = this.admissions.get(admissionId);
    if (!admission) {
      throw new NotFoundException(`Admission ${admissionId} not found`);
    }

    const newRecord: MedicationAdminRecord = {
      id: `emar-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      admissionId,
      patientId: admission.patientId,
      medicationName: data.medicationName,
      medicationBarcode: data.medicationBarcode,
      dose: data.dose,
      route: data.route,
      scheduledTime: data.scheduledTime,
      status: 'SCHEDULED',
      verifiedBarcodeScan: false,
    };

    const currentList = this.emarRecords.get(admissionId) || [];
    currentList.push(newRecord);
    this.emarRecords.set(admissionId, currentList);

    return newRecord;
  }

  // e-MAR: Administer medication with Barcode Scanning Five Rights Verification
  administerMedication(
    admissionId: string,
    emarId: string,
    data: {
      scannedWristbandBarcode: string;
      scannedMedicationBarcode: string;
      nurseName: string;
      status?: MedAdminStatus;
      notes?: string;
    },
  ): MedicationAdminRecord {
    const admission = this.admissions.get(admissionId);
    if (!admission) {
      throw new NotFoundException(`Admission ${admissionId} not found`);
    }

    const records = this.emarRecords.get(admissionId) || [];
    const record = records.find((r) => r.id === emarId);
    if (!record) {
      throw new NotFoundException(`e-MAR record ${emarId} not found`);
    }

    // Five Rights: Verify Right Patient Wristband
    if (data.scannedWristbandBarcode !== admission.wristbandBarcode) {
      throw new BadRequestException(
        `Five Rights Violation: Scanned wristband "${data.scannedWristbandBarcode}" does not match patient wristband "${admission.wristbandBarcode}"`,
      );
    }

    // Five Rights: Verify Right Medication Barcode
    if (data.scannedMedicationBarcode !== record.medicationBarcode) {
      throw new BadRequestException(
        `Five Rights Violation: Scanned drug barcode "${data.scannedMedicationBarcode}" does not match prescribed drug barcode "${record.medicationBarcode}"`,
      );
    }

    record.status = data.status || 'GIVEN';
    record.administeredTime = new Date().toISOString();
    record.administeringNurse = data.nurseName;
    record.notes = data.notes;
    record.verifiedBarcodeScan = true;

    this.emarRecords.set(admissionId, records);
    return record;
  }

  // Get e-MAR records for admission
  getEmar(admissionId: string): MedicationAdminRecord[] {
    return this.emarRecords.get(admissionId) || [];
  }

  // Record Fluid Intake & Output (I/O)
  recordFluidBalance(
    admissionId: string,
    data: {
      intakeOralMl: number;
      intakeIvMl: number;
      outputUrineMl: number;
      outputDrainMl: number;
      nurseName: string;
    },
  ): FluidBalanceRecord {
    const admission = this.admissions.get(admissionId);
    if (!admission) {
      throw new NotFoundException(`Admission ${admissionId} not found`);
    }

    const totalIn = (data.intakeOralMl || 0) + (data.intakeIvMl || 0);
    const totalOut = (data.outputUrineMl || 0) + (data.outputDrainMl || 0);
    const netBalanceMl = totalIn - totalOut;

    const newFluidRecord: FluidBalanceRecord = {
      id: `fl-${Date.now()}`,
      admissionId,
      patientId: admission.patientId,
      recordTime: new Date().toISOString(),
      intakeOralMl: data.intakeOralMl || 0,
      intakeIvMl: data.intakeIvMl || 0,
      outputUrineMl: data.outputUrineMl || 0,
      outputDrainMl: data.outputDrainMl || 0,
      netBalanceMl,
      recordedByNurse: data.nurseName,
    };

    const currentList = this.fluidRecords.get(admissionId) || [];
    currentList.push(newFluidRecord);
    this.fluidRecords.set(admissionId, currentList);

    return newFluidRecord;
  }

  // Get Fluid Balance records
  getFluidBalance(admissionId: string): FluidBalanceRecord[] {
    return this.fluidRecords.get(admissionId) || [];
  }

  // IV Infusion Drip Rate Calculator (gtt/min)

  // Braden Scale Assessment for Inpatient Pressure Ulcer Prevention
  assessBradenScale(
    admissionId: string,
    data: {
      sensoryPerception: 1 | 2 | 3 | 4;
      moisture: 1 | 2 | 3 | 4;
      activity: 1 | 2 | 3 | 4;
      mobility: 1 | 2 | 3 | 4;
      nutrition: 1 | 2 | 3 | 4;
      frictionShear: 1 | 2 | 3;
      nurseName: string;
    }
  ): BradenScaleAssessment {
    const admission = this.admissions.get(admissionId);
    if (!admission) {
      throw new NotFoundException(`Admission ${admissionId} not found`);
    }

    const totalScore =
      data.sensoryPerception +
      data.moisture +
      data.activity +
      data.mobility +
      data.nutrition +
      data.frictionShear;

    let riskLevel: BradenScaleAssessment['riskLevel'] = 'NO_RISK';
    let riskLevelKh = 'គ្មានហានិភ័យ';
    let protocols: string[] = ['ការថែទាំអនាម័យស្តង់ដារតាមវួដ'];

    if (totalScore <= 9) {
      riskLevel = 'VERY_HIGH_RISK';
      riskLevelKh = 'ហានិភ័យធ្ងន់ធ្ងរខ្លាំង';
      protocols = [
        'ប្តូរឥរិយាបថរៀងរាល់ ២ម៉ោងម្តងជាកំហិត',
        'ប្រើពូកខ្យល់បញ្ចៀសសម្ពាធសង្កត់កម្រិតខ្ពស់ Low Air Loss Mattress',
        'ទ្រកែងជើងមិនឱ្យប៉ះផ្ទាល់ជាមួយពូក Heel Suspension',
        'លាបក្រែមការពារស្បែកសំណើម Barrier Cream',
        'ពិគ្រោះជាមួយអ្នកឯកទេសអាហារូបត្ថម្ភ'
      ];
    } else if (totalScore <= 12) {
      riskLevel = 'HIGH_RISK';
      riskLevelKh = 'ហានិភ័យខ្ពស់';
      protocols = [
        'តារាងប្តូរឥរិយាបថរៀងរាល់ ២ ទៅ ៣ម៉ោងម្តង',
        'ប្រើពូកអេប៉ុងទន់កម្រិតខ្ពស់ High-Density Foam',
        'ប្រើខ្នើយកល់ត្រគាកនិងខ្នង Foam Wedge',
        'លាបថ្នាំការពារស្បែកសំណើម'
      ];
    } else if (totalScore <= 14) {
      riskLevel = 'MODERATE_RISK';
      riskLevelKh = 'ហានិភ័យមធ្យម';
      protocols = [
        'ប្តូរឥរិយាបថរៀងរាល់ ៤ម៉ោងម្តង',
        'លាបក្រែមការពារសំណើមលើស្បែក',
        'ផ្តល់ជាតិទឹកនិងអាហារបំប៉នសមស្រប'
      ];
    } else if (totalScore <= 18) {
      riskLevel = 'MILD_RISK';
      riskLevelKh = 'ហានិភ័យទាប';
      protocols = [
        'លើកទឹកចិត្តឱ្យចលនាខ្លួនតាមដែលអាចធ្វើបាន',
        'ត្រួតពិនិត្យស្បែកជារៀងរាល់ថ្ងៃ',
        'រក្សាស្បែកឱ្យស្អាតនិងស្ងួតជានិច្ច'
      ];
    }

    const assessment: BradenScaleAssessment = {
      id: `braden-${Date.now()}`,
      admissionId,
      patientId: admission.patientId,
      assessedAt: new Date().toISOString(),
      assessedByNurse: data.nurseName,
      sensoryPerception: data.sensoryPerception,
      moisture: data.moisture,
      activity: data.activity,
      mobility: data.mobility,
      nutrition: data.nutrition,
      frictionShear: data.frictionShear,
      totalScore,
      riskLevel,
      riskLevelKh,
      protocols
    };

    const currentList = this.bradenRecords.get(admissionId) || [];
    currentList.unshift(assessment);
    this.bradenRecords.set(admissionId, currentList);

    return assessment;
  }

  getBradenAssessments(admissionId: string): BradenScaleAssessment[] {
    return this.bradenRecords.get(admissionId) || [];
  }

  // Vital Signs Nursing Flowsheet with Deterministic NEWS2 Clinical Score
  recordVitalFlowsheet(
    admissionId: string,
    data: {
      respiratoryRate: number;
      spo2Percent: number;
      onSupplementalOxygen: boolean;
      systolicBp: number;
      diastolicBp: number;
      pulseRate: number;
      consciousnessAvpu: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
      temperatureCelsius: number;
      nurseName: string;
    }
  ): NursingVitalFlowsheetEntry {
    const admission = this.admissions.get(admissionId);
    if (!admission) {
      throw new NotFoundException(`Admission ${admissionId} not found`);
    }

    let respScore = 0;
    if (data.respiratoryRate <= 8) respScore = 3;
    else if (data.respiratoryRate <= 11) respScore = 1;
    else if (data.respiratoryRate <= 20) respScore = 0;
    else if (data.respiratoryRate <= 24) respScore = 2;
    else respScore = 3;

    let spo2Score = 0;
    if (data.spo2Percent <= 91) spo2Score = 3;
    else if (data.spo2Percent <= 93) spo2Score = 2;
    else if (data.spo2Percent <= 95) spo2Score = 1;
    else spo2Score = 0;

    const o2Score = data.onSupplementalOxygen ? 2 : 0;

    let sbpScore = 0;
    if (data.systolicBp <= 90) sbpScore = 3;
    else if (data.systolicBp <= 100) sbpScore = 2;
    else if (data.systolicBp <= 110) sbpScore = 1;
    else if (data.systolicBp <= 219) sbpScore = 0;
    else sbpScore = 3;

    let pulseScore = 0;
    if (data.pulseRate <= 40) pulseScore = 3;
    else if (data.pulseRate <= 50) pulseScore = 1;
    else if (data.pulseRate <= 90) pulseScore = 0;
    else if (data.pulseRate <= 110) pulseScore = 1;
    else if (data.pulseRate <= 130) pulseScore = 2;
    else pulseScore = 3;

    const avpuScore = data.consciousnessAvpu === 'ALERT' ? 0 : 3;

    let tempScore = 0;
    if (data.temperatureCelsius <= 35.0) tempScore = 3;
    else if (data.temperatureCelsius <= 36.0) tempScore = 1;
    else if (data.temperatureCelsius <= 38.0) tempScore = 0;
    else if (data.temperatureCelsius <= 39.0) tempScore = 1;
    else tempScore = 2;

    const news2Score = respScore + spo2Score + o2Score + sbpScore + pulseScore + avpuScore + tempScore;
    const hasSingle3 = [respScore, spo2Score, sbpScore, pulseScore, avpuScore, tempScore].some((s) => s === 3);

    let clinicalRisk: NursingVitalFlowsheetEntry['clinicalRisk'] = 'LOW';
    let monitoringFrequencyEn = '12 hourly routine monitoring';
    let monitoringFrequencyKh = 'តាមដានរៀងរាល់ ១២ម៉ោងម្តង';

    if (news2Score >= 7) {
      clinicalRisk = 'HIGH_CRITICAL';
      monitoringFrequencyEn = 'Continuous monitoring & Emergency MET Call';
      monitoringFrequencyKh = 'តាមដានបន្តជាប់មិនឈប់ និងហៅក្រុមសង្គ្រោះបន្ទាន់ MET';
    } else if (news2Score >= 5 || hasSingle3) {
      clinicalRisk = 'MEDIUM';
      monitoringFrequencyEn = 'Minimum 1 hourly monitoring & urgent clinical review';
      monitoringFrequencyKh = 'តាមដានយ៉ាងតិចរៀងរាល់ ១ម៉ោងម្តង និងជូនដំណឹងគ្រូពេទ្យពិនិត្យបន្ទាន់';
    } else if (news2Score >= 1) {
      clinicalRisk = 'LOW_MEDIUM';
      monitoringFrequencyEn = '4-6 hourly monitoring';
      monitoringFrequencyKh = 'តាមដានរៀងរាល់ ៤ ទៅ ៦ម៉ោងម្តង';
    }

    const entry: NursingVitalFlowsheetEntry = {
      id: `vital-${Date.now()}`,
      admissionId,
      patientId: admission.patientId,
      recordedAt: new Date().toISOString(),
      recordedByNurse: data.nurseName,
      respiratoryRate: data.respiratoryRate,
      spo2Percent: data.spo2Percent,
      onSupplementalOxygen: data.onSupplementalOxygen,
      systolicBp: data.systolicBp,
      diastolicBp: data.diastolicBp,
      pulseRate: data.pulseRate,
      consciousnessAvpu: data.consciousnessAvpu,
      temperatureCelsius: data.temperatureCelsius,
      news2Score,
      clinicalRisk,
      monitoringFrequencyEn,
      monitoringFrequencyKh
    };

    const currentList = this.vitalRecords.get(admissionId) || [];
    currentList.unshift(entry);
    this.vitalRecords.set(admissionId, currentList);

    return entry;
  }

  getVitalFlowsheet(admissionId: string): NursingVitalFlowsheetEntry[] {
    return this.vitalRecords.get(admissionId) || [];
  }

  calculateIvDripRate(
    volumeMl: number,
    durationHours: number,
    dropFactorGttPerMl: number = 20,
  ): {
    flowRateMlPerHour: number;
    dripRateGttPerMin: number;
    totalDrops: number;
  } {
    if (volumeMl <= 0 || durationHours <= 0) {
      throw new BadRequestException('Volume and duration must be positive values');
    }

    const flowRateMlPerHour = Math.round((volumeMl / durationHours) * 10) / 10;
    const durationMinutes = durationHours * 60;
    const dripRateGttPerMin = Math.round((volumeMl * dropFactorGttPerMl) / durationMinutes);
    const totalDrops = volumeMl * dropFactorGttPerMl;

    return {
      flowRateMlPerHour,
      dripRateGttPerMin,
      totalDrops,
    };
  }
}
