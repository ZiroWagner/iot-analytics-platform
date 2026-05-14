import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const path = request.url;

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        if (request.method !== 'OPTIONS') {
          this.logger.log(`${request.method} ${path} - ${duration}ms`);
        }
      }),
      map((data) => ({
        success: true,
        statusCode: ctx.getResponse().statusCode,
        message: 'Operación exitosa',
        data,
        timestamp: new Date().toISOString(),
        path,
      })),
    );
  }
}

// Decorador para usar en controladores
export function UseResponseInterceptor() {
  return UseInterceptors(ResponseInterceptor);
}
