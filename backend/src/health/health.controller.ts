import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'System Health Check and Database Connectivity' })
  @ApiResponse({ status: 200, description: 'System and PostgreSQL are fully operational' })
  @ApiResponse({ status: 503, description: 'System or database connection failed' })
  async check(@Res() res: Response) {
    const startTime = Date.now();
    try {
      // Direct raw query to verify PostgreSQL liveness
      await this.prisma.$queryRaw`SELECT 1`;
      const dbLatencyMs = Date.now() - startTime;

      const mem = process.memoryUsage();

      return res.status(HttpStatus.OK).json({
        status: 'UP',
        system: 'Rotana Clinic Management Platform',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: 'CONNECTED',
          type: 'PostgreSQL',
          latencyMs: dbLatencyMs,
        },
        memory: {
          rssMb: Math.round(mem.rss / 1024 / 1024),
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        },
      });
    } catch (error: any) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        database: {
          status: 'DISCONNECTED',
          error: error?.message || 'Database connection error',
        },
      });
    }
  }
}
