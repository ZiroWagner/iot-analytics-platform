import { Module } from '@nestjs/common';
import { RedisModule } from '@/redis/redis.module';
import { ObservabilityModule } from '@/observability/observability.module';

// Gateway (interfaces/ws)
import { TelemetryGateway } from './interfaces/ws/telemetry.gateway';

// Infrastructure adapters
import {
  TELEMETRY_ADAPTER_TOKEN,
  RedisTelemetryAdapter,
} from './infrastructure/adapters/redis-telemetry.adapter';

@Module({
  imports: [RedisModule, ObservabilityModule],
  providers: [
    // Adapters
    {
      provide: TELEMETRY_ADAPTER_TOKEN,
      useClass: RedisTelemetryAdapter,
    },
    // Gateway
    TelemetryGateway,
  ],
  exports: [TelemetryGateway],
})
export class TelemetryModule {}
