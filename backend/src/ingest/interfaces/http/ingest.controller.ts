import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ProcessIngestUseCase } from '../../application/use-cases/process-ingest.use-case';
import { IngestBodyDto } from './dto/ingest.dto';

@ApiTags('Ingest')
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
