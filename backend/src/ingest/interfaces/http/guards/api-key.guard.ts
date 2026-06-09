import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  HttpException,
} from '@nestjs/common';
import { RedisService } from '@/redis/redis.service';
import { createHash } from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(@Inject(RedisService) private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const apiKey = request.body?.device?.api_key;

      if (!apiKey || typeof apiKey !== 'string') {
        return true;
      }

      const keyHash = createHash('sha256').update(apiKey).digest('hex').substring(0, 16);

      const [cachedId, isInvalid] = await Promise.all([
        this.redisService.client.get(`device:apikey:${apiKey}`),
        this.redisService.client.get(`device:invalidkey:${keyHash}`),
      ]);

      if (cachedId) {
        return true;
      }

      if (isInvalid) {
        throw new UnauthorizedException('Invalid API Key');
      }

      return true;
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }
      return true;
    }
  }
}
