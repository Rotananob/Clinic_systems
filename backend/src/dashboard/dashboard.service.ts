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
      todayFollowUpsCount,
      upcoming7DaysFollowUpsCount,
      totalDocumentsCount,
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
      this.prisma.visit.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { nameEn: true, patientCode: true } },
          doctor: { select: { fullNameEn: true } },
        },
      }),
      this.prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { nameEn: true } },
        },
      }),
    ]);

    const revenueUsd = todayPaidInvoices
      .filter((inv) => inv.currency === 'USD')
      .reduce((sum, inv) => sum + Number(inv.payableAmount), 0);

    const revenueKhr = todayPaidInvoices
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
      },
      recentActivity: {
        visits: recentVisits,
        invoices: recentInvoices,
      },
    };
  }
}
