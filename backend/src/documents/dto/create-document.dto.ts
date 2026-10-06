import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ description: 'ID of the patient' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'Optional associated visit ID', required: false })
  @IsUUID()
  @IsOptional()
  visitId?: string;

  @ApiProperty({ description: 'Document Title', example: 'Complete Blood Count (CBC) Lab Result' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Document Category', example: 'LAB_REPORT' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'MIME Type', example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @ApiProperty({ description: 'File Name', example: 'cbc_result_oct2026.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'File size in bytes', example: 1048576 })
  @IsNumber()
  @IsNotEmpty()
  fileSize: number;

  @ApiProperty({ description: 'File data URL or storage link' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ description: 'Clinical notes or comments', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
