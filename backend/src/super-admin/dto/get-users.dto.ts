import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';

export class GetUsersDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
