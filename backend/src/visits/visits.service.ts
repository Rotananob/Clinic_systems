import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVitalsDto } from './dto/update-vitals.dto';
import { VisitStatus, InvoiceStatus, PaymentMethod } from '@prisma/client';

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
        consultationFee: createVisitDto.consultationFee || 5.00,
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

  async completeVisit(
    id: string,
    data: {
      diagnosis: string;
      notes?: string;
      doctorId?: string;
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

      // 2. Generate Consultation Fee Invoice if requested and not yet generated
      if (data.createConsultationInvoice !== false) {
        const existingInvoice = await tx.invoice.findFirst({
          where: { visitId: id },
        });

        if (!existingInvoice) {
          const invoiceNumber = await this.generateNextInvoiceNumber();
          const fee = Number(visit.consultationFee) || 5.00;

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
}
