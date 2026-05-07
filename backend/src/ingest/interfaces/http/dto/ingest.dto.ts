import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
    ValidateNested,
    IsObject,
} from 'class-validator';

import { Type } from 'class-transformer';

export class IngestDeviceDto {
    @IsString()
    @IsNotEmpty()
    api_key: string;

    @IsString()
    @IsOptional()
    mac_address?: string;

    @IsString()
    @IsOptional()
    type?: string;
}

export class SensorDto {
    @IsString()
    @IsNotEmpty()
    sensor_id: string;

    @IsObject()
    payload: Record<string, unknown>;
}

export class IngestBodyDto {
    @ValidateNested()
    @Type(() => IngestDeviceDto)
    device: IngestDeviceDto;

    @IsString()
    @IsOptional()
    timestamp?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SensorDto)
    sensors: SensorDto[];
}