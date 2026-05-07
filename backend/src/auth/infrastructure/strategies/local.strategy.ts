import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ValidateUserUseCase } from '../../application/use-cases/validate-user.use-case';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly validateUserUseCase: ValidateUserUseCase) {
        super({ usernameField: 'email' });
    }

    async validate(email: string, pass: string): Promise<any> {
        try {
            return await this.validateUserUseCase.execute(email, pass);
        } catch {
            throw new UnauthorizedException('Credenciales inválidas');
        }
    }
}
