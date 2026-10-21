import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantProfileDto {
  @ApiPropertyOptional({ example: 'Sokhapheap Clinic', description: 'Clinic Name in English' })
  @IsString()
  @IsOptional()
  clinicNameEn?: string;

  @ApiPropertyOptional({ example: 'មន្ទីរសម្រាកព្យាបាល សុខភាព', description: 'Clinic Name in Khmer' })
  @IsString()
  @IsOptional()
  clinicNameKh?: string;

  @ApiPropertyOptional({ example: 'MoH-2025-8841-KHM', description: 'Ministry of Health License Number' })
  @IsString()
  @IsOptional()
  mohLicenseNumber?: string;

  @ApiPropertyOptional({ example: 'Polyclinic & Outpatient Center', description: 'Clinic classification' })
  @IsString()
  @IsOptional()
  clinicType?: string;

  @ApiPropertyOptional({ example: '+855 23 888 999', description: 'Primary Telephone' })
  @IsString()
  @IsOptional()
  phonePrimary?: string;

  @ApiPropertyOptional({ example: '+855 12 333 444', description: 'Emergency Hotline' })
  @IsString()
  @IsOptional()
  phoneEmergency?: string;

  @ApiPropertyOptional({ example: 'info@sokhapheap.com.kh', description: 'Official Email' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'https://sokhapheap.com.kh', description: 'Official Website' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ example: '#123, St 271, Phnom Penh', description: 'Physical Address English' })
  @IsString()
  @IsOptional()
  addressEn?: string;

  @ApiPropertyOptional({ example: 'ផ្ទះលេខ ១២៣ ផ្លូវ ២៧១ រាជធានីភ្នំពេញ', description: 'Physical Address Khmer' })
  @IsString()
  @IsOptional()
  addressKh?: string;

  @ApiPropertyOptional({ example: 'your_clinic@aba', description: 'Bakong Account ID' })
  @IsString()
  @IsOptional()
  bakongAccountId?: string;

  @ApiPropertyOptional({ example: 'SOKHAPHEAP CLINIC', description: 'KHQR Merchant Name' })
  @IsString()
  @IsOptional()
  merchantName?: string;

  @ApiPropertyOptional({ example: 'Phnom Penh', description: 'Merchant City' })
  @IsString()
  @IsOptional()
  merchantCity?: string;

  @ApiPropertyOptional({ example: 'https://link.payway.com.kh/ABAPAYCK539089j', description: 'ABA PayWay Direct Link' })
  @IsString()
  @IsOptional()
  paywayPaymentUrl?: string;
}
