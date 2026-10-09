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

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'An unexpected clinical server error occurred. Please try again.';

    // Check Prisma error codes
    const exAny = exception as Record<string, unknown> | null;
    const prismaCode = exAny?.code ? String(exAny.code) : '';

    if (prismaCode === 'P2002') {
      status = HttpStatus.CONFLICT;
      message = 'A record with this information (national ID, phone, or code) already exists.';
    } else if (prismaCode === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      message = 'The requested medical record could not be found.';
    } else if (prismaCode === 'P2003') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Cannot complete operation due to dependent clinical records.';
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const respObj = exceptionResponse as Record<string, unknown>;
      if (Array.isArray(respObj.message)) {
        message = respObj.message.join('. ');
      } else if (typeof respObj.message === 'string') {
        message = respObj.message;
      } else if (typeof respObj.error === 'string') {
        message = respObj.error;
      }
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (status < 500 && exception instanceof Error) {
      message = exception.message;
    }

    // Never leak stack traces or internal query terms to the user
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - Status ${status} - Error: ${
          exception instanceof Error ? exception.stack : JSON.stringify(exception)
        }`,
      );
      message = 'The clinic server encountered a temporary technical issue. Please try again.';
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - Status ${status} - Message: ${message}`,
      );
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
