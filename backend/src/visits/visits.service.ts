import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVitalsDto } from './dto/update-vitals.dto';
import { VisitStatus, InvoiceStatus, PaymentMethod, PrescriptionStatus } from '@prisma/client';
import { SoapNoteStructure } from './voice-medical-nlp.service';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  private async generateNextVisitCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.visit.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `VST-${year}-${sequence}`;
  }

  private async generateNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `INV-${year}-${sequence}`;
  }

  async create(createVisitDto: CreateVisitDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: createVisitDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient not found with ID ${createVisitDto.patientId}`);
    }

    const visitCode = await this.generateNextVisitCode();

    return this.prisma.visit.create({
      data: {
        visitCode,
        patientId: createVisitDto.patientId,
        doctorId: createVisitDto.doctorId,
        reason: createVisitDto.reason,
        symptoms: createVisitDto.symptoms,
        bloodPressure: createVisitDto.bloodPressure,
        heartRate: createVisitDto.heartRate,
        temperature: createVisitDto.temperature,
        weightKg: createVisitDto.weightKg,
        heightCm: createVisitDto.heightCm,
        consultationFee: createVisitDto.consultationFee || 5.0,
        status: VisitStatus.WAITING,
      },
      include: {
        patient: true,
        doctor: {
          select: { id: true, fullNameEn: true, fullNameKh: true, role: true },
        },
      },
    });
  }

  async findAll(query?: { status?: VisitStatus; patientId?: string; doctorId?: string }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.patientId) where.patientId = query.patientId;
    if (query?.doctorId) where.doctorId = query.doctorId;

    return this.prisma.visit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: { id: true, patientCode: true, nameEn: true, nameKh: true, phone: true, gender: true },
        },
        doctor: {
          select: { id: true, fullNameEn: true, fullNameKh: true },
        },
        medicalRecord: true,
        prescriptions: {
          include: {
            items: true,
          },
        },
        invoices: true,
      },
    });
  }

  async findOne(id: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          select: { id: true, fullNameEn: true, fullNameKh: true, role: true },
        },
        medicalRecord: true,
        prescriptions: {
          include: {
            items: true,
          },
        },
        invoices: {
          include: {
            transactions: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException(`Visit with ID ${id} not found`);
    }

    return visit;
  }

  async updateVitals(id: string, vitalsDto: UpdateVitalsDto) {
    await this.findOne(id);

    return this.prisma.visit.update({
      where: { id },
      data: {
        bloodPressure: vitalsDto.bloodPressure,
        heartRate: vitalsDto.heartRate,
        temperature: vitalsDto.temperature,
        weightKg: vitalsDto.weightKg,
        heightCm: vitalsDto.heightCm,
      },
    });
  }

  async updateStatus(id: string, status: VisitStatus) {
    await this.findOne(id);

    return this.prisma.visit.update({
      where: { id },
      data: { status },
      include: {
        patient: {
          select: { id: true, patientCode: true, nameEn: true, nameKh: true, phone: true, gender: true },
        },
        doctor: {
          select: { id: true, fullNameEn: true, fullNameKh: true },
        },
      },
    });
  }

  async completeVisit(
    id: string,
    data: {
      diagnosis: string;
      notes?: string;
      doctorId?: string;
      physicalExam?: string;
      assessment?: string;
      treatmentPlan?: string;
      createConsultationInvoice?: boolean;
    },
  ) {
    const visit = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // 1. Update visit details and mark COMPLETED
      const updatedVisit = await tx.visit.update({
        where: { id },
        data: {
          diagnosis: data.diagnosis,
          notes: data.notes,
          doctorId: data.doctorId || visit.doctorId,
          status: VisitStatus.COMPLETED,
        },
      });

      // 2. Upsert comprehensive clinical medical record
      if (data.physicalExam || data.assessment || data.treatmentPlan || data.notes) {
        await tx.medicalRecord.upsert({
          where: { visitId: id },
          create: {
            visitId: id,
            patientId: visit.patientId,
            physicalExam: data.physicalExam,
            assessment: data.assessment,
            treatmentPlan: data.treatmentPlan,
            notes: data.notes,
          },
          update: {
            physicalExam: data.physicalExam,
            assessment: data.assessment,
            treatmentPlan: data.treatmentPlan,
            notes: data.notes,
          },
        });
      }

      // 3. Generate Consultation Fee Invoice if requested and not yet generated
      if (data.createConsultationInvoice !== false) {
        const existingInvoice = await tx.invoice.findFirst({
          where: { visitId: id },
        });

        if (!existingInvoice) {
          const invoiceNumber = await this.generateNextInvoiceNumber();
          const fee = Number(visit.consultationFee) || 5.0;

          await tx.invoice.create({
            data: {
              invoiceNumber,
              visitId: id,
              patientId: visit.patientId,
              totalAmount: fee,
              discount: 0,
              payableAmount: fee,
              currency: 'USD',
              status: InvoiceStatus.UNPAID,
              paymentMethod: PaymentMethod.KHQR,
            },
          });
        }
      }

      return updatedVisit;
    });
  }

  async applySoapToVisit(id: string, soap: SoapNoteStructure, doctorId?: string) {
    const visit = await this.findOne(id);
    const vitals = soap.objective.vitals;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update visit vitals, symptoms, diagnosis
      const updatedVisit = await tx.visit.update({
        where: { id },
        data: {
          symptoms: soap.subjective.symptoms.join(', ') || visit.symptoms,
          reason: soap.subjective.chiefComplaint || visit.reason,
          diagnosis: soap.assessment.primaryDiagnosis || visit.diagnosis,
          bloodPressure: vitals.bloodPressure || visit.bloodPressure,
          heartRate: vitals.heartRate || visit.heartRate,
          temperature: vitals.temperature || visit.temperature,
          weightKg: vitals.weightKg || visit.weightKg,
          heightCm: vitals.heightCm || visit.heightCm,
          doctorId: doctorId || visit.doctorId,
          status: VisitStatus.IN_CONSULTATION,
        },
      });

      // 2. Upsert MedicalRecord
      const physicalExam = soap.objective.physicalExamFindings.join('; ');
      const assessmentText = `${soap.assessment.primaryDiagnosis} (ICD-11: ${soap.assessment.icd11Code || 'N/A'}, ICD-10: ${soap.assessment.icd10Code || 'N/A'}) - Severity: ${soap.assessment.severity || 'MILD'}`;
      const treatmentPlan = soap.plan.treatmentAdvice.join('; ');

      await tx.medicalRecord.upsert({
        where: { visitId: id },
        create: {
          visitId: id,
          patientId: visit.patientId,
          physicalExam: physicalExam || null,
          assessment: assessmentText,
          treatmentPlan: treatmentPlan || null,
          notes: soap.formattedSoapKhmer,
        },
        update: {
          physicalExam: physicalExam || null,
          assessment: assessmentText,
          treatmentPlan: treatmentPlan || null,
          notes: soap.formattedSoapKhmer,
        },
      });

      // 3. If prescriptions are present, generate a draft prescription
      if (soap.plan.prescriptions && soap.plan.prescriptions.length > 0) {
        const year = new Date().getFullYear();
        const count = await tx.prescription.count();
        const prescriptionCode = `RX-${year}-${(count + 1).toString().padStart(4, '0')}`;

        const createdRx = await tx.prescription.create({
          data: {
            prescriptionCode,
            visitId: id,
            patientId: visit.patientId,
            doctorId: doctorId || visit.doctorId || (visit as any).doctor?.id,
            status: PrescriptionStatus.PENDING,
            notes: soap.plan.treatmentAdvice.join('; '),
            items: {
              create: soap.plan.prescriptions.map((rx) => ({
                medicineName: rx.medicineName,
                dosage: rx.dosage,
                quantity: rx.quantity,
                route: rx.route,
                frequency: rx.frequency,
                duration: `${rx.durationDays} days`,
                instructions: rx.instructions,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        return {
          ...updatedVisit,
          medicalRecord: { physicalExam, assessment: assessmentText, treatmentPlan },
          prescription: createdRx,
        };
      }

      return updatedVisit;
    });
  }
}
