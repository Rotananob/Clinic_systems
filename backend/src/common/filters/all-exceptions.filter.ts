import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PlatformMasterBotService } from '../../telegram/platform-master-bot.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly platformMasterBotService?: PlatformMasterBotService) {}

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
    } else if (prismaCode === 'P2021' || prismaCode === 'P2022') {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'ប្រព័ន្ធមូលដ្ឋានទិន្នន័យកំពុងធ្វើបច្ចុប្បន្នភាព សូមរង់ចាំមួយភ្លែត រួចសាកល្បងម្ដងទៀត: Database schema is synchronizing, please retry.';
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

    // Humanize standard HTTP authorization messages
    if (status === HttpStatus.FORBIDDEN && (message === 'Forbidden resource' || !message)) {
      message = 'គណនីលោកអ្នកមិនទាន់មានសិទ្ធិអនុវត្តសកម្មភាពនេះឡើយ។ សូមទាក់ទងម្ចាស់គ្លីនិក (Owner) ដើម្បីស្នើសុំសិទ្ធិបន្ថែម។ (Access restricted. Please contact clinic owner.)';
    } else if (status === HttpStatus.UNAUTHORIZED && (message === 'Unauthorized' || !message)) {
      message = 'សូមចូលគណនីបុគ្គលិកវេជ្ជសាស្ត្រ ដើម្បីបន្តប្រើប្រាស់ (Please sign in to continue).';
    }

    // Never leak stack traces or internal query terms to the user
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - Status ${status} - Error: ${
          exception instanceof Error ? exception.stack : JSON.stringify(exception)
        }`,
      );
      message = 'The clinic server encountered a temporary technical issue. Please try again.';

      // Dispatch alert to Platform Master Bot for Super Admin
      if (this.platformMasterBotService) {
        this.platformMasterBotService
          .notifySystemError({
            title: `HTTP ${status} Internal Server Error`,
            route: `[${request.method}] ${request.url}`,
            error: exception instanceof Error ? exception.message : String(exception),
          })
          .catch(() => {});
      }
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
