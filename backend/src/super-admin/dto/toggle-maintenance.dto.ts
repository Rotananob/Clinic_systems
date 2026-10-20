import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ToggleMaintenanceDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  messageKh?: string;

  @IsOptional()
  @IsString()
  messageEn?: string;
}
