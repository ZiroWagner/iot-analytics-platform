import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, HttpException } from '@nestjs/common';
import { ApiKeyGuard } from '@/ingest/interfaces/http/guards/api-key.guard';
import { RedisService } from '@/redis/redis.service';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let redisClient: any;

  function mockContext(body: any): any {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ body }),
      }),
    };
  }

  beforeEach(async () => {
    redisClient = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        { provide: RedisService, useValue: { client: redisClient } },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
  });

  it('returns true when no api_key in body', async () => {
    const result = await guard.canActivate(mockContext({}));
    expect(result).toBe(true);
  });

  it('returns true when api_key is not a string', async () => {
    const result = await guard.canActivate(
      mockContext({ device: { api_key: 123 } }),
    );
    expect(result).toBe(true);
  });

  it('returns true when cachedId exists', async () => {
    redisClient.get.mockImplementation((key: string) => {
      if (key.startsWith('device:apikey:')) return Promise.resolve('d1');
      return Promise.resolve(null);
    });

    const result = await guard.canActivate(
      mockContext({ device: { api_key: 'valid-key' } }),
    );
    expect(result).toBe(true);
  });

  it('throws UnauthorizedException when key is marked invalid', async () => {
    redisClient.get.mockImplementation((key: string) => {
      if (key.startsWith('device:apikey:')) return Promise.resolve(null);
      if (key.startsWith('device:invalidkey:')) return Promise.resolve('1');
      return Promise.resolve(null);
    });

    await expect(
      guard.canActivate(mockContext({ device: { api_key: 'invalid-key' } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns true when no cache and not invalid', async () => {
    redisClient.get.mockResolvedValue(null);

    const result = await guard.canActivate(
      mockContext({ device: { api_key: 'unknown-key' } }),
    );
    expect(result).toBe(true);
  });

  it('returns true on non-HttpException errors', async () => {
    redisClient.get.mockRejectedValue(new Error('Redis down'));

    const result = await guard.canActivate(
      mockContext({ device: { api_key: 'any-key' } }),
    );
    expect(result).toBe(true);
  });

  it('re-throws HttpException errors', async () => {
    redisClient.get.mockRejectedValue(
      new UnauthorizedException('Auth error from below'),
    );

    await expect(
      guard.canActivate(mockContext({ device: { api_key: 'any-key' } })),
    ).rejects.toThrow(UnauthorizedException);
  });
});
