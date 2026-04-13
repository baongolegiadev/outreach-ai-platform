import { SetMetadata } from '@nestjs/common';
import {
  WORKSPACE_ACCESS_META_KEY,
  WorkspaceAccessMeta,
} from '../workspace-access.constants';

export const WorkspaceAccess = (
  meta: WorkspaceAccessMeta = {},
): MethodDecorator => SetMetadata(WORKSPACE_ACCESS_META_KEY, meta);
