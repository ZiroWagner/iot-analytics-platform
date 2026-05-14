export class MacAddress {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): MacAddress {
    const normalized = MacAddress.normalize(value);
    if (!MacAddress.isValid(normalized)) {
      throw new Error('Invalid MAC address format');
    }
    return new MacAddress(normalized);
  }

  static isValid(value: string): boolean {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(value);
  }

  private static normalize(value: string): string {
    return value.replace(/-/g, ':').toLowerCase();
  }

  getValue(): string {
    return this.value;
  }
}
