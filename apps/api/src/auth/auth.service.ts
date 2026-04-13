import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from './auth.types';
import { LoginDto, loginSchema } from './dto/login.dto';
import { RegisterDto, registerSchema } from './dto/register.dto';
import { JwtTokenService } from './jwt-token.service';
import { PasswordService } from './password.service';

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  workspace: {
    id: string;
    name: string;
    role: WorkspaceRole;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async register(input: unknown): Promise<AuthResponse> {
    const payload = this.parseRegisterInput(input);

    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: payload.email,
          name: payload.name ?? null,
          passwordHash: this.passwordService.hashPassword(payload.password),
        },
      });

      const workspace = await tx.workspace.create({
        data: { name: payload.workspaceName },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: 'ADMIN',
        },
      });

      return { user, workspace };
    });

    return this.buildAuthResponse(
      created.user.id,
      created.user.email,
      created.user.name,
      created.workspace.id,
      created.workspace.name,
      'ADMIN',
    );
  }

  async login(input: unknown): Promise<AuthResponse> {
    const payload = this.parseLoginInput(input);
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    if (
      !user ||
      !this.passwordService.verifyPassword(payload.password, user.passwordHash)
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const membership = await this.resolveMembership(
      user.id,
      payload.workspaceId,
    );
    if (!membership) {
      throw new UnauthorizedException(
        'User is not a member of the requested workspace',
      );
    }

    return this.buildAuthResponse(
      user.id,
      user.email,
      user.name,
      membership.workspace.id,
      membership.workspace.name,
      membership.role,
    );
  }

  logout(): { success: true; message: string } {
    return {
      success: true,
      message: 'Logged out. Discard the access token on the client.',
    };
  }

  private parseRegisterInput(input: unknown): RegisterDto {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private parseLoginInput(input: unknown): LoginDto {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private async resolveMembership(
    userId: string,
    workspaceId?: string,
  ): Promise<{
    role: WorkspaceRole;
    workspace: {
      id: string;
      name: string;
    };
  } | null> {
    if (workspaceId) {
      return this.prisma.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId,
          },
        },
        select: {
          role: true,
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    return this.prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  private buildAuthResponse(
    userId: string,
    email: string,
    name: string | null,
    workspaceId: string,
    workspaceName: string,
    role: WorkspaceRole,
  ): AuthResponse {
    const accessToken = this.jwtTokenService.issueAccessToken({
      sub: userId,
      email,
    });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtTokenService.getAccessTokenTtlSeconds(),
      user: {
        id: userId,
        email,
        name,
      },
      workspace: {
        id: workspaceId,
        name: workspaceName,
        role,
      },
    };
  }
}
