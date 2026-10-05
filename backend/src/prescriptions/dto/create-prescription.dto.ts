import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PrescriptionItemDto {
  @ApiProperty({ example: 'Amoxicillin 500mg' })
  @IsString()
  @IsNotEmpty()
  medicineName: string;

  @ApiProperty({ example: '500mg' })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ example: '1 tablet 3 times a day after meals' })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({ example: '5 days' })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 0.50 })
  @IsNumber()
  unitPrice: number;

  @ApiPropertyOptional({ example: 'Take with plenty of water' })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({ example: 'b5a2b1b3-4f3e-4b21-a1e1-85db2d6e3f22' })
  @IsUUID()
  @IsNotEmpty()
  visitId: string;

  @ApiPropertyOptional({ example: 'Take medications as directed' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [PrescriptionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];
}
