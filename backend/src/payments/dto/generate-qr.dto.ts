import { IsNotEmpty, IsUUID, IsNumber, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';

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

export class CreateQuickInvoiceDto {
  @ApiProperty({ example: 'Chan Sokha' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiPropertyOptional({ example: 'ចាន់ សុខា' })
  @IsString()
  @IsOptional()
  nameKh?: string;

  @ApiPropertyOptional({ example: '012345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 15.0 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 'Consultation & Medicine' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ enum: InvoiceStatus, example: 'PENDING' })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional({ example: 25.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  payableAmount?: number;

  @ApiPropertyOptional({ example: 'KHQR' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Staff corrected payment status' })
  @IsString()
  @IsOptional()
  notes?: string;
}
