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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateProjectUseCase } from '@/projects/application/use-cases/create-project.use-case';
import { GetProjectsUseCase } from '@/projects/application/use-cases/get-projects.use-case';
import { GetProjectUseCase } from '@/projects/application/use-cases/get-project.use-case';
import { UpdateProjectUseCase } from '@/projects/application/use-cases/update-project.use-case';
import { DeleteProjectUseCase } from '@/projects/application/use-cases/delete-project.use-case';
import { GetProjectOverviewUseCase } from '@/projects/application/use-cases/get-project-overview.use-case';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

interface JwtUser {
  sub: string;
  email: string;
}

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard)
@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly getProjectsUseCase: GetProjectsUseCase,
    private readonly getProjectUseCase: GetProjectUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
    private readonly deleteProjectUseCase: DeleteProjectUseCase,
    private readonly getProjectOverviewUseCase: GetProjectOverviewUseCase,
  ) {}

  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateProjectDto })
  @Post()
  async create(@Req() req: { user: JwtUser }, @Body() body: CreateProjectDto) {
    return this.createProjectUseCase.execute(req.user.sub, body);
  }

  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  async findAll(@Req() req: { user: JwtUser }) {
    const projects = await this.getProjectsUseCase.execute(req.user.sub);
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      userId: p.userId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      _count: {
        devices: p._deviceCount || 0,
      },
      devices: p.devices || [],
    }));
  }

  @ApiOperation({ summary: 'Get project overview statistics' })
  @ApiResponse({ status: 200, description: 'Project overview' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('overview')
  async getOverview(@Req() req: { user: JwtUser }) {
    return this.getProjectOverviewUseCase.execute(req.user.sub);
  }

  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @Get(':id')
  async findOne(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    const p = await this.getProjectUseCase.execute(req.user.sub, id);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      userId: p.userId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      _count: {
        devices: p._deviceCount || 0,
      },
      devices: p.devices || [],
    };
  }

  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiBody({ type: UpdateProjectDto })
  @Patch(':id')
  async update(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.updateProjectUseCase.execute(req.user.sub, id, body);
  }

  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @Delete(':id')
  async remove(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    await this.deleteProjectUseCase.execute(req.user.sub, id);
    return { success: true };
  }
}
