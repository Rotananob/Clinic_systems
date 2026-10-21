import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanTier } from '@prisma/client';

export class RegisterClinicDto {
  @ApiPropertyOptional({ example: 'គ្លីនិក សុខភាពល្អ', description: 'Clinic Name in Khmer' })
  @IsString()
  @IsOptional()
  clinicNameKh?: string;

  @ApiPropertyOptional({ example: 'Sokhapheap LOR Clinic', description: 'Clinic Name in English' })
  @IsString()
  @IsOptional()
  clinicNameEn?: string;

  @ApiPropertyOptional({ example: '012345678', description: 'Primary contact phone' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'admin@sokhapheap.com', description: 'Administrator email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecretPass#2026', description: 'Secure administrator password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'Dr. Sok Chea', description: 'Administrator full name' })
  @IsString()
  @IsOptional()
  adminName?: string;

  @ApiPropertyOptional({ example: 'Polyclinic & Outpatient Center', description: 'Clinic specialization classification' })
  @IsString()
  @IsOptional()
  clinicType?: string;

  @ApiPropertyOptional({ enum: PlanTier, default: PlanTier.FREE, description: 'Selected SaaS subscription plan tier' })
  @IsEnum(PlanTier)
  @IsOptional()
  planTier?: PlanTier;
}
