import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PROJECT_REPOSITORY_TOKEN } from '../../domain/repositories/project.repository.interface';
import type { ProjectRepositoryInterface } from '../../domain/repositories/project.repository.interface';

@Injectable()
export class DeleteProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: ProjectRepositoryInterface,
  ) {}

  async execute(userId: string, projectId: string): Promise<void> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    
    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    await this.projectRepository.delete(projectId);
  }
}
