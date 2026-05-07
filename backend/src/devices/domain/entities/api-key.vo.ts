import * as crypto from 'crypto';

export class ApiKey {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): ApiKey {
    const uniqueHash = crypto.randomBytes(16).toString('hex');
    return new ApiKey(`iot_${uniqueHash}`);
  }

  getValue(): string {
    return this.value;
  }
}