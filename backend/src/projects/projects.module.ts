import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';

// Controllers
import { ProjectsController } from './interfaces/http/projects.controller';

// Use Cases
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case';
import { GetProjectsUseCase } from './application/use-cases/get-projects.use-case';
import { GetProjectUseCase } from './application/use-cases/get-project.use-case';
import { UpdateProjectUseCase } from './application/use-cases/update-project.use-case';
import { DeleteProjectUseCase } from './application/use-cases/delete-project.use-case';
import { GetProjectOverviewUseCase } from './application/use-cases/get-project-overview.use-case';

// Repositories
import { PROJECT_REPOSITORY_TOKEN } from './domain/repositories/project.repository.interface';
import { PrismaProjectRepository } from './infrastructure/repositories/prisma-project.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController],
  providers: [
    // Repositories
    {
      provide: PROJECT_REPOSITORY_TOKEN,
      useClass: PrismaProjectRepository,
    },
    // Use Cases
    CreateProjectUseCase,
    GetProjectsUseCase,
    GetProjectUseCase,
    UpdateProjectUseCase,
    DeleteProjectUseCase,
    GetProjectOverviewUseCase,
  ],
  exports: [PROJECT_REPOSITORY_TOKEN],
})
export class ProjectsModule {}
