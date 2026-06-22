import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ProcessIngestUseCase } from '@/ingest/application/use-cases/process-ingest.use-case';
import { IngestBodyDto } from './dto/ingest.dto';
import { ApiKeyGuard } from './guards/api-key.guard';

@ApiTags('Ingest')
@UseGuards(ThrottlerGuard)
@UseGuards(ApiKeyGuard)
@Throttle({ short: { limit: 10, ttl: 1000 }, long: { limit: 60, ttl: 60000 } })
@Controller('ingest')
export class IngestController {
  constructor(private readonly processIngestUseCase: ProcessIngestUseCase) {}

  @ApiOperation({ summary: 'Ingest IoT sensor data (device-triggered)' })
  @ApiResponse({ status: 202, description: 'Data accepted for processing' })
  @ApiResponse({ status: 401, description: 'API Key missing or invalid' })
  @ApiBody({ type: Object, description: 'Sensor data payload' })
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestData(@Body() body: IngestBodyDto) {
    if (!body?.device?.api_key) {
      throw new UnauthorizedException('API Key missing');
    }
    return this.processIngestUseCase.execute(body);
  }
}
