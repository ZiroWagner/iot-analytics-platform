import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class SaveDashboardConfigDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsObject()
  @IsNotEmpty()
  layoutConfig: Record<string, unknown>;
}
