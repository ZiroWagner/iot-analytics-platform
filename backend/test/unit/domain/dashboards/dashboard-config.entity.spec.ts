import { DashboardConfig } from '@/dashboards/domain/entities/dashboard-config.entity';
import { testData } from '@test/utils/test-data';

describe('DashboardConfig Entity', () => {
  const validProps = {
    id: testData.uuid(),
    projectId: testData.uuid(),
    layoutConfig: { widgets: [{ type: 'chart', x: 0, y: 0 }] },
  };

  describe('create', () => {
    it('creates a dashboard config with valid properties', () => {
      const config = DashboardConfig.create(validProps);
      expect(config.id).toBe(validProps.id);
      expect(config.projectId).toBe(validProps.projectId);
      expect(config.layoutConfig).toEqual(validProps.layoutConfig);
      expect(config.createdAt).toBeInstanceOf(Date);
      expect(config.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a dashboard config with empty layoutConfig', () => {
      const config = DashboardConfig.create({
        ...validProps,
        layoutConfig: {},
      });
      expect(config.layoutConfig).toEqual({});
    });

    it('creates a dashboard config with nested layoutConfig', () => {
      const layoutConfig = {
        widgets: [
          { id: 'w1', type: 'line', x: 0, y: 0, w: 6, h: 4 },
          { id: 'w2', type: 'bar', x: 6, y: 0, w: 6, h: 4 },
        ],
        settings: { theme: 'dark', autoRefresh: 30 },
      };
      const config = DashboardConfig.create({ ...validProps, layoutConfig });
      expect(config.layoutConfig).toEqual(layoutConfig);
    });
  });

  describe('createFromPersistence', () => {
    it('reconstructs a dashboard config from persisted data', () => {
      const now = new Date('2026-01-15T10:00:00Z');
      const config = DashboardConfig.createFromPersistence({
        id: 'cfg-1',
        projectId: 'proj-1',
        layoutConfig: { widgets: [] },
        createdAt: now,
        updatedAt: now,
      });
      expect(config.id).toBe('cfg-1');
      expect(config.projectId).toBe('proj-1');
      expect(config.createdAt).toEqual(now);
      expect(config.updatedAt).toEqual(now);
    });
  });

  describe('updateLayout', () => {
    it('updates the layout config', () => {
      const config = DashboardConfig.create(validProps);
      const newLayout = { widgets: [{ type: 'gauge', x: 0, y: 0 }] };
      config.updateLayout(newLayout);
      expect(config.layoutConfig).toEqual(newLayout);
    });

    it('replaces the entire layout config', () => {
      const config = DashboardConfig.create(validProps);
      config.updateLayout({});
      expect(config.layoutConfig).toEqual({});
    });
  });
});
