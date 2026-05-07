import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { CreateDeviceUseCase } from '../../application/use-cases/create-device.use-case';
import { GetDevicesByProjectUseCase } from '../../application/use-cases/get-devices-by-project.use-case';
import { GetDeviceUseCase } from '../../application/use-cases/get-device.use-case';
import { UpdateDeviceUseCase } from '../../application/use-cases/update-device.use-case';
import { DeleteDeviceUseCase } from '../../application/use-cases/delete-device.use-case';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

interface JwtUser {
  sub: string;
  email: string;
}

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('devices')
export class DevicesController {
  constructor(
    private readonly createDeviceUseCase: CreateDeviceUseCase,
    private readonly getDevicesByProjectUseCase: GetDevicesByProjectUseCase,
    private readonly getDeviceUseCase: GetDeviceUseCase,
    private readonly updateDeviceUseCase: UpdateDeviceUseCase,
    private readonly deleteDeviceUseCase: DeleteDeviceUseCase,
  ) {}

  @ApiOperation({ summary: 'Create a new device' })
  @ApiResponse({ status: 201, description: 'Device created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateDeviceDto })
  @Post()
  async create(@Req() req: { user: JwtUser }, @Body() body: CreateDeviceDto) {
    return this.createDeviceUseCase.execute(req.user.sub, body);
  }

  @ApiOperation({ summary: 'Get all devices by project' })
  @ApiResponse({ status: 200, description: 'List of devices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @Get('project/:projectId')
  async findByProject(@Req() req: { user: JwtUser }, @Param('projectId') projectId: string) {
    return this.getDevicesByProjectUseCase.execute(req.user.sub, projectId);
  }

  @ApiOperation({ summary: 'Get a device by ID' })
  @ApiResponse({ status: 200, description: 'Device details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiParam({ name: 'id', description: 'Device ID' })
  @Get(':id')
  async findOne(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.getDeviceUseCase.execute(req.user.sub, id);
  }

  @ApiOperation({ summary: 'Update a device' })
  @ApiResponse({ status: 200, description: 'Device updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiParam({ name: 'id', description: 'Device ID' })
  @ApiBody({ type: UpdateDeviceDto })
  @Patch(':id')
  async update(@Req() req: { user: JwtUser }, @Param('id') id: string, @Body() body: UpdateDeviceDto) {
    return this.updateDeviceUseCase.execute(req.user.sub, id, body);
  }

  @ApiOperation({ summary: 'Delete a device' })
  @ApiResponse({ status: 200, description: 'Device deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiParam({ name: 'id', description: 'Device ID' })
  @Delete(':id')
  async remove(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    await this.deleteDeviceUseCase.execute(req.user.sub, id);
    return { success: true };
  }
}