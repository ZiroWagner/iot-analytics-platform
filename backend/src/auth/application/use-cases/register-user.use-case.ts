import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '@/auth/domain/repositories/user.repository.interface';
import type { UserRepositoryInterface } from '@/auth/domain/repositories/user.repository.interface';
import { User } from '@/auth/domain/entities/user.entity';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepositoryInterface,
  ) { }

  async execute(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('El correo ya está en uso.');
    }
    return this.userRepository.create(data);
  }
}
