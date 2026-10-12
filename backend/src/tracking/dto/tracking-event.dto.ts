import { IsOptional, IsString, IsObject, IsNumber } from 'class-validator';

export class DeviceInfoDto {
  @IsOptional()
  @IsString()
  deviceType?: string; // Desktop, Mobile, Tablet

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsString()
  screenResolution?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class LocationDto {
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

export class TrackingEventDto {
  @IsString()
  path: string;

  @IsOptional()
  @IsString()
  action?: string; // 'PAGE_VIEW', 'USER_LOGIN', 'USER_LOGOUT', 'CHECKOUT_KHQR', etc.

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  clientReportedIp?: string;

  @IsOptional()
  @IsObject()
  device?: DeviceInfoDto;

  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}
