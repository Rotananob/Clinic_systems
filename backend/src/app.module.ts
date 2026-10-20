import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
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
import { TelegramModule } from './telegram/telegram.module';
import { UploadModule } from './upload/upload.module';
import { TrackingModule } from './tracking/tracking.module';
import { TenantsModule } from './tenants/tenants.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { PortalModule } from './portal/portal.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { RateLimiterMiddleware } from './common/middleware/rate-limiter.middleware';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), 'backend/.env'),
        path.resolve(__dirname, '../../.env'),
        path.resolve(__dirname, '../.env'),
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
    TelegramModule,
    UploadModule,
    TrackingModule,
    TenantsModule,
    SubscriptionsModule,
    SuperAdminModule,
    PortalModule,
    WarehouseModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimiterMiddleware, TenantContextMiddleware).forRoutes('*');
  }
}
