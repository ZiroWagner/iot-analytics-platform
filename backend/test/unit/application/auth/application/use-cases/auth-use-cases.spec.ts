import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserUseCase } from '@/auth/application/use-cases/register-user.use-case';
import { ValidateUserUseCase } from '@/auth/application/use-cases/validate-user.use-case';
import { GenerateTokenUseCase } from '@/auth/application/use-cases/generate-token.use-case';
import { USER_REPOSITORY_TOKEN } from '@/auth/domain/repositories/user.repository.interface';
import { JwtService } from '@nestjs/jwt';
import { UserBuilder } from '../../../../../builders/user.builder';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('Auth Use Cases', () => {
  let repository: any;
  const mockUser = UserBuilder.aUser().build();

  beforeEach(() => {
    repository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByOAuth: jest.fn(),
      createOAuth: jest.fn(),
    };
  });

  describe('RegisterUserUseCase', () => {
    let useCase: RegisterUserUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          RegisterUserUseCase,
          { provide: USER_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
    });

    it('should register a new user', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockUser);

      const result = await useCase.execute({
        email: 'test@example.com',
        password: '123',
      });
      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user exists', async () => {
      repository.findByEmail.mockResolvedValue(mockUser);
      await expect(
        useCase.execute({ email: 'test@example.com', password: '123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('ValidateUserUseCase', () => {
    let useCase: ValidateUserUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          ValidateUserUseCase,
          { provide: USER_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<ValidateUserUseCase>(ValidateUserUseCase);
    });

    it('should validate user with correct password', async () => {
      repository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await useCase.execute('test@example.com', '123');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      repository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(useCase.execute('test@example.com', '123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      repository.findByEmail.mockResolvedValue(null);
      await expect(useCase.execute('test@example.com', '123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('GenerateTokenUseCase', () => {
    let useCase: GenerateTokenUseCase;
    let jwtService: JwtService;

    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          GenerateTokenUseCase,
          {
            provide: JwtService,
            useValue: { sign: jest.fn().mockReturnValue('mock_token') },
          },
        ],
      }).compile();
      useCase = module.get<GenerateTokenUseCase>(GenerateTokenUseCase);
      jwtService = module.get<JwtService>(JwtService);
    });

    it('should generate a token for a user', () => {
      const result = useCase.execute(mockUser);
      expect(result).toEqual({ access_token: 'mock_token' });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const signMock = jwtService.sign as jest.Mock;
      expect(signMock).toHaveBeenCalled();
    });
  });
});
