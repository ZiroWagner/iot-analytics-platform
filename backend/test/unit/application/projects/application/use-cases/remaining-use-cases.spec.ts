import { Test, TestingModule } from '@nestjs/testing';
import { DeleteProjectUseCase } from '@/projects/application/use-cases/delete-project.use-case';
import { UpdateProjectUseCase } from '@/projects/application/use-cases/update-project.use-case';
import { GetProjectsUseCase } from '@/projects/application/use-cases/get-projects.use-case';
import { GetProjectOverviewUseCase } from '@/projects/application/use-cases/get-project-overview.use-case';
import { PROJECT_REPOSITORY_TOKEN } from '@/projects/domain/repositories/project.repository.interface';
import { Project } from '@/projects/domain/entities/project.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('Remaining Use Cases', () => {
  let repository: any;
  const mockProject = new Project(
    'proj-1',
    'Name',
    'Desc',
    'user-1',
    new Date(),
    new Date(),
  );

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      findAllByUserId: jest.fn(),
      getOverviewMetrics: jest.fn(),
    };
  });

  describe('DeleteProjectUseCase', () => {
    let useCase: DeleteProjectUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          DeleteProjectUseCase,
          { provide: PROJECT_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<DeleteProjectUseCase>(DeleteProjectUseCase);
    });

    it('should delete project if found and owned by user', async () => {
      repository.findById.mockResolvedValue(mockProject);
      await useCase.execute('user-1', 'proj-1');
      expect(repository.delete).toHaveBeenCalledWith('proj-1');
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(useCase.execute('user-1', 'proj-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('UpdateProjectUseCase', () => {
    let useCase: UpdateProjectUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          UpdateProjectUseCase,
          { provide: PROJECT_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<UpdateProjectUseCase>(UpdateProjectUseCase);
    });

    it('should update project if valid', async () => {
      repository.findById.mockResolvedValue(mockProject);
      repository.update.mockResolvedValue({ ...mockProject, name: 'Updated' });
      const result = await useCase.execute('user-1', 'proj-1', {
        name: 'Updated',
      });
      expect(repository.update).toHaveBeenCalled();
      expect(result.name).toBe('Updated');
    });
  });

  describe('GetProjectsUseCase', () => {
    let useCase: GetProjectsUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          GetProjectsUseCase,
          { provide: PROJECT_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<GetProjectsUseCase>(GetProjectsUseCase);
    });

    it('should return all projects for user', async () => {
      repository.findAllByUserId.mockResolvedValue([mockProject]);
      const result = await useCase.execute('user-1');
      expect(result).toEqual([mockProject]);
      expect(repository.findAllByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('GetProjectOverviewUseCase', () => {
    let useCase: GetProjectOverviewUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          GetProjectOverviewUseCase,
          { provide: PROJECT_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<GetProjectOverviewUseCase>(
        GetProjectOverviewUseCase,
      );
    });

    it('should return overview metrics', async () => {
      const metrics = { totalProjects: 1, totalDevices: 5 };
      repository.getOverviewMetrics.mockResolvedValue(metrics);
      const result = await useCase.execute('user-1');
      expect(result).toBe(metrics);
    });
  });
});
