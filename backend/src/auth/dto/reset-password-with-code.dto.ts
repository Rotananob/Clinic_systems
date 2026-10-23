import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordWithCodeDto {
  @ApiProperty({ example: 'staff@rotanaclinic.com.kh', description: 'Registered email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit password reset verification code' })
  @IsString()
  @IsNotEmpty()
  resetCode: string;

  @ApiProperty({ example: 'NewSecurePassword#2026', description: 'New account password with minimum 6 characters' })
  @IsString()
  @MinLength(6, { message: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ តួអក្សរ' })
  newPassword: string;
}
