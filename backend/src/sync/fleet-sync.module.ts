import { Module } from '@nestjs/common';
import { EdgeFleetSyncService } from './fleet-sync.service';
import { EdgeFleetSyncController } from './fleet-sync.controller';

@Module({
  controllers: [EdgeFleetSyncController],
  providers: [EdgeFleetSyncService],
  exports: [EdgeFleetSyncService],
})
export class EdgeFleetSyncModule {}
