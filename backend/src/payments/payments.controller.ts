import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { GenerateInvoiceQrDto, SettlePaymentDto, CreateQuickInvoiceDto } from './dto/generate-qr.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InvoiceStatus } from '@prisma/client';

@ApiTags('Payments & Invoices')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'List all clinic invoices with status and patient filter' })
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
  @Get('invoices/:id')
  findInvoiceById(@Param('id') id: string) {
    return this.paymentsService.findInvoiceById(id);
  }

  @ApiOperation({ summary: 'Generate dynamic KHQR Tag 01=12 and bank deeplinks for an invoice' })
  @Post('generate-qr')
  generateQr(@Body() dto: GenerateInvoiceQrDto) {
    return this.paymentsService.generateInvoiceKhqr(dto.invoiceId);
  }

  @ApiOperation({ summary: 'Instant settlement verification endpoint for 0.3s webhook / cashier confirm' })
  @Post('settle')
  settle(@Request() req: any, @Body() dto: SettlePaymentDto) {
    const cashierId = req.user?.id || 'CASHIER_OR_WEBHOOK';
    return this.paymentsService.settleTransaction(dto.tranId, cashierId);
  }

  @ApiOperation({ summary: 'Real-time status check for client poller' })
  @Get('status/:tranId')
  checkStatus(@Param('tranId') tranId: string) {
    return this.paymentsService.checkStatus(tranId);
  }

  @ApiOperation({ summary: 'Create quick patient invoice for instant laptop screen KHQR scan' })
  @Post('quick-invoice')
  createQuickInvoice(@Body() dto: CreateQuickInvoiceDto) {
    return this.paymentsService.createQuickInvoice(dto);
  }
}
