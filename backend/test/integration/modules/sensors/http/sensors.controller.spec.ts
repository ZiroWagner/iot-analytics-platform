import { Test, TestingModule } from '@nestjs/testing';
import { SensorsController } from '@/sensors/interfaces/http/sensors.controller';
import { CreateSensorUseCase } from '@/sensors/application/use-cases/create-sensor.use-case';
import { GetSensorsByDeviceUseCase } from '@/sensors/application/use-cases/get-sensors-by-device.use-case';
import { GetSensorUseCase } from '@/sensors/application/use-cases/get-sensor.use-case';
import { UpdateSensorUseCase } from '@/sensors/application/use-cases/update-sensor.use-case';
import { DeleteSensorUseCase } from '@/sensors/application/use-cases/delete-sensor.use-case';
import { GetSensorDataPointsUseCase } from '@/sensors/application/use-cases/get-sensor-data-points.use-case';

describe('SensorsController', () => {
  let controller: SensorsController;
  let createUseCase: any;

  const mockUser = { sub: 'user-123', email: 'test@example.com' };
  const mockSensor = {
    id: 'sens-1',
    name: 'Test Sensor',
  };

  beforeEach(async () => {
    createUseCase = { execute: jest.fn().mockResolvedValue(mockSensor) };
    const getSensorsUseCase = { execute: jest.fn().mockResolvedValue([mockSensor]) };
    const getSensorUseCase = { execute: jest.fn().mockResolvedValue(mockSensor) };
    const updateUseCase = { execute: jest.fn().mockResolvedValue(mockSensor) };
    const deleteUseCase = { execute: jest.fn().mockResolvedValue({ success: true }) };
    const getDataPointsUseCase = { execute: jest.fn().mockResolvedValue([{ value: 10 }]) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SensorsController],
      providers: [
        { provide: CreateSensorUseCase, useValue: createUseCase },
        { provide: GetSensorsByDeviceUseCase, useValue: getSensorsUseCase },
        { provide: GetSensorUseCase, useValue: getSensorUseCase },
        { provide: UpdateSensorUseCase, useValue: updateUseCase },
        { provide: DeleteSensorUseCase, useValue: deleteUseCase },
        { provide: GetSensorDataPointsUseCase, useValue: getDataPointsUseCase },
      ],
    }).compile();

    controller = module.get<SensorsController>(SensorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call createSensorUseCase', async () => {
      const dto = { name: 'Test Sensor', deviceId: 'dev-1', metadata: {} };
      const result = await controller.create({ user: mockUser }, dto);
      expect(createUseCase.execute).toHaveBeenCalledWith(mockUser.sub, dto);
      expect(result).toEqual(mockSensor);
    });
  });

  describe('findByDevice', () => {
    it('should return sensors', async () => {
      const result = await controller.findByDevice({ user: mockUser }, 'dev-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a single sensor', async () => {
      const result = await controller.findOne({ user: mockUser }, 'sens-1');
      expect(result?.id).toBe('sens-1');
    });
  });

  describe('getDataPoints', () => {
    it('should return data points', async () => {
      const result = await controller.getDataPoints({ user: mockUser }, 'sens-1', undefined, undefined, '10');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update a sensor', async () => {
      const dto = { name: 'Updated' };
      const result = await controller.update({ user: mockUser }, 'sens-1', dto);
      expect(result?.id).toBe('sens-1');
    });
  });

  describe('remove', () => {
    it('should delete a sensor', async () => {
      const result = await controller.remove({ user: mockUser }, 'sens-1');
      expect(result).toEqual({ success: true });
    });
  });
});
