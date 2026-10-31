import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanTier } from '@prisma/client';

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export class CreateSubscriptionCheckoutDto {
  @ApiProperty({
    enum: PlanTier,
    example: PlanTier.STARTER_5,
    description:
      'Target SaaS subscription tier: STARTER_5 ($5/mo), PRO_8 ($8/mo), ENTERPRISE_12 ($12/mo), SPECIALIST_15 ($15/mo), or UNLIMITED_20 ($20/mo)',
  })
  @IsEnum(PlanTier)
  @IsNotEmpty()
  planTier: PlanTier;

  @ApiPropertyOptional({
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
    description: 'Billing cycle: MONTHLY or ANNUAL (20% discount)',
  })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({
    description: 'Unique client device identifier for daily spam protection limit',
  })
  @IsString()
  @IsOptional()
  deviceId?: string;
}
