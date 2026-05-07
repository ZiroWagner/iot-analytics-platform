import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAvailableMetricsParamsDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;
}

export class GetTimeseriesQueryDto {
  @IsString()
  @IsNotEmpty()
  sensorId: string;

  @IsString()
  @IsNotEmpty()
  metric: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class GetMultiTimeseriesQueryDto {
  @IsString()
  @IsNotEmpty()
  series: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class GetStatsQueryDto {
  @IsString()
  @IsNotEmpty()
  sensorId: string;

  @IsString()
  @IsNotEmpty()
  metric: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}