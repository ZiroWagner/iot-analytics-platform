import { Project } from '../../../../../src/projects/domain/entities/project.entity';

describe('Project Entity', () => {
  const validProps = {
    id: 'proj-123',
    name: 'Test Project',
    description: 'A test description',
    userId: 'user-456',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a valid project instance', () => {
      const project = Project.create(validProps);

      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(validProps.id);
      expect(project.name).toBe(validProps.name);
      expect(project.description).toBe(validProps.description);
      expect(project.userId).toBe(validProps.userId);
    });

    it('should throw an error if name is too short', () => {
      expect(() => {
        Project.create({ ...validProps, name: 'Ab' });
      }).toThrow('Project name must be at least 3 characters');
    });

    it('should throw an error if name is empty', () => {
      expect(() => {
        Project.create({ ...validProps, name: '' });
      }).toThrow('Project name must be at least 3 characters');
    });
  });

  describe('update', () => {
    let project: Project;

    beforeEach(() => {
      project = Project.create(validProps);
    });

    it('should update name and description', () => {
      project.update('New Name', 'New Description');
      expect(project.name).toBe('New Name');
      expect(project.description).toBe('New Description');
    });

    it('should update only name', () => {
      project.update('New Name');
      expect(project.name).toBe('New Name');
      expect(project.description).toBe(validProps.description);
    });

    it('should update only description', () => {
      project.update(undefined, 'New Description');
      expect(project.name).toBe(validProps.name);
      expect(project.description).toBe('New Description');
    });

    it('should throw an error if updated name is too short', () => {
      expect(() => {
        project.update('Ab');
      }).toThrow('Project name must be at least 3 characters');
    });

    it('should allow setting description to null', () => {
      project.update(undefined, null);
      expect(project.description).toBeNull();
    });
  });
});
