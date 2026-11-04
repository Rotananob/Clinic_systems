import { Module } from '@nestjs/common';
import { BedsideMonitorController } from './bedside-monitor.controller';
import { BedsideMonitorService } from './bedside-monitor.service';

@Module({
  controllers: [BedsideMonitorController],
  providers: [BedsideMonitorService],
  exports: [BedsideMonitorService]
})
export class BedsideMonitorModule {}
