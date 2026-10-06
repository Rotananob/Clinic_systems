import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { FollowUpStatus } from '@prisma/client';

export class UpdateFollowUpDto {
  @ApiProperty({ enum: FollowUpStatus, required: false })
  @IsEnum(FollowUpStatus)
  @IsOptional()
  status?: FollowUpStatus;

  @ApiProperty({ description: 'Scheduled date of follow-up (ISO string)', required: false })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiProperty({ description: 'Follow-up outcome or notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
