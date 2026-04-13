import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'INTERNAL_ERROR';

interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, payload } = this.mapException(exception, request);
    response.status(status).json(payload);
  }

  private mapException(
    exception: unknown,
    request: Request,
  ): { status: number; payload: ErrorEnvelope } {
    const requestId = request.headers['x-request-id'];

    if (exception instanceof UnprocessableEntityException) {
      const details = exception.getResponse();
      return this.build(
        exception.getStatus(),
        'VALIDATION_ERROR',
        'Request validation failed',
        details,
        requestId,
      );
    }

    if (exception instanceof BadRequestException) {
      const details = exception.getResponse();
      return this.build(
        exception.getStatus(),
        'VALIDATION_ERROR',
        'Request validation failed',
        details,
        requestId,
      );
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return this.build(
          HttpStatus.CONFLICT,
          'CONFLICT',
          'Resource already exists',
          {
            target: exception.meta?.target,
          },
          requestId,
        );
      }

      return this.build(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'Database request failed',
        {
          prismaCode: exception.code,
        },
        requestId,
      );
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (status === HttpStatus.NOT_FOUND) {
        return this.build(status, 'NOT_FOUND', 'Resource not found', response, requestId);
      }
      if (status === HttpStatus.UNAUTHORIZED) {
        return this.build(
          status,
          'UNAUTHENTICATED',
          'Authentication required',
          response,
          requestId,
        );
      }
      if (status === HttpStatus.FORBIDDEN) {
        return this.build(status, 'UNAUTHORIZED', 'Access denied', response, requestId);
      }

      return this.build(status, 'INTERNAL_ERROR', 'Request failed', response, requestId);
    }

    return this.build(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_ERROR',
      'Internal server error',
      undefined,
      requestId,
    );
  }

  private build(
    status: number,
    code: ErrorCode,
    message: string,
    details: unknown,
    requestId: string | string[] | undefined,
  ): { status: number; payload: ErrorEnvelope } {
    return {
      status,
      payload: {
        error: {
          code,
          message,
          details,
          requestId: Array.isArray(requestId) ? requestId[0] : requestId,
        },
      },
    };
  }
}
