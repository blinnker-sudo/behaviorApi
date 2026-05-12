import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: status, message: 'Internal server error' };

    const requestId = (request.body as { requestId?: string } | undefined)
      ?.requestId;
    const correlationId = (request.body as { correlationId?: string } | undefined)
      ?.correlationId;

    if (status >= 500) {
      this.logger.error(
        {
          status,
          requestId,
          correlationId,
          path: request.url,
          err: exception instanceof Error ? exception.stack : String(exception),
        },
        'Unhandled exception',
      );
    } else {
      this.logger.warn(
        { status, requestId, correlationId, path: request.url, body },
        'Handled exception',
      );
    }

    response.status(status).json(
      typeof body === 'object' && body !== null
        ? { ...body, requestId, correlationId }
        : { message: body, statusCode: status, requestId, correlationId },
    );
  }
}
