import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { GenerateInvoiceQrDto, SettlePaymentDto, CreateQuickInvoiceDto, UpdateInvoiceDto } from './dto/generate-qr.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InvoiceStatus } from '@prisma/client';

@ApiTags('Payments & Invoices')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'List all clinic invoices with status and patient filter' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'status', enum: InvoiceStatus, required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @Get('invoices')
  findAllInvoices(
    @Query('status') status?: InvoiceStatus,
    @Query('patientId') patientId?: string,
  ) {
    return this.paymentsService.findAllInvoices({ status, patientId });
  }

  @ApiOperation({ summary: 'Get detailed invoice with transactions and patient data' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('invoices/:id')
  findInvoiceById(@Param('id') id: string) {
    return this.paymentsService.findInvoiceById(id);
  }

  @ApiOperation({ summary: 'Generate dynamic KHQR Tag 01=12 and bank deeplinks for an invoice' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('generate-qr')
  generateQr(@Body() dto: GenerateInvoiceQrDto, @Request() req: any) {
    return this.paymentsService.generateInvoiceKhqr(dto.invoiceId, req?.user);
  }

  @ApiOperation({ summary: 'Instant settlement verification endpoint for 0.3s webhook / cashier confirm' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('settle')
  settle(@Request() req: any, @Body() dto: SettlePaymentDto) {
    const cashierId = req.user?.id || 'CASHIER_OR_WEBHOOK';
    return this.paymentsService.settleTransaction(dto.tranId, cashierId);
  }

  @ApiOperation({ summary: 'Real-time status check for client poller' })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Get('status/:tranId')
  checkStatus(@Param('tranId') tranId: string, @Query('force') force?: string) {
    const forceFresh = force === 'true' || force === '1';
    return this.paymentsService.checkStatus(tranId, forceFresh);
  }

  @ApiOperation({ summary: 'Create quick patient invoice for instant laptop screen KHQR scan' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('quick-invoice')
  createQuickInvoice(@Body() dto: CreateQuickInvoiceDto, @Request() req: any) {
    return this.paymentsService.createQuickInvoice(dto, req?.user);
  }

  @ApiOperation({ summary: 'Settle invoice via cash collection with change calculation' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('settle-cash')
  settleCash(@Body() dto: { invoiceId: string; amountTendered: number }) {
    return this.paymentsService.settleCash(dto.invoiceId, dto.amountTendered);
  }

  @ApiOperation({ summary: 'Update or correct invoice status and details' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('invoices/:id')
  updateInvoice(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    return this.paymentsService.updateInvoice(id, dto, userId, req?.user);
  }

  @ApiOperation({ summary: 'Get current evaluation account daily quota status' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('quota-status')
  getQuotaStatus(@Request() req: any) {
    return this.paymentsService.getTestQuotaStatus(req?.user);
  }
}

