import { Test, TestingModule } from '@nestjs/testing';
import { DevicesController } from '@/devices/interfaces/http/devices.controller';
import { CreateDeviceUseCase } from '@/devices/application/use-cases/create-device.use-case';
import { GetDevicesByProjectUseCase } from '@/devices/application/use-cases/get-devices-by-project.use-case';
import { GetDeviceUseCase } from '@/devices/application/use-cases/get-device.use-case';
import { UpdateDeviceUseCase } from '@/devices/application/use-cases/update-device.use-case';
import { DeleteDeviceUseCase } from '@/devices/application/use-cases/delete-device.use-case';

describe('DevicesController', () => {
  let controller: DevicesController;
  let createUseCase: any;

  const mockUser = { sub: 'user-123', email: 'test@example.com' };
  const mockDevice = {
    id: 'dev-1',
    name: 'Test Device',
  };

  beforeEach(async () => {
    createUseCase = { execute: jest.fn().mockResolvedValue(mockDevice) };
    const getDevicesUseCase = {
      execute: jest.fn().mockResolvedValue([mockDevice]),
    };
    const getDeviceUseCase = {
      execute: jest.fn().mockResolvedValue(mockDevice),
    };
    const updateUseCase = { execute: jest.fn().mockResolvedValue(mockDevice) };
    const deleteUseCase = {
      execute: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicesController],
      providers: [
        { provide: CreateDeviceUseCase, useValue: createUseCase },
        { provide: GetDevicesByProjectUseCase, useValue: getDevicesUseCase },
        { provide: GetDeviceUseCase, useValue: getDeviceUseCase },
        { provide: UpdateDeviceUseCase, useValue: updateUseCase },
        { provide: DeleteDeviceUseCase, useValue: deleteUseCase },
      ],
    }).compile();

    controller = module.get<DevicesController>(DevicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call createDeviceUseCase', async () => {
      const dto = { name: 'Test Device', type: 'TEMP', projectId: 'proj-1' };
      const result = await controller.create({ user: mockUser }, dto);
      expect(createUseCase.execute).toHaveBeenCalledWith(mockUser.sub, dto);
      expect(result).toEqual(mockDevice);
    });
  });

  describe('findByProject', () => {
    it('should return devices', async () => {
      const result = await controller.findByProject(
        { user: mockUser },
        'proj-1',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a single device', async () => {
      const result = await controller.findOne({ user: mockUser }, 'dev-1');
      expect(result?.id).toBe('dev-1');
    });
  });

  describe('update', () => {
    it('should update a device', async () => {
      const dto = { name: 'Updated' };
      const result = await controller.update({ user: mockUser }, 'dev-1', dto);
      expect(result?.id).toBe('dev-1');
    });
  });

  describe('remove', () => {
    it('should delete a device', async () => {
      const result = await controller.remove({ user: mockUser }, 'dev-1');
      expect(result).toEqual({ success: true });
    });
  });
});
