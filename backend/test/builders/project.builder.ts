import { Project } from '../../src/projects/domain/entities/project.entity';

export class ProjectBuilder {
  private props = {
    id: 'proj_123',
    name: 'Default Test Project',
    description: 'Project created by ProjectBuilder',
    userId: 'user_123',
    deviceCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  static aProject() {
    return new ProjectBuilder();
  }

  withName(name: string) {
    this.props.name = name;
    return this;
  }

  withOwner(userId: string) {
    this.props.userId = userId;
    return this;
  }

  build(): Project {
    return Project.create(this.props);
  }

  buildProps() {
    return { ...this.props };
  }
}
