import { throttlerConfig } from '@/config/throttler.config';

describe('throttlerConfig', () => {
  it('should have two throttlers named short and long', () => {
    const names = throttlerConfig.throttlers.map((t) => t.name);
    expect(names).toContain('short');
    expect(names).toContain('long');
  });

  it('should have correct limits', () => {
    const short = throttlerConfig.throttlers.find((t) => t.name === 'short');
    const long = throttlerConfig.throttlers.find((t) => t.name === 'long');

    expect(short?.limit).toBe(15);
    expect(short?.ttl).toBe(1000);
    expect(long?.limit).toBe(300);
    expect(long?.ttl).toBe(60000);
  });

  it('should have an error message', () => {
    expect(throttlerConfig.errorMessage).toBeDefined();
    expect(throttlerConfig.errorMessage).toContain('Too many requests');
  });
});
