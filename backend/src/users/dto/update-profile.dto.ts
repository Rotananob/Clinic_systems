import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: 'Full name in English', required: false })
  @IsString()
  @IsOptional()
  fullNameEn?: string;

  @ApiProperty({ description: 'Full name in Khmer', required: false })
  @IsString()
  @IsOptional()
  fullNameKh?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Avatar image URL (from Cloudinary CDN)', required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ description: 'Department or clinical specialty', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ description: 'Telegram username for alerts', required: false })
  @IsString()
  @IsOptional()
  telegramUsername?: string;

  @ApiProperty({ description: 'Short bio or clinical notes', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: 'Enable or disable push notifications', required: false })
  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;
}
