import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { InvoiceStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

// Load the production khqr-helper engine (pay-helper)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const khqr = require('D:/WEB Development/Rotana-payway-bridge/KhqrDeeplink-headless-bridge/packages/khqr-helper/dist/index.cjs');

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async generateInvoiceKhqr(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: {
          select: { id: true, nameEn: true, nameKh: true, phone: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('This invoice is already settled/paid.');
    }

    const bakongId = this.configService.get<string>('BAKONG_ACCOUNT_ID') || 'rotana_clinic@aba';
    const merchantName = this.configService.get<string>('BAKONG_MERCHANT_NAME') || 'Rotana Clinic';
    const merchantCity = this.configService.get<string>('BAKONG_MERCHANT_CITY') || 'Phnom Penh';
    const amount = Number(invoice.payableAmount);
    const currency = (invoice.currency as 'USD' | 'KHR') || 'USD';

    // Generate Tag 01=12 Dynamic KHQR string using khqr-helper
    const khqrResult = khqr.buildKhqr({
      bakongId,
      merchantName,
      merchantCity,
      amount,
      currency,
      billNumber: invoice.invoiceNumber,
    });

    const paywayLink =
      this.configService.get<string>('PAYWAY_PAYMENT_URL') ||
      'https://link.payway.com.kh/ABAPAYCK539089j';

    // Build universal mobile deep links (ABA Mobile, Bakong, etc.)
    const deeplinks = khqr.buildBankDeeplinks(khqrResult.qrString);
    if (deeplinks.aba) {
      deeplinks.aba.paywayLink = paywayLink;
    }
    (deeplinks as any).paywayUrl = paywayLink;

    const tranId = `TXN-${invoice.invoiceNumber}-${Date.now()}`;

    // Atomically persist transaction in database
    const transaction = await this.prisma.$transaction(async (tx) => {
      // Create payment transaction
      const txn = await tx.paymentTransaction.create({
        data: {
          invoiceId: invoice.id,
          tranId,
          qrString: khqrResult.qrString,
          md5: khqrResult.md5,
          currency,
          amount: invoice.payableAmount,
          status: PaymentStatus.PENDING,
          paywayLink,
          deeplinkUrl: paywayLink,
          metadata: {
            deeplinks,
            paywayUrl: paywayLink,
            generatedAt: new Date().toISOString(),
          },
        },
      });

      // Update invoice status to PENDING
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.PENDING,
          paymentMethod: PaymentMethod.KHQR,
        },
      });

      return txn;
    });

    return {
      success: true,
      invoiceNumber: invoice.invoiceNumber,
      tranId: transaction.tranId,
      qrString: transaction.qrString,
      paywayLink,
      md5: transaction.md5,
      amount,
      currency,
      deeplinks: {
        ...deeplinks,
        paywayUrl: paywayLink,
      },
      patient: invoice.patient,
      expiresInSeconds: 300, // 5 minutes validity
    };
  }

  async settleTransaction(tranId: string, cashierId?: string) {
    const txn = await this.prisma.paymentTransaction.findUnique({
      where: { tranId },
      include: {
        invoice: {
          include: { patient: true },
        },
      },
    });

    if (!txn) {
      throw new NotFoundException(`Payment transaction with ID ${tranId} not found`);
    }

    if (txn.status === PaymentStatus.SUCCESS) {
      return {
        alreadySettled: true,
        message: 'Transaction was already settled.',
        transaction: txn,
      };
    }

    const now = new Date();

    const settled = await this.prisma.$transaction(async (tx) => {
      const updatedTxn = await tx.paymentTransaction.update({
        where: { id: txn.id },
        data: {
          status: PaymentStatus.SUCCESS,
          verifiedAt: now,
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: txn.invoiceId },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: now,
          cashierId: cashierId || txn.invoice.cashierId,
        },
      });

      // Audit log entry for financial compliance
      await tx.auditLog.create({
        data: {
          userId: cashierId,
          action: 'KHQR_PAYMENT_SETTLED',
          entity: 'INVOICE',
          entityId: txn.invoiceId,
          details: {
            tranId,
            amount: Number(txn.amount),
            currency: txn.currency,
            md5: txn.md5,
            settledAt: now.toISOString(),
          },
        },
      });

      return {
        transaction: updatedTxn,
        invoice: updatedInvoice,
      };
    });

    return {
      success: true,
      message: 'Payment settled successfully.',
      invoiceNumber: settled.invoice.invoiceNumber,
      amount: Number(settled.transaction.amount),
      currency: settled.transaction.currency,
      paidAt: now,
    };
  }

  async checkStatus(tranId: string) {
    const txn = await this.prisma.paymentTransaction.findUnique({
      where: { tranId },
      include: { invoice: true },
    });

    if (!txn) {
      throw new NotFoundException(`Transaction ${tranId} not found`);
    }

    return {
      tranId: txn.tranId,
      status: txn.status,
      invoiceStatus: txn.invoice.status,
      verifiedAt: txn.verifiedAt,
      amount: Number(txn.amount),
      currency: txn.currency,
    };
  }

  async findAllInvoices(params?: { status?: InvoiceStatus; patientId?: string }) {
    return this.prisma.invoice.findMany({
      where: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.patientId ? { patientId: params.patientId } : {}),
      },
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
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        visit: {
          include: {
            doctor: {
              select: { id: true, fullNameEn: true, fullNameKh: true },
            },
          },
        },
        cashier: {
          select: { id: true, fullNameEn: true, fullNameKh: true },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }
}
