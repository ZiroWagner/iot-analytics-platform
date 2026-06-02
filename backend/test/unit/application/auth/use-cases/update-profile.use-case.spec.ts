import { testData } from '@test/utils/test-data';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateProfileUseCase } from '@/auth/application/use-cases/update-profile.use-case';
import { USER_REPOSITORY_TOKEN } from '@/auth/domain/repositories/user.repository.interface';
import { User } from '@/auth/domain/entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;
  let mockUserRepository: {
    findById: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    mockUserRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProfileUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateProfileUseCase>(UpdateProfileUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('invalid-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update name only when no password details are provided', async () => {
      const existingUser = User.create({
        id: 'user-id',
        email: 'user@example.com',
        name: 'Old Name',
      });
      const updatedUser = User.create({
        id: 'user-id',
        email: 'user@example.com',
        name: 'New Name',
      });

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await useCase.execute('user-id', { name: 'New Name' });

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-id');
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-id', {
        name: 'New Name',
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw BadRequestException if newPassword is provided without currentPassword', async () => {
      const existingUser = User.create({
        id: 'user-id',
        email: 'user@example.com',
        name: 'User',
      });

      mockUserRepository.findById.mockResolvedValue(existingUser);

      await expect(
        useCase.execute('user-id', { newPassword: 'newpassword123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user has no password (OAuth) and tries to update password', async () => {
      const existingUser = User.create({
        id: 'user-id',
        email: 'user@example.com',
        name: 'User',
        password: null, // OAuth user
      });

      mockUserRepository.findById.mockResolvedValue(existingUser);

      await expect(
        useCase.execute('user-id', {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if currentPassword does not match existing password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const existingUser = User.create({
        id: 'user-id',
        email: 'user@example.com',
        name: 'User',
        password: hashedPassword,
      });

      mockUserRepository.findById.mockResolvedValue(existingUser);

      await expect(
        useCase.execute('user-id', {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update password and name if inputs are valid', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const existingUser = User.create({
        id: 'user-id',
        email: 'user@example.com',
        name: 'Old Name',
        password: hashedPassword,
      });
      const updatedUser = User.create({
        id: 'user-id',
        email: 'user@example.com',
        name: 'New Name',
      });

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await useCase.execute('user-id', {
        name: 'New Name',
        currentPassword: 'correctpassword',
        newPassword: 'newpassword123',
      });

      expect(mockUserRepository.update).toHaveBeenCalledWith('user-id', {
        name: 'New Name',
        password: 'newpassword123',
      });
      expect(result).toEqual(updatedUser);
    });
  });
});
