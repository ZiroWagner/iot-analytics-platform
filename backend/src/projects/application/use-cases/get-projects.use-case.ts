import { Injectable, Inject } from '@nestjs/common';
import { Project } from '@/projects/domain/entities/project.entity';
import { PROJECT_REPOSITORY_TOKEN } from '@/projects/domain/repositories/project.repository.interface';
import type { ProjectRepositoryInterface } from '@/projects/domain/repositories/project.repository.interface';

@Injectable()
export class GetProjectsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: ProjectRepositoryInterface,
  ) {}

  async execute(userId: string): Promise<Project[]> {
    return this.projectRepository.findAllByUserId(userId);
  }
}
