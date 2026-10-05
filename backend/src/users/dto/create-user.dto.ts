import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'nurse.dara@clinic.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Staff@12345' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Dara Pich' })
  @IsString()
  @IsNotEmpty()
  fullNameEn: string;

  @ApiPropertyOptional({ example: 'ដារ៉ា ពេជ្រ' })
  @IsString()
  @IsOptional()
  fullNameKh?: string;

  @ApiProperty({ enum: Role, example: Role.RECEPTIONIST })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ example: '012334455' })
  @IsString()
  @IsOptional()
  phone?: string;
}
