import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../domain/repositories/user.repository.interface';
import type { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { OAuthProfile } from '../../domain/entities/oauth-profile.entity';

@Injectable()
export class ValidateOAuthUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(profile: OAuthProfile): Promise<User> {
    return this.userRepository.findOrCreateOAuthUser({
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
      name: profile.name,
      image: profile.image,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
    });
  }
}
