export const WORKSPACE_ACCESS_META_KEY = 'workspace_access_meta';
export const WORKSPACE_ROLE_META_KEY = 'workspace_required_roles';

export interface WorkspaceAccessMeta {
  source?: 'header' | 'param';
  headerName?: string;
  paramKey?: string;
}
