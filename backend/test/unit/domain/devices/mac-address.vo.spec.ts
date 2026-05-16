import { MacAddress } from '@/devices/domain/entities/mac-address.vo';

describe('MacAddress Value Object', () => {
  it('creates a valid MAC address with colons', () => {
    const mac = MacAddress.create('00:1A:2B:3C:4D:5E');
    expect(mac.getValue()).toBe('00:1a:2b:3c:4d:5e');
  });

  it('normalizes dashes to colons and lowercases', () => {
    const mac = MacAddress.create('00-1A-2B-3C-4D-5E');
    expect(mac.getValue()).toBe('00:1a:2b:3c:4d:5e');
  });

  it('throws for an invalid MAC address', () => {
    expect(() => MacAddress.create('invalid')).toThrow(
      'Invalid MAC address format',
    );
  });

  it('throws for a partial MAC address', () => {
    expect(() => MacAddress.create('00:1A:2B')).toThrow(
      'Invalid MAC address format',
    );
  });

  describe('isValid', () => {
    it('returns true for valid colon-separated MAC', () => {
      expect(MacAddress.isValid('00:1a:2b:3c:4d:5e')).toBe(true);
    });

    it('returns false for invalid strings', () => {
      expect(MacAddress.isValid('not-a-mac')).toBe(false);
      expect(MacAddress.isValid('')).toBe(false);
    });
  });
});
