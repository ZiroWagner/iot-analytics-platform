import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../domain/repositories/user.repository.interface';
import type { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ValidateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.hasPassword()) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }
}
