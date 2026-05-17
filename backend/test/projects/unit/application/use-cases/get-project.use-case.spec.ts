import { Test, TestingModule } from '@nestjs/testing';
import { GetProjectUseCase } from '../../../../../src/projects/application/use-cases/get-project.use-case';
import { PROJECT_REPOSITORY_TOKEN } from '../../../../../src/projects/domain/repositories/project.repository.interface';
import { Project } from '../../../../../src/projects/domain/entities/project.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('GetProjectUseCase', () => {
  let useCase: GetProjectUseCase;
  let repository: any;

  const mockProject = new Project(
    'proj-123',
    'Test Project',
    'Description',
    'user-456',
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProjectUseCase,
        {
          provide: PROJECT_REPOSITORY_TOKEN,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<GetProjectUseCase>(GetProjectUseCase);
  });

  it('should return the project if found and owned by user', async () => {
    repository.findById.mockResolvedValue(mockProject);

    const result = await useCase.execute('user-456', 'proj-123');

    expect(result).toBe(mockProject);
    expect(repository.findById).toHaveBeenCalledWith('proj-123');
  });

  it('should throw NotFoundException if project does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('user-456', 'proj-123')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw ForbiddenException if project is not owned by user', async () => {
    repository.findById.mockResolvedValue(mockProject);

    await expect(useCase.execute('other-user', 'proj-123')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
