import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { TrackingEventDto } from './dto/tracking-event.dto';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Visitor Tracking & Audit Telemetry')
@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly jwtService: JwtService,
  ) {}

  @ApiOperation({ summary: 'Record visitor page view or user action with real IP, location and device info' })
  @Post('event')
  async recordEvent(@Body() dto: TrackingEventDto, @Req() req: Request) {
    let authUser: any = null;

    // Safely extract authenticated user if Bearer token is provided
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = this.jwtService.decode(token) as any;
        if (payload) {
          authUser = {
            id: payload.sub || payload.id,
            email: payload.email,
            role: payload.role,
            fullNameEn: payload.fullNameEn,
            fullNameKh: payload.fullNameKh,
          };
        }
      } catch {
        // Silently treat as anonymous visitor if token is invalid or expired
      }
    }

    return this.trackingService.recordEvent(req, dto, authUser);
  }

  @ApiOperation({ summary: 'Get visitor traffic analytics (Admin & Super Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('stats')
  async getStats() {
    return this.trackingService.getVisitorStats();
  }
}
