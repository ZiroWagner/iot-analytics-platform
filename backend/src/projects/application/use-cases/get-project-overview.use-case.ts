import { Injectable, Inject } from '@nestjs/common';
import { PROJECT_REPOSITORY_TOKEN } from '@/projects/domain/repositories/project.repository.interface';
import type { ProjectRepositoryInterface } from '@/projects/domain/repositories/project.repository.interface';

@Injectable()
export class GetProjectOverviewUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: ProjectRepositoryInterface,
  ) {}

  async execute(userId: string) {
    return this.projectRepository.getOverviewMetrics(userId);
  }
}
