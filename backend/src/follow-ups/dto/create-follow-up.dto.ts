import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateFollowUpDto {
  @ApiProperty({ description: 'ID of the patient', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'Optional ID of the associated visit', required: false })
  @IsUUID()
  @IsOptional()
  visitId?: string;

  @ApiProperty({ description: 'Attending doctor ID', required: false })
  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @ApiProperty({ description: 'Scheduled date of follow-up (ISO string)', example: '2026-10-15T09:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @ApiProperty({ description: 'Clinical reason for follow-up', example: 'Blood pressure check & medication titration' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Additional clinical instructions', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
