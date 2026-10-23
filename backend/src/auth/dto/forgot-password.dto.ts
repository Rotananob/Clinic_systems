import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'staff@rotanaclinic.com.kh', description: 'Registered email address for password reset code' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
