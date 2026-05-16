import { Test, TestingModule } from '@nestjs/testing';
import { IngestController } from '@/ingest/interfaces/http/ingest.controller';
import { ProcessIngestUseCase } from '@/ingest/application/use-cases/process-ingest.use-case';
import { UnauthorizedException } from '@nestjs/common';

describe('IngestController', () => {
  let controller: IngestController;
  let useCase: any;

  beforeEach(async () => {
    useCase = { execute: jest.fn().mockResolvedValue({ status: 'accepted' }) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestController],
      providers: [{ provide: ProcessIngestUseCase, useValue: useCase }],
    }).compile();

    controller = module.get<IngestController>(IngestController);
  });

  it('should call useCase if apiKey is present', async () => {
    const body = { device: { api_key: 'key1' }, sensors: [] };
    const result = await controller.ingestData(body as any);
    expect(result).toEqual({ status: 'accepted' });
    expect(useCase.execute).toHaveBeenCalledWith(body);
  });

  it('should throw UnauthorizedException if apiKey is missing', async () => {
    const body = { device: { api_key: '' }, sensors: [] };
    await expect(controller.ingestData(body as any)).rejects.toThrow(UnauthorizedException);
  });
});
