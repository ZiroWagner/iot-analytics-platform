import { Injectable, Inject } from '@nestjs/common';
import { Project } from '@/projects/domain/entities/project.entity';
import { PROJECT_REPOSITORY_TOKEN } from '@/projects/domain/repositories/project.repository.interface';
import type { ProjectRepositoryInterface } from '@/projects/domain/repositories/project.repository.interface';

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: ProjectRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    data: { name: string; description?: string },
  ): Promise<Project> {
    // Domain validation inside entity factory if needed
    return this.projectRepository.create({
      userId,
      name: data.name,
      description: data.description ?? null,
    });
  }
}
