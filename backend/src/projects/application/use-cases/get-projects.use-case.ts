import { Injectable, Inject } from '@nestjs/common';
import { Project } from '../../domain/entities/project.entity';
import { PROJECT_REPOSITORY_TOKEN } from '../../domain/repositories/project.repository.interface';
import type { ProjectRepositoryInterface } from '../../domain/repositories/project.repository.interface';

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
