import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        const message = typeof exceptionResponse === 'string' 
            ? exceptionResponse 
            : (exceptionResponse as any).message || 'Error desconocido';

        const details = Array.isArray(message) ? message : [message];

        const errorResponse = {
            success: false,
            statusCode: status,
            message: 'Error en la solicitud',
            error: exception.constructor.name,
            details,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        if (status >= 500) {
            this.logger.error(message, exception.stack);
        } else {
            this.logger.warn(`${request.method} ${request.url} - ${status}`, { message });
        }

        response.status(status).json(errorResponse);
    }
}
