import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetupMerchantDto {
  @ApiProperty({
    example: 'my_clinic@aba',
    description: 'Bakong Account ID / Merchant ID (e.g. clinic@aba)',
  })
  @IsString()
  @IsNotEmpty()
  bakongAccountId: string;

  @ApiProperty({
    example: 'Sokhapheap LOR Clinic',
    description: 'Official Merchant Name displayed on KHQR payment screens',
  })
  @IsString()
  @IsNotEmpty()
  merchantName: string;

  @ApiPropertyOptional({
    example: 'Phnom Penh',
    default: 'Phnom Penh',
    description: 'City where merchant is registered',
  })
  @IsString()
  @IsOptional()
  merchantCity?: string;

  @ApiPropertyOptional({
    example: 'https://link.payway.com.kh/ABAPAYCK539089j',
    description: 'Optional direct ABA PayWay checkout payment link',
  })
  @IsString()
  @IsOptional()
  paywayPaymentUrl?: string;
}
