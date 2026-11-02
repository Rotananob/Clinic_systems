import { Module } from '@nestjs/common';
import { BedsideMonitorController } from './bedside-monitor.controller.ts';
import { BedsideMonitorService } from './bedside-monitor.service.ts';

@Module({
  controllers: [BedsideMonitorController],
  providers: [BedsideMonitorService],
  exports: [BedsideMonitorService]
})
export class BedsideMonitorModule {}
