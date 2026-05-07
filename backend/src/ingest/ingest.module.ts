import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

// Controllers
import { IngestController } from './interfaces/http/ingest.controller';

// Use Cases
import { ProcessIngestUseCase } from './application/use-cases/process-ingest.use-case';

// Repositories
import { INGEST_REPOSITORY_TOKEN } from './domain/repositories/ingest.repository.interface';
import { RedisIngestRepository } from './infrastructure/repositories/redis-ingest.repository';

// Infrastructure processors
import { StreamIngestProcessor } from './infrastructure/processors/stream-ingest.processor';

@Module({
    imports: [PrismaModule, RedisModule],
    controllers: [IngestController],
    providers: [
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