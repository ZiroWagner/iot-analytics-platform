import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetSystemMetricsUseCase } from '@/observability/application/use-cases/get-system-metrics.use-case';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

interface JwtUser {
  sub: string;
  email: string;
}

@ApiTags('Observability')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard)
@UseGuards(AuthGuard('jwt'))
@Controller('observability')
export class ObservabilityController {
  constructor(
    private readonly getSystemMetricsUseCase: GetSystemMetricsUseCase,
  ) {}

  @ApiOperation({
    summary: 'Get system metrics scoped to the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'System metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('metrics')
  getMetrics(@Req() req: { user: JwtUser }) {
    return this.getSystemMetricsUseCase.execute(req.user.sub);
  }
}
