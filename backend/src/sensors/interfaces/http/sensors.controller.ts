import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { UpdateSensorDto } from './dto/update-sensor.dto';
import { CreateSensorUseCase } from '@/sensors/application/use-cases/create-sensor.use-case';
import { GetSensorsByDeviceUseCase } from '@/sensors/application/use-cases/get-sensors-by-device.use-case';
import { GetSensorUseCase } from '@/sensors/application/use-cases/get-sensor.use-case';
import { UpdateSensorUseCase } from '@/sensors/application/use-cases/update-sensor.use-case';
import { DeleteSensorUseCase } from '@/sensors/application/use-cases/delete-sensor.use-case';
import { GetSensorDataPointsUseCase } from '@/sensors/application/use-cases/get-sensor-data-points.use-case';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

interface JwtUser {
  sub: string;
  email: string;
}

@ApiTags('Sensors')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard)
@UseGuards(AuthGuard('jwt'))
@Controller('sensors')
export class SensorsController {
  constructor(
    private readonly createSensorUseCase: CreateSensorUseCase,
    private readonly getSensorsByDeviceUseCase: GetSensorsByDeviceUseCase,
    private readonly getSensorUseCase: GetSensorUseCase,
    private readonly updateSensorUseCase: UpdateSensorUseCase,
    private readonly deleteSensorUseCase: DeleteSensorUseCase,
    private readonly getSensorDataPointsUseCase: GetSensorDataPointsUseCase,
  ) {}

  @ApiOperation({ summary: 'Create a new sensor' })
  @ApiResponse({ status: 201, description: 'Sensor created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateSensorDto })
  @Post()
  async create(@Req() req: { user: JwtUser }, @Body() body: CreateSensorDto) {
    return this.createSensorUseCase.execute(req.user.sub, body);
  }

  @ApiOperation({ summary: 'Get all sensors by device' })
  @ApiResponse({ status: 200, description: 'List of sensors' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @Get('device/:deviceId')
  async findByDevice(
    @Req() req: { user: JwtUser },
    @Param('deviceId') deviceId: string,
  ) {
    return this.getSensorsByDeviceUseCase.execute(req.user.sub, deviceId);
  }

  @ApiOperation({ summary: 'Get a sensor by ID' })
  @ApiResponse({ status: 200, description: 'Sensor details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  @ApiParam({ name: 'id', description: 'Sensor ID' })
  @Get(':id')
  async findOne(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.getSensorUseCase.execute(req.user.sub, id);
  }

  @ApiOperation({ summary: 'Get sensor data points' })
  @ApiResponse({ status: 200, description: 'Sensor data points' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  @ApiParam({ name: 'id', description: 'Sensor ID' })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO 8601)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max number of points',
  })
  @Get(':id/data')
  async getDataPoints(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.getSensorDataPointsUseCase.execute(req.user.sub, id, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @ApiOperation({ summary: 'Update a sensor' })
  @ApiResponse({ status: 200, description: 'Sensor updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  @ApiParam({ name: 'id', description: 'Sensor ID' })
  @ApiBody({ type: UpdateSensorDto })
  @Patch(':id')
  async update(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() body: UpdateSensorDto,
  ) {
    return this.updateSensorUseCase.execute(req.user.sub, id, body);
  }

  @ApiOperation({ summary: 'Delete a sensor' })
  @ApiResponse({ status: 200, description: 'Sensor deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  @ApiParam({ name: 'id', description: 'Sensor ID' })
  @Delete(':id')
  async remove(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    await this.deleteSensorUseCase.execute(req.user.sub, id);
    return { success: true };
  }
}
