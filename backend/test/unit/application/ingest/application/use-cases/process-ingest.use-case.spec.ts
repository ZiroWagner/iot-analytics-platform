import { Test, TestingModule } from '@nestjs/testing';
import { ProcessIngestUseCase } from '@/ingest/application/use-cases/process-ingest.use-case';
import { INGEST_REPOSITORY_TOKEN } from '@/ingest/domain/repositories/ingest.repository.interface';
import { UnauthorizedException } from '@nestjs/common';

describe('ProcessIngestUseCase', () => {
  let useCase: ProcessIngestUseCase;
  let repository: any;

  beforeEach(async () => {
    repository = {
      resolveDeviceId: jest.fn().mockResolvedValue('d123'),
      resolveProjectId: jest.fn().mockResolvedValue('p123'),
      publishToStream: jest.fn().mockResolvedValue(undefined),
      updateDeviceState: jest.fn().mockResolvedValue(undefined),
      broadcastTelemetry: jest.fn().mockResolvedValue(undefined),
      incrementEps: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessIngestUseCase,
        { provide: INGEST_REPOSITORY_TOKEN, useValue: repository },
      ],
    }).compile();

    useCase = module.get<ProcessIngestUseCase>(ProcessIngestUseCase);
  });

  it('should process a valid ingest payload', async () => {
    const payload = {
      device: { api_key: 'key1' },
      sensors: [{ sensor_id: 's1', payload: { v: 10 } }],
    };

    const result = await useCase.execute(payload);

    expect(result.status).toBe('accepted');
    expect(repository.resolveDeviceId).toHaveBeenCalledWith('key1');
    expect(repository.publishToStream).toHaveBeenCalled();
    expect(repository.updateDeviceState).toHaveBeenCalled();
    expect(repository.broadcastTelemetry).toHaveBeenCalled();
    expect(repository.incrementEps).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if validation fails', async () => {
    const payload = {
      device: { api_key: '' },
      sensors: [],
    };

    await expect(useCase.execute(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return accepted but do nothing if no sensors', async () => {
    const payload = {
      device: { api_key: 'key1' },
      sensors: [],
    };

    const result = await useCase.execute(payload);
    expect(result.message).toBe('No sensors data to ingest');
    expect(repository.publishToStream).not.toHaveBeenCalled();
  });
});
