import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSensorDto {
  @ApiProperty({ example: 'Temperature Sensor' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'clx123abc456' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ example: { unit: 'Celsius', range: [0, 100] }, required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}