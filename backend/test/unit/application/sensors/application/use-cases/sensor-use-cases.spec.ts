import { Test, TestingModule } from '@nestjs/testing';
import { CreateSensorUseCase } from '@/sensors/application/use-cases/create-sensor.use-case';
import { DeleteSensorUseCase } from '@/sensors/application/use-cases/delete-sensor.use-case';
import { GetSensorUseCase } from '@/sensors/application/use-cases/get-sensor.use-case';
import { GetSensorsByDeviceUseCase } from '@/sensors/application/use-cases/get-sensors-by-device.use-case';
import { GetSensorDataPointsUseCase } from '@/sensors/application/use-cases/get-sensor-data-points.use-case';
import { UpdateSensorUseCase } from '@/sensors/application/use-cases/update-sensor.use-case';
import { SENSOR_REPOSITORY_TOKEN } from '@/sensors/domain/repositories/sensor.repository.interface';
import { SensorBuilder } from '../../../../../builders/sensor.builder';

describe('Sensor Use Cases', () => {
  let repository: any;
  const mockSensor = SensorBuilder.aSensor().build();

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByDevice: jest.fn(),
      update: jest.fn(),
      getDataPoints: jest.fn(),
    };
  });

  describe('CreateSensorUseCase', () => {
    let useCase: CreateSensorUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          CreateSensorUseCase,
          { provide: SENSOR_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<CreateSensorUseCase>(CreateSensorUseCase);
    });

    it('should create a sensor', async () => {
      repository.create.mockResolvedValue(mockSensor);
      const data = { name: 'Sensor', deviceId: 'd1', metadata: { unit: 'C' } };
      const result = await useCase.execute('u1', data);

      expect(repository.create).toHaveBeenCalledWith({
        userId: 'u1',
        name: 'Sensor',
        deviceId: 'd1',
        metadata: { unit: 'C' },
      });
      expect(result).toEqual(mockSensor);
    });
    it('should create a sensor without metadata', async () => {
      repository.create.mockResolvedValue(mockSensor);
      const data = { name: 'Sensor', deviceId: 'd1' };
      await useCase.execute('u1', data);

      expect(repository.create).toHaveBeenCalledWith({
        userId: 'u1',
        name: 'Sensor',
        deviceId: 'd1',
        metadata: {},
      });
    });
  });

  describe('DeleteSensorUseCase', () => {
    let useCase: DeleteSensorUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          DeleteSensorUseCase,
          { provide: SENSOR_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<DeleteSensorUseCase>(DeleteSensorUseCase);
    });

    it('should delete a sensor', async () => {
      repository.delete.mockResolvedValue(undefined);
      await useCase.execute('u1', 's1');
      expect(repository.delete).toHaveBeenCalledWith('s1', 'u1');
    });
  });

  describe('GetSensorUseCase', () => {
    let useCase: GetSensorUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          GetSensorUseCase,
          { provide: SENSOR_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<GetSensorUseCase>(GetSensorUseCase);
    });

    it('should get a sensor', async () => {
      repository.findById.mockResolvedValue(mockSensor);
      const result = await useCase.execute('u1', 's1');
      expect(repository.findById).toHaveBeenCalledWith('s1', 'u1');
      expect(result).toEqual(mockSensor);
    });
  });

  describe('GetSensorsByDeviceUseCase', () => {
    let useCase: GetSensorsByDeviceUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          GetSensorsByDeviceUseCase,
          { provide: SENSOR_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<GetSensorsByDeviceUseCase>(
        GetSensorsByDeviceUseCase,
      );
    });

    it('should get sensors by device', async () => {
      repository.findByDevice.mockResolvedValue([mockSensor]);
      const result = await useCase.execute('u1', 'd1');
      expect(repository.findByDevice).toHaveBeenCalledWith('d1', 'u1');
      expect(result).toHaveLength(1);
    });
  });

  describe('GetSensorDataPointsUseCase', () => {
    let useCase: GetSensorDataPointsUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          GetSensorDataPointsUseCase,
          { provide: SENSOR_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<GetSensorDataPointsUseCase>(
        GetSensorDataPointsUseCase,
      );
    });

    it('should get data points', async () => {
      repository.getDataPoints.mockResolvedValue([{ value: 10 }]);
      const result = await useCase.execute('u1', 's1', { limit: 10 });
      expect(repository.getDataPoints).toHaveBeenCalledWith('s1', 'u1', {
        limit: 10,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('UpdateSensorUseCase', () => {
    let useCase: UpdateSensorUseCase;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          UpdateSensorUseCase,
          { provide: SENSOR_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      useCase = module.get<UpdateSensorUseCase>(UpdateSensorUseCase);
    });

    it('should update a sensor', async () => {
      repository.update.mockResolvedValue(mockSensor);
      const result = await useCase.execute('u1', 's1', { name: 'Updated' });
      expect(repository.update).toHaveBeenCalledWith('s1', 'u1', {
        name: 'Updated',
      });
      expect(result).toEqual(mockSensor);
    });
  });
});
