import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controllers
import { AuthController } from './interfaces/http/auth.controller';

// Use Cases
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { ValidateUserUseCase } from './application/use-cases/validate-user.use-case';
import { ValidateOAuthUseCase } from './application/use-cases/validate-oauth.use-case';
import { GenerateTokenUseCase } from './application/use-cases/generate-token.use-case';

// Repositories
import { USER_REPOSITORY_TOKEN } from './domain/repositories/user.repository.interface';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';

// Strategies (infrastructure adapters)
import { GoogleStrategy } from './infrastructure/strategies/google.strategy';
import { GithubStrategy } from './infrastructure/strategies/github.strategy';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';

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
        // Infrastructure adapters
        GoogleStrategy,
        GithubStrategy,
        JwtStrategy,
        LocalStrategy,
    ],
})
export class AuthModule {}