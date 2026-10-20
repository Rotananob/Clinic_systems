import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanTier } from '@prisma/client';

export class RegisterClinicDto {
  @ApiProperty({ example: 'គ្លីនិក សុខភាពល្អ', description: 'Clinic Name in Khmer' })
  @IsString()
  @IsNotEmpty()
  clinicNameKh: string;

  @ApiProperty({ example: 'Sokhapheap LOR Clinic', description: 'Clinic Name in English' })
  @IsString()
  @IsNotEmpty()
  clinicNameEn: string;

  @ApiProperty({ example: '012345678', description: 'Primary contact phone' })
  @IsString()
  @IsNotEmpty()
  phone: string;

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

  @ApiPropertyOptional({ enum: PlanTier, default: PlanTier.FREE, description: 'Selected SaaS subscription plan tier' })
  @IsEnum(PlanTier)
  @IsOptional()
  planTier?: PlanTier;
}
