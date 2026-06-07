import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Project } from '@/projects/domain/entities/project.entity';
import { PROJECT_REPOSITORY_TOKEN } from '@/projects/domain/repositories/project.repository.interface';
import type { ProjectRepositoryInterface } from '@/projects/domain/repositories/project.repository.interface';

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: ProjectRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    projectId: string,
    data: { name?: string; description?: string },
  ): Promise<Project> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Apply domain rules if any
    project.update(data.name, data.description);

    return this.projectRepository.update(projectId, {
      name: project.name,
      description: project.description,
    });
  }
}
