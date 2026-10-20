import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { VisitStatus, InvoiceStatus, PrescriptionStatus } from '@prisma/client';

export interface PortalPatientProfile {
  id: string;
  patientCode: string;
  nameEn: string;
  nameKh?: string | null;
  gender: string;
  phone: string;
  bloodType?: string | null;
  allergies?: string | null;
  telegramChatId?: string | null;
}

export interface PortalQueueStatus {
  ticketCode: string;
  visitCode: string;
  status: VisitStatus;
  queuePosition: number;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  assignedDoctorName?: string | null;
  consultationRoom?: string;
  checkInTime: string;
}

export interface PortalPrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string | null;
}

export interface PortalPrescription {
  id: string;
  prescriptionCode: string;
  status: PrescriptionStatus;
  doctorName?: string | null;
  issuedAt: string;
  totalAmount: number;
  items: PortalPrescriptionItem[];
}

export interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  payableAmount: number;
  status: InvoiceStatus;
  paymentMethod: string;
  createdAt: string;
  khqrString?: string | null;
}

export interface PortalFullPatientResponse {
  patient: PortalPatientProfile;
  activeQueue?: PortalQueueStatus | null;
  prescriptions: PortalPrescription[];
  invoices: PortalInvoice[];
  clinic: {
    nameEn: string;
    nameKh: string;
    phone?: string | null;
    address?: string | null;
  };
}

export interface LiveClinicQueueSummary {
  currentlyServingTicket?: string | null;
  currentlyServingDoctor?: string | null;
  currentlyServingRoom?: string | null;
  totalWaitingCount: number;
  totalInConsultationCount: number;
  totalCompletedToday: number;
  averageWaitMinutes: number;
  lastUpdated: string;
}

export interface MedicationReminderInput {
  patientName: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  timeSlot: string; // e.g. 'Morning', 'Afternoon', 'Evening'
  clinicName?: string;
}

export interface FollowUpReminderInput {
  patientName: string;
  doctorName: string;
  clinicName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
}

export interface QueueTurnAlertInput {
  patientName: string;
  ticketCode: string;
  roomNumber: string;
  doctorName: string;
  clinicName: string;
}

export class PortalService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  /**
   * Search and retrieve sanitized patient portal data by patientCode, phone, or visitCode
   */
  async getPatientPortalData(identifier: string, tenantId?: string): Promise<PortalFullPatientResponse> {
    if (!identifier || !identifier.trim()) {
      throw new NotFoundException('Identifier required (patientCode, phone, or visitCode)');
    }

    const cleanId = identifier.trim();

    // 1. Try finding by patientCode, phone, or linked visitCode
    let patient = await this.prisma.patient.findFirst({
      where: {
        OR: [
          { patientCode: { equals: cleanId, mode: 'insensitive' } },
          { phone: cleanId },
          { visits: { some: { visitCode: { equals: cleanId, mode: 'insensitive' } } } },
        ],
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        tenant: true,
        visits: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            doctor: { select: { fullNameEn: true, fullNameKh: true } },
          },
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            doctor: { select: { fullNameEn: true, fullNameKh: true } },
            items: true,
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            transactions: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`No patient record found matching "${cleanId}"`);
    }

    // 2. Compute Active Queue Status if patient has visit today with status WAITING or IN_CONSULTATION
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeVisit = patient.visits.find(
      (v) =>
        (v.status === VisitStatus.WAITING || v.status === VisitStatus.IN_CONSULTATION) &&
        new Date(v.createdAt) >= today
    ) || patient.visits[0];

    let activeQueue: PortalQueueStatus | null = null;

    if (activeVisit) {
      const isStillActive =
        activeVisit.status === VisitStatus.WAITING ||
        activeVisit.status === VisitStatus.IN_CONSULTATION;

      let queuePosition = 1;
      let patientsAhead = 0;
      let estimatedWaitMinutes = 0;

      if (isStillActive) {
        // Count how many WAITING visits were created today before this visit
        const aheadCount = await this.prisma.visit.count({
          where: {
            status: VisitStatus.WAITING,
            createdAt: { gte: today, lt: activeVisit.createdAt },
            ...(patient.tenantId ? { tenantId: patient.tenantId } : {}),
          },
        });

        patientsAhead = aheadCount;
        queuePosition = aheadCount + 1;
        estimatedWaitMinutes = activeVisit.status === VisitStatus.IN_CONSULTATION ? 0 : Math.max(5, (aheadCount + 1) * 8);
      }

      const assignedDoctor = activeVisit.doctor?.fullNameEn || 'On-Duty Physician';
      const ticketSeq = activeVisit.visitCode ? activeVisit.visitCode.slice(-3) : '001';

      activeQueue = {
        ticketCode: `Q-${ticketSeq}`,
        visitCode: activeVisit.visitCode,
        status: activeVisit.status,
        queuePosition: isStillActive ? queuePosition : 0,
        patientsAhead: isStillActive ? patientsAhead : 0,
        estimatedWaitMinutes: isStillActive ? estimatedWaitMinutes : 0,
        assignedDoctorName: assignedDoctor,
        consultationRoom: 'Consultation Room 1',
        checkInTime: activeVisit.createdAt.toISOString(),
      };
    }

    // 3. Format Prescriptions (Sanitized)
    const formattedPrescriptions: PortalPrescription[] = patient.prescriptions.map((rx) => ({
      id: rx.id,
      prescriptionCode: rx.prescriptionCode,
      status: rx.status,
      doctorName: rx.doctor?.fullNameEn || null,
      issuedAt: rx.createdAt.toISOString(),
      totalAmount: Number(rx.totalAmount),
      items: (rx.items || []).map((it) => ({
        medicineName: it.medicineName,
        dosage: it.dosage,
        frequency: it.frequency,
        duration: it.duration,
        quantity: it.quantity,
        instructions: it.instructions || null,
      })),
    }));

    // 4. Format Invoices (Sanitized)
    const formattedInvoices: PortalInvoice[] = patient.invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: Number(inv.totalAmount),
      payableAmount: Number(inv.payableAmount),
      status: inv.status,
      paymentMethod: inv.paymentMethod,
      createdAt: inv.createdAt.toISOString(),
      khqrString: (inv as any).transactions?.[0]?.qrString || (inv as any).qrString || null,
    }));

    const clinic = {
      nameEn: patient.tenant?.clinicNameEn || 'Rotana Polyclinic & Medical Center',
      nameKh: patient.tenant?.clinicNameKh || 'មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ រតនា',
      phone: patient.tenant?.phonePrimary || '012 345 678',
      address: patient.tenant?.addressEn || 'Phnom Penh, Cambodia',
    };

    return {
      patient: {
        id: patient.id,
        patientCode: patient.patientCode,
        nameEn: patient.nameEn,
        nameKh: patient.nameKh,
        gender: patient.gender,
        phone: patient.phone,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
      },
      activeQueue,
      prescriptions: formattedPrescriptions,
      invoices: formattedInvoices,
      clinic,
    };
  }

  /**
   * Get clinic live queue overview (Public / Waiting Screen / Mini App)
   */
  async getLiveClinicQueue(tenantId?: string): Promise<LiveClinicQueueSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereBase: any = {
      createdAt: { gte: today },
    };
    if (tenantId) whereBase.tenantId = tenantId;

    const [currentlyServing, waitingCount, inConsultationCount, completedToday] = await Promise.all([
      this.prisma.visit.findFirst({
        where: { ...whereBase, status: VisitStatus.IN_CONSULTATION },
        orderBy: { updatedAt: 'desc' },
        include: {
          doctor: { select: { fullNameEn: true } },
        },
      }),
      this.prisma.visit.count({
        where: { ...whereBase, status: VisitStatus.WAITING },
      }),
      this.prisma.visit.count({
        where: { ...whereBase, status: VisitStatus.IN_CONSULTATION },
      }),
      this.prisma.visit.count({
        where: { ...whereBase, status: VisitStatus.COMPLETED },
      }),
    ]);

    const servingTicket = currentlyServing
      ? `Q-${currentlyServing.visitCode.slice(-3)}`
      : waitingCount > 0
      ? 'Next Up'
      : 'Queue Clear';

    return {
      currentlyServingTicket: servingTicket,
      currentlyServingDoctor: currentlyServing?.doctor?.fullNameEn || 'General Practitioner',
      currentlyServingRoom: 'Consultation Room 1',
      totalWaitingCount: waitingCount,
      totalInConsultationCount: inConsultationCount,
      totalCompletedToday: completedToday,
      averageWaitMinutes: 8,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Format medication dosage reminder message (Khmer & English, ZERO EMOJIS)
   */
  formatMedicationReminder(input: MedicationReminderInput): string {
    const clinic = input.clinicName || 'ClinicOS Medical Care';
    return [
      `[ការរំលឹកលេបថ្នាំ] ${clinic}`,
      `ជូនចំពោះ៖ ${input.patientName}`,
      `ពេល៖ ${input.timeSlot}`,
      `---------------------------------`,
      `ឈ្មោះថ្នាំ៖ ${input.medicineName}`,
      `កម្រិតប្រើប្រាស់៖ ${input.dosage}`,
      `កាលវិភាគ៖ ${input.frequency}`,
      input.instructions ? `ការណែនាំបន្ថែម៖ ${input.instructions}` : null,
      `---------------------------------`,
      `[Medication Reminder]`,
      `Patient: ${input.patientName}`,
      `Drug: ${input.medicineName} (${input.dosage})`,
      `Schedule: ${input.frequency}`,
      input.instructions ? `Instructions: ${input.instructions}` : null,
      `Please adhere strictly to your prescribed dosage schedule.`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Format follow-up appointment reminder message (Khmer & English, ZERO EMOJIS)
   */
  formatFollowUpReminder(input: FollowUpReminderInput): string {
    return [
      `[ការរំលឹកការណាត់ជួបពិគ្រោះបន្ត] ${input.clinicName}`,
      `ជូនចំពោះអ្នកជំងឺ៖ ${input.patientName}`,
      `កាលបរិច្ឆេទ៖ ${input.appointmentDate} វេលាម៉ោង ${input.appointmentTime}`,
      `វេជ្ជបណ្ឌិតទទួលបន្ទុក៖ Dr. ${input.doctorName}`,
      input.reason ? `គោលបំណង៖ ${input.reason}` : null,
      `---------------------------------`,
      `[Appointment Recall Notice]`,
      `Clinic: ${input.clinicName}`,
      `Patient: ${input.patientName}`,
      `Date & Time: ${input.appointmentDate} at ${input.appointmentTime}`,
      `Physician: Dr. ${input.doctorName}`,
      `Please arrive 10 minutes prior to your scheduled consultation.`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Format instant queue turn call alert (Khmer & English, ZERO EMOJIS)
   */
  formatQueueTurnAlert(input: QueueTurnAlertInput): string {
    return [
      `[ជូនដំណឹងដល់វេនពិនិត្យ] ${input.clinicName}`,
      `លេខសំបុត្រ៖ ${input.ticketCode}`,
      `អ្នកជំងឺ៖ ${input.patientName}`,
      `សូមអញ្ជើញចូលបន្ទប់ពិគ្រោះ៖ ${input.roomNumber}`,
      `ជួបជាមួយ៖ Dr. ${input.doctorName}`,
      `---------------------------------`,
      `[Queue Turn Alert]`,
      `Ticket: ${input.ticketCode}`,
      `Patient: ${input.patientName}`,
      `Room: ${input.roomNumber}`,
      `Physician: Dr. ${input.doctorName}`,
      `Please proceed to the consultation room now.`,
    ]
      .filter(Boolean)
      .join('\n');
  }
}

Injectable()(PortalService);
