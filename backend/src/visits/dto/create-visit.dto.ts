import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVisitDto {
  @ApiProperty({ example: 'b5a2b1b3-4f3e-4b21-a1e1-85db2d6e3f22' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @ApiPropertyOptional({ example: 'Sore throat and fever for 2 days' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ example: 'Cough, mild headache' })
  @IsString()
  @IsOptional()
  symptoms?: string;

  @ApiPropertyOptional({ example: '120/80' })
  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @ApiPropertyOptional({ example: 75 })
  @IsNumber()
  @IsOptional()
  heartRate?: number;

  @ApiPropertyOptional({ example: 37.5 })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({ example: 65.5 })
  @IsNumber()
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional({ example: 170.0 })
  @IsNumber()
  @IsOptional()
  heightCm?: number;

  @ApiPropertyOptional({ example: 10.00 })
  @IsNumber()
  @IsOptional()
  consultationFee?: number;
}
