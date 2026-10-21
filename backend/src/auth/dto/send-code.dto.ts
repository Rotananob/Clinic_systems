import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationCodeDto {
  @ApiProperty({ example: 'doctor@gmail.com', description: 'Destination Gmail for 6-digit verification code' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
