import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'My IoT Project' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'Project for monitoring temperature sensors', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateProjectDto {
  @ApiProperty({ example: 'Updated Project Name', required: false })
  @IsString()
  @IsOptional()
  @MinLength(3)
  name?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
