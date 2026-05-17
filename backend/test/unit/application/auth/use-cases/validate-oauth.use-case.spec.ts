import { testData } from '@test/utils/test-data';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidateOAuthUseCase } from '@/auth/application/use-cases/validate-oauth.use-case';
import { USER_REPOSITORY_TOKEN } from '@/auth/domain/repositories/user.repository.interface';
import { OAuthProfile } from '@/auth/domain/entities/oauth-profile.entity';
import { User } from '@/auth/domain/entities/user.entity';

describe('ValidateOAuthUseCase', () => {
  let useCase: ValidateOAuthUseCase;
  let mockUserRepository: {
    findOrCreateOAuthUser: jest.Mock;
  };

  beforeEach(async () => {
    mockUserRepository = {
      findOrCreateOAuthUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateOAuthUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<ValidateOAuthUseCase>(ValidateOAuthUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should call findOrCreateOAuthUser with correct parameters', async () => {
      const profile = OAuthProfile.create({
        provider: 'google',
        providerAccountId: testData.uuid(),
        email: testData.email(),
        name: testData.name(),
        image: testData.avatar(),
        accessToken: testData.alphanumeric(40),
        refreshToken: testData.alphanumeric(40),
      });

      const expectedUser = new User(
        testData.uuid(),
        testData.email(),
        testData.name(),
        testData.password(),
        null,
      );

      mockUserRepository.findOrCreateOAuthUser.mockResolvedValue(expectedUser);

      const result = await useCase.execute(profile);

      expect(mockUserRepository.findOrCreateOAuthUser).toHaveBeenCalledWith({
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        email: profile.email,
        name: profile.name,
        image: profile.image,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
      });
      expect(result).toEqual(expectedUser);
    });

    it('should pass through the returned user', async () => {
      const profile = OAuthProfile.create({
        provider: 'github',
        providerAccountId: testData.uuid(),
        email: testData.email(),
        name: testData.name(),
      });

      const expectedUser = new User(
        testData.uuid(),
        testData.email(),
        testData.name(),
        null,
        null,
      );

      mockUserRepository.findOrCreateOAuthUser.mockResolvedValue(expectedUser);

      const result = await useCase.execute(profile);

      expect(result).toBe(expectedUser);
    });

    it('should pass null values for optional fields', async () => {
      const profile = OAuthProfile.create({
        provider: 'google',
        providerAccountId: testData.uuid(),
      });

      const expectedUser = new User(
        testData.uuid(),
        testData.email(),
        null,
        null,
        null,
      );

      mockUserRepository.findOrCreateOAuthUser.mockResolvedValue(expectedUser);

      await useCase.execute(profile);

      expect(mockUserRepository.findOrCreateOAuthUser).toHaveBeenCalledWith({
        provider: 'google',
        providerAccountId: profile.providerAccountId,
        email: null,
        name: null,
        image: null,
        accessToken: null,
        refreshToken: null,
      });
    });

    it('should handle different OAuth providers', async () => {
      const providers = ['google', 'github'];

      for (const provider of providers) {
        const profile = OAuthProfile.create({
          provider,
          providerAccountId: testData.uuid(),
          email: testData.email(),
        });

        const expectedUser = new User(
          testData.uuid(),
          testData.email(),
          null,
          testData.name(),
          null,
        );

        mockUserRepository.findOrCreateOAuthUser.mockResolvedValue(
          expectedUser,
        );

        const result = await useCase.execute(profile);

        expect(result).toBe(expectedUser);
        expect(mockUserRepository.findOrCreateOAuthUser).toHaveBeenCalledWith(
          expect.objectContaining({ provider }),
        );
        mockUserRepository.findOrCreateOAuthUser.mockClear();
      }
    });
  });
});
