import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { GenerateInvoiceQrDto, SettlePaymentDto } from './dto/generate-qr.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Payments (KHQR)')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Generate dynamic KHQR Tag 01=12 and bank deeplinks for an invoice' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('generate-qr')
  generateQr(@Body() dto: GenerateInvoiceQrDto) {
    return this.paymentsService.generateInvoiceKhqr(dto.invoiceId);
  }

  @ApiOperation({ summary: 'Instant settlement verification endpoint for 0.3s webhook / cashier confirm' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('settle')
  settle(@Request() req: any, @Body() dto: SettlePaymentDto) {
    const cashierId = req.user?.id;
    return this.paymentsService.settleTransaction(dto.tranId, cashierId);
  }

  @ApiOperation({ summary: 'Real-time status check for client poller' })
  @Get('status/:tranId')
  checkStatus(@Param('tranId') tranId: string) {
    return this.paymentsService.checkStatus(tranId);
  }
}
