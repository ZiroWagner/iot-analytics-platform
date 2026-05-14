import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Temperature Sensor Device' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'environmental' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: '00:1B:44:11:3A:B7', required: false })
  @IsString()
  @IsOptional()
  macAddress?: string;

  @ApiProperty({ example: 'clx123abc456' })
  @IsString()
  @IsNotEmpty()
  projectId: string;
}
