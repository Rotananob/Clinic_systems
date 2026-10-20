import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PlanTier } from '@prisma/client';

export class OverridePlanDto {
  @IsOptional()
  @IsEnum(PlanTier)
  planTier?: PlanTier;

  @IsOptional()
  @IsNumber()
  @Min(1)
  addDays?: number;

  @IsOptional()
  @IsString()
  newExpiryDate?: string;

  @IsOptional()
  @IsNumber()
  maxDailyKhqr?: number;

  @IsOptional()
  @IsNumber()
  maxMonthlyPatients?: number;

  @IsOptional()
  @IsNumber()
  maxStaffAccounts?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
