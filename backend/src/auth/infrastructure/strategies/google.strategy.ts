import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ValidateOAuthUseCase } from '@/auth/application/use-cases/validate-oauth.use-case';
import { OAuthProfile } from '@/auth/domain/entities/oauth-profile.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly validateOAuthUseCase: ValidateOAuthUseCase,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID') || 'dummy_client_id',
      clientSecret:
        configService.get('GOOGLE_CLIENT_SECRET') || 'dummy_client_secret',
      callbackURL:
        configService.get('GOOGLE_CALLBACK_URL') ||
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    let fullName: string | undefined = undefined;
    if (name) {
      fullName = `${name.givenName || ''} ${name.familyName || ''}`.trim();
      if (!fullName) fullName = profile.displayName;
    }

    const oauthProfile = OAuthProfile.create({
      provider: 'google',
      providerAccountId: profile.id,
      email: emails?.[0]?.value || null,
      name: fullName,
      image: photos?.[0]?.value || undefined,
      accessToken,
      refreshToken,
    });

    const user = await this.validateOAuthUseCase.execute(oauthProfile);
    done(null, user);
  }
}
