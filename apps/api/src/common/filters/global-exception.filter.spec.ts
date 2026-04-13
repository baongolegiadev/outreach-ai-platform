import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();
  type ErrorPayload = { error: { code: string } };

  const createHost = () => {
    const statusMock = jest.fn().mockReturnThis() as jest.MockedFunction<(code: number) => Response>;
    const jsonMock = jest.fn() as jest.MockedFunction<(payload: ErrorPayload) => Response>;
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
    const payload = jsonMock.mock.calls[0]?.[0];
    expect(payload.error.code).toBe('VALIDATION_ERROR');
  });

  it('maps prisma unique violation to CONFLICT', () => {
    const { host, statusMock, jsonMock } = createHost();
    const prismaError = {
      code: 'P2002',
      meta: { target: ['email'] },
    };

    filter.catch(prismaError, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    const payload = jsonMock.mock.calls[0]?.[0];
    expect(payload.error.code).toBe('CONFLICT');
  });
});
