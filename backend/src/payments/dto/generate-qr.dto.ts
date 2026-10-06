import { IsNotEmpty, IsUUID, IsNumber, IsOptional, IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateInvoiceQrDto {
  @ApiProperty({ example: 'b5a2b1b3-4f3e-4b21-a1e1-85db2d6e3f22' })
  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;
}

export class SettlePaymentDto {
  @ApiProperty({ example: 'TXN-INV-2026-0001-1728100000000' })
  @IsNotEmpty()
  tranId: string;
}

export class QuickKhqrDto {
  @ApiProperty({ example: 10.0, description: 'Amount to pay' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'USD', enum: ['USD', 'KHR'], required: false })
  @IsOptional()
  @IsIn(['USD', 'KHR'])
  currency?: 'USD' | 'KHR';

  @ApiProperty({ example: 'INV-QUICK-001', required: false })
  @IsOptional()
  @IsString()
  billNumber?: string;

  @ApiProperty({ example: 'Sokha Chan', required: false })
  @IsOptional()
  @IsString()
  patientName?: string;
}
