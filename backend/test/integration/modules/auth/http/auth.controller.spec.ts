import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@/auth/interfaces/http/auth.controller';
import { RegisterUserUseCase } from '@/auth/application/use-cases/register-user.use-case';
import { GenerateTokenUseCase } from '@/auth/application/use-cases/generate-token.use-case';
import { ConfigService } from '@nestjs/config';
import { UpdateProfileUseCase } from '@/auth/application/use-cases/update-profile.use-case';
import { DeleteUserUseCase } from '@/auth/application/use-cases/delete-user.use-case';
import { USER_REPOSITORY_TOKEN } from '@/auth/domain/repositories/user.repository.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let registerUseCase: any;
  let generateTokenUseCase: any;
  let configService: any;
  let updateProfileUseCase: any;
  let deleteUserUseCase: any;
  let userRepository: any;

  beforeEach(async () => {
    registerUseCase = { execute: jest.fn() };
    generateTokenUseCase = {
      execute: jest.fn().mockReturnValue({ access_token: 'tk123' }),
    };
    configService = { get: jest.fn().mockReturnValue('http://frontend.com') };
    updateProfileUseCase = { execute: jest.fn() };
    deleteUserUseCase = { execute: jest.fn() };
    userRepository = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUserUseCase, useValue: registerUseCase },
        { provide: GenerateTokenUseCase, useValue: generateTokenUseCase },
        { provide: ConfigService, useValue: configService },
        { provide: UpdateProfileUseCase, useValue: updateProfileUseCase },
        { provide: DeleteUserUseCase, useValue: deleteUserUseCase },
        { provide: USER_REPOSITORY_TOKEN, useValue: userRepository },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should register user and return token', async () => {
      const dto = { email: 'test@example.com', password: '123', name: 'Test' };
      registerUseCase.execute.mockResolvedValue({ id: 'u1', ...dto });

      const result = await controller.register(dto);
      expect(result).toEqual({ access_token: 'tk123' });
      expect(registerUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return token for valid login', async () => {
      const req = { user: { id: 'u1', email: 'test@example.com' } } as any;
      const result = await controller.login(req);
      expect(result).toEqual({ access_token: 'tk123' });
      expect(generateTokenUseCase.execute).toHaveBeenCalledWith(req.user);
    });
  });

  describe('googleAuthRedirect', () => {
    it('should redirect with token', () => {
      const req = { user: { id: 'u1', email: 'test@example.com' } } as any;
      const res = { redirect: jest.fn() } as any;

      controller.googleAuthRedirect(req, res);
      expect(res.redirect).toHaveBeenCalledWith(
        'http://frontend.com/auth/callback?token=tk123',
      );
    });
  });

  describe('githubAuthRedirect', () => {
    it('should redirect with token', () => {
      const req = { user: { id: 'u1', email: 'test@example.com' } } as any;
      const res = { redirect: jest.fn() } as any;

      controller.githubAuthRedirect(req, res);
      expect(res.redirect).toHaveBeenCalledWith(
        'http://frontend.com/auth/callback?token=tk123',
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile when user exists', async () => {
      const mockUserEntity = {
        id: 'u1',
        email: 'test@example.com',
        name: 'Test',
        image: 'http://avatar.com/img.png',
        hasPassword: () => true,
      };
      userRepository.findById.mockResolvedValue(mockUserEntity);

      const result = await controller.getProfile({
        user: { sub: 'u1', email: 'test@example.com' },
      });

      expect(userRepository.findById).toHaveBeenCalledWith('u1');
      expect(result).toEqual({
        id: 'u1',
        email: 'test@example.com',
        name: 'Test',
        image: 'http://avatar.com/img.png',
        hasPassword: true,
      });
    });

    it('should return hasPassword false for OAuth users', async () => {
      const mockUserEntity = {
        id: 'u2',
        email: 'oauth@example.com',
        name: 'OAuth User',
        image: null,
        hasPassword: () => false,
      };
      userRepository.findById.mockResolvedValue(mockUserEntity);

      const result = await controller.getProfile({
        user: { sub: 'u2', email: 'oauth@example.com' },
      });

      expect(result.hasPassword).toBe(false);
    });

    it('should throw NotFoundException when user is not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        controller.getProfile({
          user: { sub: 'nonexistent', email: 'test@example.com' },
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update profile and return new token', async () => {
      const updatedUser = {
        id: 'u1',
        email: 'test@example.com',
        name: 'Updated Name',
      };
      updateProfileUseCase.execute.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(
        { user: { sub: 'u1', email: 'test@example.com' } },
        { name: 'Updated Name' },
      );

      expect(updateProfileUseCase.execute).toHaveBeenCalledWith('u1', {
        name: 'Updated Name',
      });
      expect(generateTokenUseCase.execute).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual({ access_token: 'tk123' });
    });
  });

  describe('deleteProfile', () => {
    it('should delete user and return success', async () => {
      deleteUserUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.deleteProfile({
        user: { sub: 'u1', email: 'test@example.com' },
      });

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ success: true });
    });
  });
});
