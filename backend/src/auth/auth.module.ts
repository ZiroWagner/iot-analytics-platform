import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '@/prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controllers
import { AuthController } from '@/auth/interfaces/http/auth.controller';

// Use Cases
import { RegisterUserUseCase } from '@/auth/application/use-cases/register-user.use-case';
import { ValidateUserUseCase } from '@/auth/application/use-cases/validate-user.use-case';
import { ValidateOAuthUseCase } from '@/auth/application/use-cases/validate-oauth.use-case';
import { GenerateTokenUseCase } from '@/auth/application/use-cases/generate-token.use-case';
import { UpdateProfileUseCase } from '@/auth/application/use-cases/update-profile.use-case';
import { DeleteUserUseCase } from '@/auth/application/use-cases/delete-user.use-case';

// Repositories
import { USER_REPOSITORY_TOKEN } from '@/auth/domain/repositories/user.repository.interface';
import { PrismaUserRepository } from '@/auth/infrastructure/repositories/prisma-user.repository';

// Strategies (infrastructure adapters)
import { GoogleStrategy } from '@/auth/infrastructure/strategies/google.strategy';
import { GithubStrategy } from '@/auth/infrastructure/strategies/github.strategy';
import { JwtStrategy } from '@/auth/infrastructure/strategies/jwt.strategy';
import { LocalStrategy } from '@/auth/infrastructure/strategies/local.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Repositories
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository,
    },
    // Use Cases
    RegisterUserUseCase,
    ValidateUserUseCase,
    ValidateOAuthUseCase,
    GenerateTokenUseCase,
    UpdateProfileUseCase,
    DeleteUserUseCase,
    // Infrastructure adapters
    GoogleStrategy,
    GithubStrategy,
    JwtStrategy,
    LocalStrategy,
  ],
})
export class AuthModule {}
