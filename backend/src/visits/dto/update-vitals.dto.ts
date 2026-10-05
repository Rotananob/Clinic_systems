import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVitalsDto {
  @ApiPropertyOptional({ example: '120/80' })
  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @ApiPropertyOptional({ example: 78 })
  @IsNumber()
  @IsOptional()
  heartRate?: number;

  @ApiPropertyOptional({ example: 37.2 })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({ example: 68.0 })
  @IsNumber()
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional({ example: 172.0 })
  @IsNumber()
  @IsOptional()
  heightCm?: number;
}
