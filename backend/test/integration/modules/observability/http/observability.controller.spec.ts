import { Test, TestingModule } from '@nestjs/testing';
import { ObservabilityController } from '@/observability/interfaces/http/observability.controller';
import { GetSystemMetricsUseCase } from '@/observability/application/use-cases/get-system-metrics.use-case';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('ObservabilityController', () => {
  let controller: ObservabilityController;
  let useCase: any;

  beforeEach(async () => {
    useCase = { execute: jest.fn().mockResolvedValue({ streamSize: 10 }) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObservabilityController],
      providers: [{ provide: GetSystemMetricsUseCase, useValue: useCase }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ObservabilityController>(ObservabilityController);
  });

  it('should call useCase with userId from request', async () => {
    const mockUser = { sub: 'u1', email: 'test@example.com' };
    const result = await controller.getMetrics({ user: mockUser });

    expect(useCase.execute).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ streamSize: 10 });
  });
});
