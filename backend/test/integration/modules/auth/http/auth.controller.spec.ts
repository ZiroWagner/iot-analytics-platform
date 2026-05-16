import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@/auth/interfaces/http/auth.controller';
import { RegisterUserUseCase } from '@/auth/application/use-cases/register-user.use-case';
import { GenerateTokenUseCase } from '@/auth/application/use-cases/generate-token.use-case';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let registerUseCase: any;
  let generateTokenUseCase: any;
  let configService: any;

  beforeEach(async () => {
    registerUseCase = { execute: jest.fn() };
    generateTokenUseCase = {
      execute: jest.fn().mockReturnValue({ access_token: 'tk123' }),
    };
    configService = { get: jest.fn().mockReturnValue('http://frontend.com') };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUserUseCase, useValue: registerUseCase },
        { provide: GenerateTokenUseCase, useValue: generateTokenUseCase },
        { provide: ConfigService, useValue: configService },
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
});
