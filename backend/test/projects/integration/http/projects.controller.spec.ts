import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from '../../../../src/projects/interfaces/http/projects.controller';
import { CreateProjectUseCase } from '../../../../src/projects/application/use-cases/create-project.use-case';
import { GetProjectsUseCase } from '../../../../src/projects/application/use-cases/get-projects.use-case';
import { GetProjectUseCase } from '../../../../src/projects/application/use-cases/get-project.use-case';
import { UpdateProjectUseCase } from '../../../../src/projects/application/use-cases/update-project.use-case';
import { DeleteProjectUseCase } from '../../../../src/projects/application/use-cases/delete-project.use-case';
import { GetProjectOverviewUseCase } from '../../../../src/projects/application/use-cases/get-project-overview.use-case';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let createUseCase: any;

  const mockUser = { sub: 'user-123', email: 'test@example.com' };
  const mockProject = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'Desc',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    createUseCase = { execute: jest.fn().mockResolvedValue(mockProject) };
    const getProjectsUseCase = { execute: jest.fn().mockResolvedValue([mockProject]) };
    const getProjectUseCase = { execute: jest.fn().mockResolvedValue(mockProject) };
    const updateUseCase = { execute: jest.fn().mockResolvedValue(mockProject) };
    const deleteUseCase = { execute: jest.fn().mockResolvedValue({ success: true }) };
    const getOverviewUseCase = { execute: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: CreateProjectUseCase, useValue: createUseCase },
        { provide: GetProjectsUseCase, useValue: getProjectsUseCase },
        { provide: GetProjectUseCase, useValue: getProjectUseCase },
        { provide: UpdateProjectUseCase, useValue: updateUseCase },
        { provide: DeleteProjectUseCase, useValue: deleteUseCase },
        { provide: GetProjectOverviewUseCase, useValue: getOverviewUseCase },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call createProjectUseCase', async () => {
      const dto = { name: 'Test Project', description: 'Desc' };
      const result = await controller.create({ user: mockUser }, dto);
      expect(createUseCase.execute).toHaveBeenCalledWith(mockUser.sub, dto);
      expect(result).toEqual(mockProject);
    });
  });

  describe('findAll', () => {
    it('should return mapped projects', async () => {
      const result = await controller.findAll({ user: mockUser });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockProject.id);
    });
  });
});
