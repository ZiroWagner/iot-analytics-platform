import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      name: 'short',
      ttl: 1000,
      limit: 15,
    },
    {
      name: 'long',
      ttl: 60000,
      limit: 300,
    },
  ],
  errorMessage: 'Too many requests, please try again later.',
};
