import { Test, TestingModule } from '@nestjs/testing';
import { PrismaUserRepository } from '@/auth/infrastructure/repositories/prisma-user.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { User } from '@/auth/domain/entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('PrismaUserRepository Integration', () => {
  let repository: PrismaUserRepository;
  let prismaService: any;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaUserRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = module.get<PrismaUserRepository>(PrismaUserRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      const dbUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        password: 'hash',
      };
      prismaMock.user.findUnique.mockResolvedValue(dbUser);

      const result = await repository.findByEmail('test@example.com');
      expect(result).toBeInstanceOf(User);
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null if not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const result = await repository.findByEmail('none@example.com');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should hash password and create user', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const dbUser = { id: '1', email: 'test@example.com', password: 'hashed' };
      prismaMock.user.create.mockResolvedValue(dbUser);

      const result = await repository.create({
        email: 'test@example.com',
        password: '123',
      });
      expect(result).toBeInstanceOf(User);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed',
          name: undefined,
        },
      });
    });
  });

  describe('findOrCreateOAuthUser', () => {
    it('should return existing user if account exists', async () => {
      const dbAccount = { user: { id: 'u1', email: 'o@o.com' } };
      prismaMock.account.findUnique.mockResolvedValue(dbAccount);

      const result = await repository.findOrCreateOAuthUser({
        provider: 'google',
        providerAccountId: '123',
        email: 'o@o.com',
        name: 'O',
        image: null,
        accessToken: 'tk',
        refreshToken: 'rt',
      });

      expect(result.id).toBe('u1');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('should link to existing user if email matches but account is new', async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'existing@o.com' });
      prismaMock.account.create.mockResolvedValue({});

      const result = await repository.findOrCreateOAuthUser({
        provider: 'google',
        providerAccountId: 'g1',
        email: 'existing@o.com',
        name: 'Existing',
        image: null,
        accessToken: null,
        refreshToken: null,
      });

      expect(result.id).toBe('u1');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(prismaMock.account.create).toHaveBeenCalled();
    });

    it('should handle OAuth without email', async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({ id: 'u3', email: '' });
      
      const result = await repository.findOrCreateOAuthUser({
        provider: 'github',
        providerAccountId: 'gh2',
        email: null,
        name: 'NoEmail',
        image: 'img',
        accessToken: 'tk',
        refreshToken: 'rt',
      });

      expect(result.id).toBe('u3');
      expect(prismaMock.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ email: '' })
      }));
    });
  });
});
