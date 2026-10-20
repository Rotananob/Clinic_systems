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

export class IpdService {
  private beds: Map<string, Bed> = new Map();
  private admissions: Map<string, InpatientAdmission> = new Map();
  private emarRecords: Map<string, MedicationAdminRecord[]> = new Map();
  private fluidRecords: Map<string, FluidBalanceRecord[]> = new Map();

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
        wardNameKh: 'អគារជំងឺទូទៅ (General Ward)',
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
        wardNameKh: 'អគារជំងឺទូទៅ (General Ward)',
        wardNameEn: 'General Medical Ward',
        dailyRateUsd: 25.0,
        status: 'AVAILABLE',
      },
      {
        id: 'bed-103',
        bedNumber: 'MED-B3',
        ward: 'WARD_GENERAL_MED',
        wardNameKh: 'អគារជំងឺទូទៅ (General Ward)',
        wardNameEn: 'General Medical Ward',
        dailyRateUsd: 25.0,
        status: 'CLEANING_REQUIRED',
      },
      {
        id: 'bed-201',
        bedNumber: 'SURG-B1',
        ward: 'WARD_SURGICAL',
        wardNameKh: 'អគារសង្គ្រោះក្រោយវះកាត់ (Surgical Post-Op)',
        wardNameEn: 'Surgical Recovery Ward',
        dailyRateUsd: 45.0,
        status: 'AVAILABLE',
      },
      {
        id: 'bed-202',
        bedNumber: 'SURG-B2',
        ward: 'WARD_SURGICAL',
        wardNameKh: 'អគារសង្គ្រោះក្រោយវះកាត់ (Surgical Post-Op)',
        wardNameEn: 'Surgical Recovery Ward',
        dailyRateUsd: 45.0,
        status: 'AVAILABLE',
      },
      {
        id: 'bed-301',
        bedNumber: 'MAT-B1',
        ward: 'WARD_MATERNITY',
        wardNameKh: 'អគារសម្ភព និងទារក (Maternity Suite)',
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
      wardNameKh: 'អគារជំងឺទូទៅ (General Ward)',
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
  }

  // Get all beds in clinic with occupancy stats
  getBeds(ward?: WardCode, status?: BedStatus): Bed[] {
    let list = Array.from(this.beds.values());
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
    if (bed.status !== 'AVAILABLE') {
      throw new BadRequestException(`Bed ${bed.bedNumber} is currently ${bed.status} and cannot be assigned`);
    }

    const timestampStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900).toString();
    const admissionNumber = `IPD-${timestampStr}-${randSuffix}`;
    const cleanPt = data.patientId.replace(/[^a-zA-Z0-9]/g, '');
    const wristbandBarcode = `WB-${cleanPt}-${timestampStr}`;
    const admissionId = `adm-${Date.now()}`;

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
