import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockReturnValue('postgresql://user:pass@localhost:5432/db'),
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have lifecycle methods', () => {
    expect(typeof service.onModuleInit).toBe('function');
    expect(typeof service.onModuleDestroy).toBe('function');
  });
});
