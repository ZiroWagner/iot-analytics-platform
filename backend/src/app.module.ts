import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration, validationSchema } from './config/configuration';
import { throttlerConfig } from './config/throttler.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { SensorsModule } from './sensors/sensors.module';
import { DevicesModule } from './devices/devices.module';
import { IngestModule } from './ingest/ingest.module';
import { BullModule } from '@nestjs/bullmq';
import { AnalyticsModule } from './analytics/analytics.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { RedisModule } from './redis/redis.module';
import { ObservabilityModule } from './observability/observability.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    ThrottlerModule.forRoot(throttlerConfig),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    PrismaModule,
    ProjectsModule,
    SensorsModule,
    DevicesModule,
    IngestModule,
    AnalyticsModule,
    DashboardsModule,
    RedisModule,
    ObservabilityModule,
    TelemetryModule,
    HealthModule,
  ],
  providers: [],
})
export class AppModule {}
