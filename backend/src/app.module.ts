import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { VisitsModule } from './visits/visits.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FollowUpsModule } from './follow-ups/follow-ups.module';
import { DocumentsModule } from './documents/documents.module';
import { HealthModule } from './health/health.module';
import { HardwareModule } from './hardware/hardware.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, '../../.env'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../.env'),
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    VisitsModule,
    PrescriptionsModule,
    PaymentsModule,
    DashboardModule,
    FollowUpsModule,
    DocumentsModule,
    HealthModule,
    HardwareModule,
    SystemModule,
  ],
})
export class AppModule {}
