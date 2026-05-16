import { HealthController } from '@/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('should return health status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.uptime).toBeGreaterThan(0);
  });

  it('should return ready status', () => {
    const result = controller.ready();
    expect(result.status).toBe('ready');
  });
});
