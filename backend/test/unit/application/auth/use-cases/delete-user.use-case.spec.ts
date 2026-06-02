import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUserUseCase } from '@/auth/application/use-cases/delete-user.use-case';
import { USER_REPOSITORY_TOKEN } from '@/auth/domain/repositories/user.repository.interface';
import { User } from '@/auth/domain/entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let mockUserRepository: {
    findById: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    mockUserRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUserUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteUserUseCase>(DeleteUserUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should call delete on repository if user is found', async () => {
      const existingUser = User.create({
        id: 'user-id',
        email: 'user@example.com',
        name: 'User',
      });

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.delete.mockResolvedValue(undefined);

      await useCase.execute('user-id');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-id');
      expect(mockUserRepository.delete).toHaveBeenCalledWith('user-id');
    });
  });
});
