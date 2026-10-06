import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      message = (exceptionResponse as any).message || JSON.stringify(exceptionResponse);
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exception instanceof Error) {
      // In production, mask internal error details
      message =
        process.env.NODE_ENV === 'production'
          ? 'An unexpected medical database error occurred'
          : exception.message;
    }

    // Log internally with stack trace for auditing
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - Status ${status} - Error: ${
          exception instanceof Error ? exception.stack : JSON.stringify(exception)
        }`,
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - Status ${status} - Message: ${JSON.stringify(message)}`);
    }

    // Send clean, sanitized response without stack traces
    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
