import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadImageDto {
  @ApiProperty({
    description: 'Base64 data URL (e.g. data:image/png;base64,...) or remote image URL',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({
    description: 'Sub-folder in Cloudinary (e.g. patients, documents, logos, prescriptions)',
    required: false,
    example: 'documents',
  })
  @IsString()
  @IsOptional()
  folder?: string;
}
