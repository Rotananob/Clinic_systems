import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifySubscriptionSettlementDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique Subscription ID or Subscription Invoice ID',
  })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiPropertyOptional({
    example: 'TXN-SUB-sokhapheap-173829012',
    description: 'Transaction ID generated during checkout',
  })
  @IsString()
  @IsOptional()
  tranId?: string;

  @ApiPropertyOptional({
    example: 'd41d8cd98f00b204e9800998ecf8427e',
    description: 'MD5 hash of the generated KHQR payload',
  })
  @IsString()
  @IsOptional()
  md5?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Flag to confirm instant settlement verification',
  })
  @IsOptional()
  @IsBoolean()
  forceConfirm?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Super Admin manual override flag for verified offline bank settlements',
  })
  @IsOptional()
  @IsBoolean()
  adminOverride?: boolean;

  @ApiPropertyOptional({
    description: 'Cryptographic test signature token for automated testing environments only',
  })
  @IsString()
  @IsOptional()
  testBypassToken?: string;
}

export class RequestSubscriptionSupportDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Subscription Invoice ID that encountered a payment issue',
  })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiPropertyOptional({
    example: '+855 12 345 678',
    description: 'Clinic contact telephone number for follow up',
  })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({
    example: '@clinic_dr_sok',
    description: 'Telegram username for immediate support messaging',
  })
  @IsString()
  @IsOptional()
  telegramUsername?: string;

  @ApiPropertyOptional({
    example: 'Money deducted from ABA Mobile but status shows pending',
    description: 'Detailed description of the issue encountered',
  })
  @IsString()
  @IsOptional()
  issueDescription?: string;
}
