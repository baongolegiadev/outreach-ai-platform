import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedUser, RequestWithAuth } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    if (!request.user) {
      throw new UnauthorizedException('Missing authenticated user');
    }
    return request.user;
  },
);
