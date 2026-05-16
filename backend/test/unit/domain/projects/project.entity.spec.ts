import { Project } from '@/projects/domain/entities/project.entity';

describe('Project Entity', () => {
  const validProps = {
    id: 'p1',
    name: 'IoT Farm',
    description: 'Smart agriculture project',
    userId: 'u1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  describe('create', () => {
    it('creates a project with valid properties', () => {
      const project = Project.create(validProps);
      expect(project.id).toBe('p1');
      expect(project.name).toBe('IoT Farm');
      expect(project.description).toBe('Smart agriculture project');
      expect(project.userId).toBe('u1');
    });

    it('creates a project with optional deviceCount', () => {
      const project = Project.create({ ...validProps, deviceCount: 5 });
      expect(project._deviceCount).toBe(5);
    });

    it('throws if name is shorter than 3 characters', () => {
      expect(() => Project.create({ ...validProps, name: 'ab' })).toThrow(
        'Project name must be at least 3 characters',
      );
    });

    it('throws if name is empty', () => {
      expect(() => Project.create({ ...validProps, name: '' })).toThrow(
        'Project name must be at least 3 characters',
      );
    });

    it('throws if name is only whitespace', () => {
      expect(() => Project.create({ ...validProps, name: '  ' })).toThrow(
        'Project name must be at least 3 characters',
      );
    });
  });

  describe('update', () => {
    it('updates the name', () => {
      const project = Project.create(validProps);
      project.update('New Name');
      expect(project.name).toBe('New Name');
    });

    it('updates the description', () => {
      const project = Project.create(validProps);
      project.update(undefined, 'Updated description');
      expect(project.description).toBe('Updated description');
    });

    it('sets description to null', () => {
      const project = Project.create(validProps);
      project.update(undefined, null);
      expect(project.description).toBeNull();
    });

    it('throws if updated name is too short', () => {
      const project = Project.create(validProps);
      expect(() => project.update('ab')).toThrow(
        'Project name must be at least 3 characters',
      );
    });

    it('does not change name when undefined is passed', () => {
      const project = Project.create(validProps);
      project.update();
      expect(project.name).toBe('IoT Farm');
    });
  });
});
