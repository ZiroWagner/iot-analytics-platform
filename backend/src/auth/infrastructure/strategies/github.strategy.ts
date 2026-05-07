import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { ValidateOAuthUseCase } from '../../application/use-cases/validate-oauth.use-case';
import { OAuthProfile } from '../../domain/entities/oauth-profile.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(
        private readonly validateOAuthUseCase: ValidateOAuthUseCase,
        private readonly configService: ConfigService,
    ) {
        super({
            clientID: configService.get('GITHUB_CLIENT_ID') || 'dummy_client_id',
            clientSecret: configService.get('GITHUB_CLIENT_SECRET') || 'dummy_client_secret',
            callbackURL: configService.get('GITHUB_CALLBACK_URL') || 'http://localhost:3000/auth/github/callback',
            scope: ['user:email'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void): Promise<any> {
        const { emails, photos, username, displayName } = profile;

        const oauthProfile = OAuthProfile.create({
            provider: 'github',
            providerAccountId: profile.id,
            email: emails?.[0]?.value || null,
            name: displayName || username,
            image: photos?.[0]?.value || undefined,
            accessToken,
            refreshToken,
        });

        const user = await this.validateOAuthUseCase.execute(oauthProfile);
        done(null, user);
    }
}
