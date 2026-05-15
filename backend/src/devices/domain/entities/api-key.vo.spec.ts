import { ApiKey } from '../entities/api-key.vo';

describe('ApiKey Value Object', () => {
  it('generates a key with the iot_ prefix', () => {
    const key = ApiKey.generate();
    expect(key.getValue()).toMatch(/^iot_[0-9a-f]{32}$/);
  });

  it('generates unique keys on each call', () => {
    const key1 = ApiKey.generate();
    const key2 = ApiKey.generate();
    expect(key1.getValue()).not.toBe(key2.getValue());
  });
});
