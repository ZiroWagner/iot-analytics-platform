import { Test, TestingModule } from '@nestjs/testing';
import { CreateProjectUseCase } from '@/projects/application/use-cases/create-project.use-case';
import { PROJECT_REPOSITORY_TOKEN } from '@/projects/domain/repositories/project.repository.interface';
import { Project } from '@/projects/domain/entities/project.entity';

describe('CreateProjectUseCase', () => {
  let useCase: CreateProjectUseCase;
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
      create: jest.fn().mockResolvedValue(mockProject),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProjectUseCase,
        {
          provide: PROJECT_REPOSITORY_TOKEN,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<CreateProjectUseCase>(CreateProjectUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should call repository.create with correct data', async () => {
    const userId = 'user-456';
    const data = { name: 'Test Project', description: 'Description' };

    const result = await useCase.execute(userId, data);

    expect(repository.create).toHaveBeenCalledWith({
      userId,
      name: data.name,
      description: data.description,
    });
    expect(result).toBe(mockProject);
  });

  it('should use null if description is not provided', async () => {
    const userId = 'user-456';
    const data = { name: 'Test Project' };

    await useCase.execute(userId, data);

    expect(repository.create).toHaveBeenCalledWith({
      userId,
      name: data.name,
      description: null,
    });
  });
});
