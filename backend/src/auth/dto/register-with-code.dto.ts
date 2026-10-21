import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RegisterClinicDto } from './register-clinic.dto';

export class RegisterWithCodeDto extends RegisterClinicDto {
  @ApiProperty({ example: '123456', description: '6-digit verification code received via Gmail' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  verificationCode: string;
}
