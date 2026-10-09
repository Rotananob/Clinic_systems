import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HardwareService } from './hardware.service';

@ApiTags('Hardware')
@Controller('hardware')
export class HardwareController {
  constructor(private readonly hardwareService: HardwareService) {}

  @ApiOperation({ summary: 'Relay ESC/POS bytes to a network TCP printer' })
  @Post('print')
  async print(@Body() body: { ip: string; port: number; data: number[] }) {
    const { ip, port, data } = body;
    if (!ip || !port || !Array.isArray(data)) {
      throw new HttpException('ip, port, and data array are required', HttpStatus.BAD_REQUEST);
    }
    try {
      await this.hardwareService.printToNetworkPrinter(ip, port, data);
      return { success: true };
    } catch (err: unknown) {
      const e = err as Error;
      throw new HttpException(e?.message ?? 'Print failed', HttpStatus.BAD_GATEWAY);
    }
  }

  @ApiOperation({ summary: 'Test connectivity to a network printer' })
  @Post('test-printer')
  async testPrinter(@Body() body: { ip: string; port: number }) {
    const { ip, port } = body;
    if (!ip || !port) {
      throw new HttpException('ip and port are required', HttpStatus.BAD_REQUEST);
    }
    const result = await this.hardwareService.testNetworkPrinter(ip, port);
    if (!result.success) {
      throw new HttpException(
        `Printer unreachable at ${ip}:${port} (${result.latencyMs}ms)`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    return result;
  }

  @ApiOperation({ summary: 'Send cash drawer open pulse via network printer' })
  @Post('open-drawer')
  async openDrawer(@Body() body: { ip: string; port: number }) {
    const { ip, port } = body;
    if (!ip || !port) {
      throw new HttpException('ip and port are required', HttpStatus.BAD_REQUEST);
    }
    const pulse = this.hardwareService.buildDrawerPulse();
    try {
      await this.hardwareService.printToNetworkPrinter(ip, port, pulse);
      return { success: true };
    } catch (err: unknown) {
      const e = err as Error;
      throw new HttpException(e?.message ?? 'Failed to open drawer', HttpStatus.BAD_GATEWAY);
    }
  }
}
