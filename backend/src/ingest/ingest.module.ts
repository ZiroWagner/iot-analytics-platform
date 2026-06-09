import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';

// Controllers
import { IngestController } from '@/ingest/interfaces/http/ingest.controller';

// Guards
import { ApiKeyGuard } from '@/ingest/interfaces/http/guards/api-key.guard';

// Use Cases
import { ProcessIngestUseCase } from '@/ingest/application/use-cases/process-ingest.use-case';

// Repositories
import { INGEST_REPOSITORY_TOKEN } from '@/ingest/domain/repositories/ingest.repository.interface';
import { RedisIngestRepository } from '@/ingest/infrastructure/repositories/redis-ingest.repository';

// Infrastructure processors
import { StreamIngestProcessor } from '@/ingest/infrastructure/processors/stream-ingest.processor';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [IngestController],
  providers: [
    // Guards
    ApiKeyGuard,
    // Repositories
    {
      provide: INGEST_REPOSITORY_TOKEN,
      useClass: RedisIngestRepository,
    },
    // Use Cases
    ProcessIngestUseCase,
    // Infrastructure adapters
    StreamIngestProcessor,
  ],
})
export class IngestModule {}
