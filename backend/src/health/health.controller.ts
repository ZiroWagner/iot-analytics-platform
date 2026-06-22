import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Health')
@UseGuards(ThrottlerGuard)
@SkipThrottle({ short: true, long: true })
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Public health check' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  check() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Public readiness check' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to receive traffic',
  })
  ready() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }
}
