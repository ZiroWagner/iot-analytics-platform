import { Test } from '@nestjs/testing';
import { CreateDeviceUseCase } from '@/devices/application/use-cases/create-device.use-case';
import { DeleteDeviceUseCase } from '@/devices/application/use-cases/delete-device.use-case';
import { GetDeviceUseCase } from '@/devices/application/use-cases/get-device.use-case';
import { GetDevicesByProjectUseCase } from '@/devices/application/use-cases/get-devices-by-project.use-case';
import { UpdateDeviceUseCase } from '@/devices/application/use-cases/update-device.use-case';
import { DEVICE_REPOSITORY_TOKEN } from '@/devices/domain/repositories/device.repository.interface';
import { DeviceBuilder } from '../../../../../builders/device.builder';

describe('Device Use Cases', () => {
  let repository: any;
  const mockDevice = DeviceBuilder.aDevice().build();

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByProject: jest.fn(),
      update: jest.fn(),
    };
  });

  describe('CreateDeviceUseCase', () => {
    let useCase: CreateDeviceUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          CreateDeviceUseCase,
          { provide: DEVICE_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<CreateDeviceUseCase>(CreateDeviceUseCase);
    });

    it('should create a device via repository', async () => {
      repository.create.mockResolvedValue(mockDevice);
      const data = { name: 'Device', type: 'TEMP', projectId: 'p1' };
      const result = await useCase.execute('u1', data);

      expect(repository.create).toHaveBeenCalledWith({
        userId: 'u1',
        name: 'Device',
        type: 'TEMP',
        macAddress: null,
        projectId: 'p1',
      });
      expect(result).toEqual(mockDevice);
    });
  });

  describe('DeleteDeviceUseCase', () => {
    let useCase: DeleteDeviceUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          DeleteDeviceUseCase,
          { provide: DEVICE_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<DeleteDeviceUseCase>(DeleteDeviceUseCase);
    });

    it('should delete a device', async () => {
      repository.delete.mockResolvedValue(true);
      await useCase.execute('u1', 'd1');
      expect(repository.delete).toHaveBeenCalledWith('d1', 'u1');
    });
  });

  describe('GetDeviceUseCase', () => {
    let useCase: GetDeviceUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          GetDeviceUseCase,
          { provide: DEVICE_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<GetDeviceUseCase>(GetDeviceUseCase);
    });

    it('should get a device', async () => {
      repository.findById.mockResolvedValue(mockDevice);
      const result = await useCase.execute('u1', 'd1');
      expect(repository.findById).toHaveBeenCalledWith('d1', 'u1');
      expect(result).toEqual(mockDevice);
    });

    it('should return null if not found', async () => {
      repository.findById.mockResolvedValue(null);
      const result = await useCase.execute('u1', 'd1');
      expect(result).toBeNull();
    });
  });

  describe('GetDevicesByProjectUseCase', () => {
    let useCase: GetDevicesByProjectUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          GetDevicesByProjectUseCase,
          { provide: DEVICE_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<GetDevicesByProjectUseCase>(
        GetDevicesByProjectUseCase,
      );
    });

    it('should get devices by project', async () => {
      repository.findByProject.mockResolvedValue([mockDevice]);
      const result = await useCase.execute('u1', 'p1');
      expect(repository.findByProject).toHaveBeenCalledWith('p1', 'u1');
      expect(result).toHaveLength(1);
    });
  });

  describe('UpdateDeviceUseCase', () => {
    let useCase: UpdateDeviceUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          UpdateDeviceUseCase,
          { provide: DEVICE_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<UpdateDeviceUseCase>(UpdateDeviceUseCase);
    });

    it('should update a device', async () => {
      repository.update.mockResolvedValue(mockDevice);
      const result = await useCase.execute('u1', 'd1', { name: 'Updated' });
      expect(repository.update).toHaveBeenCalledWith('d1', 'u1', {
        name: 'Updated',
        type: undefined,
        macAddress: null,
      });
      expect(result).toEqual(mockDevice);
    });
  });
});
