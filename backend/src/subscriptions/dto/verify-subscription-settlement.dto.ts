import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
  forceConfirm?: boolean;
}
