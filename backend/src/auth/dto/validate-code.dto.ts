import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCodeDto {
  @ApiProperty({ example: 'doctor@gmail.com', description: 'User Gmail address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit confirmation code' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  verificationCode: string;
}
