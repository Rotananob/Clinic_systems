import { Module } from '@nestjs/common';
import { EdgeFleetSyncService } from './fleet-sync.service.ts';
import { EdgeFleetSyncController } from './fleet-sync.controller.ts';

@Module({
  controllers: [EdgeFleetSyncController],
  providers: [EdgeFleetSyncService],
  exports: [EdgeFleetSyncService],
})
export class EdgeFleetSyncModule {}
