import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '@/auth/domain/repositories/user.repository.interface';
import type { UserRepositoryInterface } from '@/auth/domain/repositories/user.repository.interface';
import { User } from '@/auth/domain/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    data: { name?: string; currentPassword?: string; newPassword?: string },
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updateData: { name?: string; password?: string } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.newPassword !== undefined) {
      if (!data.currentPassword) {
        throw new BadRequestException(
          'Se requiere la contraseña actual para establecer una nueva',
        );
      }

      // Check if user has a password (local authentication)
      if (!user.password) {
        throw new BadRequestException(
          'El usuario registrado por OAuth no puede cambiar la contraseña local directamente',
        );
      }

      const isMatch = await bcrypt.compare(data.currentPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      updateData.password = data.newPassword;
    }

    return this.userRepository.update(userId, updateData);
  }
}
