import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class CreatePatientDto {
  @ApiProperty({ example: 'Sok Dara' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiPropertyOptional({ example: 'សុខ តារា' })
  @IsString()
  @IsOptional()
  nameKh?: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: '1990-08-15' })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiProperty({ example: '012999888' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: '010203040' })
  @IsString()
  @IsOptional()
  nationalId?: string;

  @ApiPropertyOptional({ example: 'Boeng Keng Kang, Phnom Penh' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'O+' })
  @IsString()
  @IsOptional()
  bloodType?: string;

  @ApiPropertyOptional({ example: 'Aspirin, Penicillin' })
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiPropertyOptional({ example: 'Sok Veasna' })
  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '012777666' })
  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;
}
