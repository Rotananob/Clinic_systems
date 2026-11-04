import { IsEnum, IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanTier } from '@prisma/client';
import { BillingCycle } from './create-subscription-checkout.dto';

export class CreatePublicSubscriptionCheckoutDto {
  @ApiProperty({
    enum: PlanTier,
    example: PlanTier.PRO_8,
    description: 'Target SaaS subscription tier',
  })
  @IsEnum(PlanTier)
  @IsNotEmpty()
  planTier: PlanTier;

  @ApiPropertyOptional({
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class PublicVerifyAndRegisterDto {
  @ApiProperty({ description: 'Transaction ID from public checkout session' })
  @IsString()
  @IsNotEmpty()
  tranId: string;

  @ApiProperty({ description: 'User login email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Account password' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ description: 'Clinic name in Khmer' })
  @IsString()
  @IsOptional()
  clinicNameKh?: string;

  @ApiPropertyOptional({ description: 'Clinic name in English' })
  @IsString()
  @IsOptional()
  clinicNameEn?: string;

  @ApiPropertyOptional({ description: 'Administrator full name' })
  @IsString()
  @IsOptional()
  adminName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: PlanTier, example: PlanTier.PRO_8 })
  @IsEnum(PlanTier)
  @IsNotEmpty()
  planTier: PlanTier;

  @ApiPropertyOptional({ enum: BillingCycle, default: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiPropertyOptional()
  @IsOptional()
  forceConfirm?: boolean;
}
