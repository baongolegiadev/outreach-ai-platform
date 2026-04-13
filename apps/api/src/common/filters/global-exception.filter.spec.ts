import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  const createHost = () => {
    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();
    const response = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;
    const request = {
      headers: {},
    } as unknown as Request;

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as ArgumentsHost;

    return { host, statusMock, jsonMock };
  };

  it('maps bad request to VALIDATION_ERROR', () => {
    const { host, statusMock, jsonMock } = createHost();

    filter.catch(new BadRequestException('invalid payload'), host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      }),
    );
  });

  it('maps prisma unique violation to CONFLICT', () => {
    const { host, statusMock, jsonMock } = createHost();
    const prismaError = new Prisma.PrismaClientKnownRequestError('unique failed', {
      code: 'P2002',
      clientVersion: '6.0.0',
      meta: { target: ['email'] },
    });

    filter.catch(prismaError, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'CONFLICT',
        }),
      }),
    );
  });
});
