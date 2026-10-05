import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionStatus, InvoiceStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  private async generateNextPrescriptionCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.prescription.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `RX-${year}-${sequence}`;
  }

  private async generateNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `INV-${year}-${sequence}`;
  }

  async create(doctorId: string, dto: CreatePrescriptionDto) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: dto.visitId },
    });

    if (!visit) {
      throw new NotFoundException(`Visit with ID ${dto.visitId} not found`);
    }

    const prescriptionCode = await this.generateNextPrescriptionCode();

    const itemsWithSubtotal = dto.items.map((item) => {
      const subtotal = Number((item.quantity * item.unitPrice).toFixed(2));
      return {
        medicineName: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal,
        instructions: item.instructions,
      };
    });

    const totalAmount = itemsWithSubtotal.reduce((acc, curr) => acc + curr.subtotal, 0);

    return this.prisma.prescription.create({
      data: {
        prescriptionCode,
        visitId: visit.id,
        patientId: visit.patientId,
        doctorId,
        status: PrescriptionStatus.PENDING,
        totalAmount,
        notes: dto.notes,
        items: {
          create: itemsWithSubtotal,
        },
      },
      include: {
        items: true,
        patient: { select: { id: true, nameEn: true, nameKh: true, phone: true } },
        doctor: { select: { id: true, fullNameEn: true, fullNameKh: true } },
      },
    });
  }

  async findAll(status?: PrescriptionStatus) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.prescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        patient: { select: { id: true, nameEn: true, nameKh: true, phone: true, patientCode: true } },
        doctor: { select: { id: true, fullNameEn: true, fullNameKh: true } },
        visit: { select: { id: true, visitCode: true } },
      },
    });
  }

  async findOne(id: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        patient: true,
        doctor: { select: { id: true, fullNameEn: true, fullNameKh: true } },
        visit: true,
      },
    });

    if (!rx) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }

    return rx;
  }

  async dispense(id: string, cashierId?: string) {
    const rx = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark prescription as DISPENSED
      const updatedRx = await tx.prescription.update({
        where: { id },
        data: { status: PrescriptionStatus.DISPENSED },
      });

      // 2. Automatically generate Invoice for the pharmacy medication total
      const total = Number(rx.totalAmount);
      if (total > 0) {
        const invoiceNumber = await this.generateNextInvoiceNumber();
        await tx.invoice.create({
          data: {
            invoiceNumber,
            visitId: rx.visitId,
            patientId: rx.patientId,
            totalAmount: total,
            discount: 0,
            payableAmount: total,
            currency: 'USD',
            status: InvoiceStatus.UNPAID,
            paymentMethod: PaymentMethod.KHQR,
            cashierId,
          },
        });
      }

      return updatedRx;
    });
  }
}
