import { Controller, Get, Post, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetDashboardConfigUseCase } from '../../application/use-cases/get-dashboard-config.use-case';
import { SaveDashboardConfigUseCase } from '../../application/use-cases/save-dashboard-config.use-case';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

interface JwtUser {
  sub: string;
  email: string;
}

@ApiTags('Dashboards')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('dashboards/project')
export class DashboardsController {
  constructor(
    private readonly getDashboardConfigUseCase: GetDashboardConfigUseCase,
    private readonly saveDashboardConfigUseCase: SaveDashboardConfigUseCase,
  ) {}

  @ApiOperation({ summary: 'Get dashboard configuration for a project' })
  @ApiResponse({ status: 200, description: 'Dashboard configuration' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @Get(':projectId')
  async getConfig(@Req() req: { user: JwtUser }, @Param('projectId') projectId: string) {
    const config = await this.getDashboardConfigUseCase.execute(req.user.sub, projectId);
    console.log('DASHBOARD GET - projectId:', projectId, 'config:', JSON.stringify(config, null, 2));
    if (!config) {
      return { layout_config: [] };
    }
    return {
      id: config.id,
      projectId: config.projectId,
      layout_config: config.layoutConfig,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  @ApiOperation({ summary: 'Save dashboard configuration for a project' })
  @ApiResponse({ status: 200, description: 'Dashboard configuration saved' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiBody({ schema: { properties: { layoutConfig: { type: 'object', example: { widgets: [] } } } } })
  @HttpCode(HttpStatus.OK)
  @Post(':projectId')
  async saveConfig(
    @Req() req: { user: JwtUser },
    @Param('projectId') projectId: string,
    @Body() body: { layoutConfig: Record<string, unknown> },
  ) {
    console.log('DASHBOARD POST - projectId:', projectId, 'body:', JSON.stringify(body, null, 2));
    const config = await this.saveDashboardConfigUseCase.execute(req.user.sub, projectId, body.layoutConfig);
    console.log('DASHBOARD POST - saved config:', JSON.stringify(config, null, 2));
    return {
      id: config.id,
      projectId: config.projectId,
      layout_config: config.layoutConfig,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}