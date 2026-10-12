import { Controller, Post, Get, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Uploads & Cloud Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @ApiOperation({ summary: 'Check Cloudinary cloud storage status' })
  @Get('status')
  getStatus() {
    return {
      configured: this.cloudinaryService.isConfigured(),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
      provider: 'Cloudinary CDN',
    };
  }

  @ApiOperation({ summary: 'Upload an image or document to Cloudinary CDN' })
  @Post('image')
  async uploadImage(@Body() dto: UploadImageDto) {
    if (!dto.image) {
      throw new BadRequestException('Image data is required');
    }

    try {
      const result = await this.cloudinaryService.uploadFile(dto.image, dto.folder || 'attachments');
      return {
        success: true,
        url: result.url,
        publicId: result.publicId || null,
        format: result.format || null,
        bytes: result.bytes || 0,
      };
    } catch (err: any) {
      throw new BadRequestException(`Failed to upload to Cloudinary: ${err.message || err}`);
    }
  }
}
