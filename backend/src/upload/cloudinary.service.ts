import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface CloudinaryUploadResult {
  success: boolean;
  url: string;
  publicId?: string;
  format?: string;
  bytes?: number;
  resourceType?: string;
  originalName?: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private initialized = false;

  constructor() {
    this.initCloudinary();
  }

  private initCloudinary() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    if (cloudinaryUrl) {
      cloudinary.config();
      this.initialized = true;
      this.logger.log('[Cloudinary] Configured via CLOUDINARY_URL');
      return;
    }

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.initialized = true;
      this.logger.log(`[Cloudinary] Configured for cloud_name: ${cloudName}`);
    } else {
      this.logger.warn(
        '[Cloudinary] Missing credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Uploads will fallback to direct storage.',
      );
    }
  }

  isConfigured(): boolean {
    return this.initialized;
  }

  async uploadFile(fileData: string, folder = 'attachments'): Promise<CloudinaryUploadResult> {
    if (!this.initialized) {
      return {
        success: false,
        url: fileData,
      };
    }

    try {
      const sanitizedFolder = `houn_vannak_clinic/${folder.replace(/^[/]+|[/]+$/g, '')}`;
      const response: UploadApiResponse = await cloudinary.uploader.upload(fileData, {
        folder: sanitizedFolder,
        resource_type: 'auto',
      });

      return {
        success: true,
        url: response.secure_url,
        publicId: response.public_id,
        format: response.format,
        bytes: response.bytes,
        resourceType: response.resource_type,
      };
    } catch (error: any) {
      this.logger.error(`[Cloudinary] Upload failed: ${error.message || error}`);
      throw error;
    }
  }

  async deleteFile(publicId: string): Promise<boolean> {
    if (!this.initialized || !publicId) {
      return false;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error: any) {
      this.logger.error(`[Cloudinary] Delete failed for ${publicId}: ${error.message || error}`);
      return false;
    }
  }
}
