import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/auth/domain/entities/user.entity';

@Injectable()
export class GenerateTokenUseCase {
  constructor(private readonly jwtService: JwtService) { }

  execute(
    user:
      | User
      | {
        id: string;
        email: string | null;
        name?: string | null;
        image?: string | null;
      },
  ): { access_token: string } {
    const payload =
      'toJwtPayload' in user
        ? user.toJwtPayload()
        : {
          sub: user.id,
          email: user.email || '',
          name: user.name || undefined,
          image: user.image || undefined,
        };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
