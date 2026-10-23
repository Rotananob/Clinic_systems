import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VisitStatus, PrescriptionStatus, InvoiceStatus, FollowUpStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    const [
      totalPatients,
      todayVisitsCount,
      waitingVisitsCount,
      inConsultationVisitsCount,
      completedVisitsToday,
      pendingPrescriptionsCount,
      dispensedPrescriptionsCount,
      todayPaidInvoices,
      allUnpaidInvoices,
      todayFollowUpsCount,
      upcoming7DaysFollowUpsCount,
      totalDocumentsCount,
      activeQueue,
      pendingInvoices,
      todayFollowUpsList,
      recentVisits,
      recentInvoices,
    ] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.visit.count({
        where: {
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      this.prisma.visit.count({
        where: { status: VisitStatus.WAITING },
      }),
      this.prisma.visit.count({
        where: { status: VisitStatus.IN_CONSULTATION },
      }),
      this.prisma.visit.count({
        where: {
          status: VisitStatus.COMPLETED,
          updatedAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      this.prisma.prescription.count({
        where: { status: PrescriptionStatus.PENDING },
      }),
      this.prisma.prescription.count({
        where: { status: PrescriptionStatus.DISPENSED },
      }),
      this.prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.PAID,
          paidAt: { gte: startOfToday, lte: endOfToday },
        },
        select: {
          payableAmount: true,
          currency: true,
          paymentMethod: true,
        },
      }),
      this.prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.UNPAID,
        },
        select: {
          payableAmount: true,
          currency: true,
        },
      }),
      this.prisma.followUp.count({
        where: {
          status: FollowUpStatus.SCHEDULED,
          scheduledDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      this.prisma.followUp.count({
        where: {
          status: FollowUpStatus.SCHEDULED,
          scheduledDate: { gte: startOfToday, lte: next7Days },
        },
      }),
      this.prisma.document.count(),
      // 1. Live Active Queue for the Waiting Room
      this.prisma.visit.findMany({
        where: {
          status: { in: [VisitStatus.WAITING, VisitStatus.IN_CONSULTATION] },
        },
        orderBy: { createdAt: 'asc' },
        take: 12,
        include: {
          patient: {
            select: {
              id: true,
              patientCode: true,
              nameEn: true,
              nameKh: true,
              gender: true,
              phone: true,
              dob: true,
              bloodType: true,
            },
          },
          doctor: {
            select: {
              id: true,
              fullNameEn: true,
              fullNameKh: true,
            },
          },
        },
      }),
      // 2. Real Pending Invoices Needing Cashier Settlement
      this.prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.UNPAID,
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          patient: {
            select: {
              id: true,
              patientCode: true,
              nameEn: true,
              nameKh: true,
              phone: true,
            },
          },
          visit: {
            select: {
              id: true,
              visitCode: true,
              reason: true,
            },
          },
        },
      }),
      // 3. Real Today Follow-up Appointments
      this.prisma.followUp.findMany({
        where: {
          status: FollowUpStatus.SCHEDULED,
          scheduledDate: { gte: startOfToday, lte: endOfToday },
        },
        orderBy: { scheduledDate: 'asc' },
        take: 8,
        include: {
          patient: {
            select: {
              id: true,
              patientCode: true,
              nameEn: true,
              nameKh: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              id: true,
              fullNameEn: true,
              fullNameKh: true,
            },
          },
        },
      }),
      // 4. Recent Visits with complete bilingual names
      this.prisma.visit.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, nameEn: true, nameKh: true, patientCode: true } },
          doctor: { select: { id: true, fullNameEn: true, fullNameKh: true } },
        },
      }),
      // 5. Recent Invoices with complete bilingual names
      this.prisma.invoice.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, nameEn: true, nameKh: true, patientCode: true } },
        },
      }),
    ]);

    const revenueUsd = todayPaidInvoices
      .filter((inv) => inv.currency === 'USD')
      .reduce((sum, inv) => sum + Number(inv.payableAmount), 0);

    const revenueKhr = todayPaidInvoices
      .filter((inv) => inv.currency === 'KHR')
      .reduce((sum, inv) => sum + Number(inv.payableAmount), 0);

    const cashRevenueUsd = todayPaidInvoices
      .filter((inv) => inv.currency === 'USD' && inv.paymentMethod === 'CASH')
      .reduce((sum, inv) => sum + Number(inv.payableAmount), 0);

    const khqrRevenueUsd = todayPaidInvoices
      .filter((inv) => inv.currency === 'USD' && inv.paymentMethod === 'KHQR')
      .reduce((sum, inv) => sum + Number(inv.payableAmount), 0);

    const unpaidTotalUsd = allUnpaidInvoices
      .filter((inv) => inv.currency === 'USD')
      .reduce((sum, inv) => sum + Number(inv.payableAmount), 0);

    const unpaidTotalKhr = allUnpaidInvoices
      .filter((inv) => inv.currency === 'KHR')
      .reduce((sum, inv) => sum + Number(inv.payableAmount), 0);

    return {
      totalPatients,
      todayVisits: todayVisitsCount,
      queueStatus: {
        waiting: waitingVisitsCount,
        inConsultation: inConsultationVisitsCount,
        completedToday: completedVisitsToday,
      },
      pharmacy: {
        pendingPrescriptions: pendingPrescriptionsCount,
        dispensedTotal: dispensedPrescriptionsCount,
      },
      followUps: {
        todayScheduled: todayFollowUpsCount,
        upcoming7Days: upcoming7DaysFollowUpsCount,
      },
      documents: {
        total: totalDocumentsCount,
      },
      revenueToday: {
        usd: revenueUsd,
        khr: revenueKhr,
        paidInvoicesCount: todayPaidInvoices.length,
        cashUsd: cashRevenueUsd,
        khqrUsd: khqrRevenueUsd,
        unpaidCount: allUnpaidInvoices.length,
        unpaidUsd: unpaidTotalUsd,
        unpaidKhr: unpaidTotalKhr,
      },
      activeQueue,
      pendingInvoices,
      todayFollowUpsList,
      recentActivity: {
        visits: recentVisits,
        invoices: recentInvoices,
      },
    };
  }
}
