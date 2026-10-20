import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { TenantContextService } from '../common/services/tenant-context.service';

export interface CloudinaryUploadResult {
  success: boolean;
  url: string;
  publicId?: string;
  format?: string;
  bytes?: number;
  resourceType?: string;
  originalName?: string;
}

// Built-in verified credentials for Houn Vannak Medical Clinic Cloudinary storage
const DEFAULT_CLOUD_NAME = 'lkpe4jyo';
const DEFAULT_API_KEY = '328623574498885';
const DEFAULT_API_SECRET = '9IW34m0PG4gx6Tht4bq9esNKRLQ';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
  private initialized = false;

  constructor() {
    this.initCloudinary();
  }

  onModuleInit() {
    this.initCloudinary();
  }

  private initCloudinary() {
    let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    let apiKey = process.env.CLOUDINARY_API_KEY;
    let apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    // Parse CLOUDINARY_URL if provided: cloudinary://<api_key>:<api_secret>@<cloud_name>
    if (cloudinaryUrl && (!cloudName || !apiKey || !apiSecret)) {
      const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
      if (match) {
        apiKey = apiKey || match[1];
        apiSecret = apiSecret || match[2];
        cloudName = cloudName || match[3];
      }
    }

    // Fallback to verified default credentials if env vars are unset
    cloudName = (cloudName || DEFAULT_CLOUD_NAME).trim();
    apiKey = (apiKey || DEFAULT_API_KEY).trim();
    apiSecret = (apiSecret || DEFAULT_API_SECRET).trim();

    try {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.initialized = true;
      this.logger.log(`[Cloudinary] Successfully configured for cloud_name: ${cloudName} (secure HTTPS enabled)`);
    } catch (err: any) {
      this.initialized = false;
      this.logger.error(`[Cloudinary] Configuration failed: ${err.message || err}`);
    }
  }

  isConfigured(): boolean {
    if (!this.initialized) {
      this.initCloudinary();
    }
    return this.initialized;
  }

  /**
   * Step 23: Tenant-Isolated File Upload to Cloudinary CDN.
   * Scopes folder strictly into clinicos_tenants/{tenant}/ to guarantee zero cross-tenant asset bleed.
   */
  async uploadFile(fileData: string, folder = 'attachments'): Promise<CloudinaryUploadResult> {
    if (!this.initialized) {
      this.initCloudinary();
    }

    if (!this.initialized) {
      throw new Error('Cloudinary is not configured. Please verify Cloudinary credentials.');
    }

    try {
      const activeTenant = TenantContextService.getTenantSlug() || TenantContextService.getTenantId();
      const cleanFolder = folder.replace(/^[/]+|[/]+$/g, '');
      const sanitizedFolder = activeTenant
        ? `clinicos_tenants/${activeTenant.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}/${cleanFolder}`
        : `houn_vannak_clinic/${cleanFolder}`;

      const response: UploadApiResponse = await cloudinary.uploader.upload(fileData, {
        folder: sanitizedFolder,
        resource_type: 'auto',
      });

      return {
        success: true,
        url: response.secure_url || response.url,
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
    if (!this.initialized) {
      this.initCloudinary();
    }
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
