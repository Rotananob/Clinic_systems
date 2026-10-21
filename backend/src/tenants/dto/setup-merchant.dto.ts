import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SetupMerchantDto {
  @ApiPropertyOptional({
    example: 'https://link.payway.com.kh/ABAPAYCK539089j',
    description: 'Merchant ABA PayWay public checkout link (Only credential required for pay-helper dynamic KHQR)',
  })
  @IsString()
  @IsOptional()
  paywayPaymentUrl?: string;

  @ApiPropertyOptional({
    example: 'my_clinic@aba',
    description: 'Optional Bakong Account ID if not using PayWay link',
  })
  @IsString()
  @IsOptional()
  bakongAccountId?: string;

  @ApiPropertyOptional({
    example: 'Sokhapheap Clinic',
    description: 'Official Merchant Name displayed on KHQR payment screens',
  })
  @IsString()
  @IsOptional()
  merchantName?: string;

  @ApiPropertyOptional({
    example: 'Phnom Penh',
    default: 'Phnom Penh',
    description: 'City where merchant is registered',
  })
  @IsString()
  @IsOptional()
  merchantCity?: string;
}
