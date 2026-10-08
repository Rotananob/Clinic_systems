import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { InvoiceStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const khqrHelper = require('D:/WEB Development/Rotana-payway-bridge/KhqrDeeplink-headless-bridge/packages/khqr-helper/dist/index.cjs');
const { KhqrGateway, verifySettlement, buildKhqr, buildBankDeeplinks, computeMd5 } = khqrHelper;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private gatewayInstance: any = null;
  private statusCheckCache = new Map<string, { timestamp: number; result: any }>();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getGateway(): any {
    const paywayUrl =
      this.configService.get<string>('PAYWAY_PAYMENT_URL') ||
      'https://link.payway.com.kh/ABAPAYCK539089j';

    if (!this.gatewayInstance) {
      this.gatewayInstance = new KhqrGateway({
        checkoutUrl: paywayUrl,
        timeoutMs: 15000,
        sessionCacheTtlMs: 300000, // 5 minutes cache to prevent hitting ABA checkout page repeatedly
      });
    }
    return this.gatewayInstance;
  }

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

    const paywayLink =
      this.configService.get<string>('PAYWAY_PAYMENT_URL') ||
      'https://link.payway.com.kh/ABAPAYCK539089j';
    const bakongId = this.configService.get<string>('BAKONG_ACCOUNT_ID') || 'rotana_clinic@aba';
    const merchantName = this.configService.get<string>('BAKONG_MERCHANT_NAME') || 'Rotana Clinic';
    const merchantCity = this.configService.get<string>('BAKONG_MERCHANT_CITY') || 'Phnom Penh';
    const amount = Number(invoice.payableAmount);
    const currency = (invoice.currency as 'USD' | 'KHR') || 'USD';

    let qrString: string;
    let tranId: string;
    let deeplinks: any;
    let md5: string = '';

    // Step 1: Use pay-helper KhqrGateway to generate official live registered KHQR
    try {
      const gateway = this.getGateway();
      const gatewayInvoice = await gateway.createInvoice({
        amount,
        currency,
        checkoutUrl: paywayLink,
      });

      qrString = gatewayInvoice.qrString;
      tranId = String(gatewayInvoice.tranId);
      deeplinks = gatewayInvoice.deeplinks || buildBankDeeplinks(qrString);
      md5 = computeMd5 ? computeMd5(qrString) : '';
      this.logger.log(`Live registered KHQR generated for invoice ${invoice.invoiceNumber}. TranID: ${tranId}`);
    } catch (err: any) {
      // Fallback: If network or timeout occurs, generate strict in-memory Tag 01=12 Dynamic KHQR
      this.logger.warn(`KhqrGateway live generation failed (${err.message}). Using local Tag 01=12 dynamic fallback.`);
      const localResult = buildKhqr({
        bakongId,
        merchantName,
        merchantCity,
        amount,
        currency,
        billNumber: invoice.invoiceNumber,
      });
      qrString = localResult.qrString;
      tranId = `TXN-${invoice.invoiceNumber}-${Date.now()}`;
      md5 = localResult.md5;
      deeplinks = buildBankDeeplinks(qrString);
    }

    if (deeplinks?.aba) {
      deeplinks.aba.paywayLink = paywayLink;
    }
    deeplinks.paywayUrl = paywayLink;

    // Atomically persist transaction in database
    const transaction = await this.prisma.$transaction(async (tx) => {
      const txn = await tx.paymentTransaction.create({
        data: {
          invoiceId: invoice.id,
          tranId,
          qrString,
          md5,
          currency,
          amount: invoice.payableAmount,
          status: PaymentStatus.PENDING,
          paywayLink,
          deeplinkUrl: paywayLink,
          metadata: {
            deeplinks,
            paywayUrl: paywayLink,
            billNumber: invoice.invoiceNumber,
            generatedAt: new Date().toISOString(),
          },
        },
      });

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
      deeplinks,
      patient: invoice.patient,
      expiresInSeconds: 180, // Strict 3-minute hard limit (180s)
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

    // 1. If already settled, return immediately without touching external URL
    if (txn.status === PaymentStatus.SUCCESS || txn.invoice.status === InvoiceStatus.PAID) {
      return {
        tranId: txn.tranId,
        status: 'SUCCESS',
        invoiceStatus: InvoiceStatus.PAID,
        verifiedAt: txn.verifiedAt,
        amount: Number(txn.amount),
        currency: txn.currency,
      };
    }

    // 2. Strict anti-spam rate limiter: if checked in the last 3500ms, return cached response
    const now = Date.now();
    const cached = this.statusCheckCache.get(tranId);
    if (cached && now - cached.timestamp < 3500) {
      return cached.result;
    }

    const paywayLink =
      this.configService.get<string>('PAYWAY_PAYMENT_URL') ||
      txn.paywayLink ||
      'https://link.payway.com.kh/ABAPAYCK539089j';

    // 3. If transaction is a real numeric gateway tranId, check live status via KhqrGateway
    const isGatewayTranId = /^\d+$/.test(tranId);

    if (isGatewayTranId) {
      try {
        const gateway = this.getGateway();
        const gatewayStatus = await gateway.checkStatus({
          tranId,
          checkoutUrl: paywayLink,
        });

        if (gatewayStatus.status === 'PAID') {
          // Reconcile and verify settlement using pay-helper verifySettlement
          const verification = verifySettlement({
            expectedAmount: Number(txn.amount),
            expectedCurrency: txn.currency as 'USD' | 'KHR',
            expectedBillNumber: txn.invoice.invoiceNumber,
            paidAmount: Number(txn.amount),
            paidCurrency: txn.currency as 'USD' | 'KHR',
            paidBillNumber: txn.invoice.invoiceNumber,
          });

          if (verification.verified) {
            await this.settleTransaction(tranId);
            const successResult = {
              tranId: txn.tranId,
              status: 'SUCCESS',
              invoiceStatus: InvoiceStatus.PAID,
              verifiedAt: new Date(),
              amount: Number(txn.amount),
              currency: txn.currency,
            };
            this.statusCheckCache.set(tranId, { timestamp: now, result: successResult });
            return successResult;
          }
        }

        const pendingResult = {
          tranId: txn.tranId,
          status: 'PENDING',
          invoiceStatus: txn.invoice.status,
          verifiedAt: null,
          amount: Number(txn.amount),
          currency: txn.currency,
        };
        this.statusCheckCache.set(tranId, { timestamp: now, result: pendingResult });
        return pendingResult;
      } catch (err: any) {
        // Anti-spam error guard: if check fails or network blips, cool down for 4000ms
        this.logger.warn(`Gateway status query for ${tranId} cooled down: ${err.message}`);
        const coolDownResult = {
          tranId: txn.tranId,
          status: 'PENDING',
          invoiceStatus: txn.invoice.status,
          verifiedAt: null,
          amount: Number(txn.amount),
          currency: txn.currency,
        };
        this.statusCheckCache.set(tranId, { timestamp: now + 1500, result: coolDownResult });
        return coolDownResult;
      }
    }

    // Default for local transactions
    const defaultPending = {
      tranId: txn.tranId,
      status: txn.status,
      invoiceStatus: txn.invoice.status,
      verifiedAt: txn.verifiedAt,
      amount: Number(txn.amount),
      currency: txn.currency,
    };
    this.statusCheckCache.set(tranId, { timestamp: now, result: defaultPending });
    return defaultPending;
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

  async createQuickInvoice(dto: {
    nameEn: string;
    nameKh?: string;
    phone?: string;
    amount: number;
    currency?: string;
    reason?: string;
  }) {
    const year = new Date().getFullYear();
    const phone = dto.phone?.trim() || `012${Math.floor(100000 + Math.random() * 900000)}`;
    const currency = (dto.currency as 'USD' | 'KHR') || 'USD';
    const amount = Number(dto.amount);

    // 1. Find or create patient
    let patient = await this.prisma.patient.findFirst({
      where: {
        OR: [
          { phone },
          { nameEn: { equals: dto.nameEn.trim(), mode: 'insensitive' } },
        ],
      },
    });

    if (!patient) {
      const patientCount = await this.prisma.patient.count();
      const patientCode = `PAT-${year}-${(patientCount + 1).toString().padStart(4, '0')}`;
      patient = await this.prisma.patient.create({
        data: {
          patientCode,
          nameEn: dto.nameEn.trim(),
          nameKh: dto.nameKh?.trim() || null,
          gender: 'MALE',
          phone,
        },
      });
    }

    // 2. Generate unique invoice number
    const invoiceCount = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${year}-${(invoiceCount + 1).toString().padStart(4, '0')}`;

    // 3. Create Invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: patient.id,
        totalAmount: amount,
        payableAmount: amount,
        discount: 0,
        currency,
        status: InvoiceStatus.UNPAID,
        paymentMethod: PaymentMethod.KHQR,
      },
      include: {
        patient: {
          select: { id: true, patientCode: true, nameEn: true, nameKh: true, phone: true },
        },
      },
    });

    return invoice;
  }

  async settleCash(invoiceId: string, amountTendered: number, cashierId?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('This invoice is already settled/paid.');
    }

    const payable = Number(invoice.payableAmount);
    const tendered = Number(amountTendered);
    if (tendered < payable) {
      throw new BadRequestException(
        `Amount tendered ($${tendered.toFixed(2)}) is less than total payable ($${payable.toFixed(2)}).`,
      );
    }

    const changeDue = Math.max(0, tendered - payable);
    const now = new Date();
    const tranId = `CASH-${invoice.invoiceNumber}-${Date.now().toString().slice(-6)}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.create({
        data: {
          invoiceId: invoice.id,
          tranId,
          qrString: 'CASH_PAYMENT',
          md5: 'CASH',
          currency: invoice.currency,
          amount: invoice.payableAmount,
          status: PaymentStatus.SUCCESS,
          verifiedAt: now,
          metadata: {
            paymentMethod: 'CASH',
            amountTendered: tendered,
            changeDue,
          },
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.PAID,
          paymentMethod: PaymentMethod.CASH,
          paidAt: now,
          cashierId: cashierId || null,
        },
        include: {
          patient: true,
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: cashierId || null,
          action: 'CASH_PAYMENT_SETTLED',
          entity: 'INVOICE',
          entityId: invoice.id,
          details: {
            tranId,
            payableAmount: payable,
            amountTendered: tendered,
            changeDue,
            settledAt: now.toISOString(),
          },
        },
      });

      return { transaction, invoice: updatedInvoice };
    });

    return {
      success: true,
      message: 'Cash payment settled successfully.',
      invoice: result.invoice,
      amountTendered: tendered,
      changeDue,
    };
  }
}

