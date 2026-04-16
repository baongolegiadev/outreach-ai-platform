import { apiRequest } from '@/lib/api-client';

export interface LeadTag {
  id: string;
  name: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  createdAt: string;
  updatedAt: string;
  tags: LeadTag[];
}

export interface LeadsPagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface LeadsListResponse {
  data: Lead[];
  pagination: LeadsPagination;
}

export interface LeadsQuery {
  search?: string;
  company?: string;
  tagIds?: string[];
  limit?: number;
  offset?: number;
}

export interface CreateLeadPayload {
  name: string;
  email: string;
  company?: string;
  tagIds?: string[];
}

export interface UpdateLeadPayload {
  name?: string;
  email?: string;
  company?: string;
  tagIds?: string[];
}

function buildWorkspaceHeaders(workspaceId: string): Record<string, string> {
  return {
    'x-workspace-id': workspaceId,
  };
}

function toQueryString(query: LeadsQuery): string {
  const params = new URLSearchParams();
  if (query.search) {
    params.set('search', query.search);
  }
  if (query.company) {
    params.set('company', query.company);
  }
  if (query.tagIds && query.tagIds.length > 0) {
    params.set('tagIds', query.tagIds.join(','));
  }
  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }
  if (query.offset !== undefined) {
    params.set('offset', String(query.offset));
  }

  const serialized = params.toString();
  return serialized.length > 0 ? `?${serialized}` : '';
}

export function parseTagIdsInput(rawValue: string): string[] {
  return rawValue
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export async function listLeads(
  workspaceId: string,
  query: LeadsQuery,
): Promise<LeadsListResponse> {
  const qs = toQueryString(query);
  return apiRequest<LeadsListResponse>(`/leads${qs}`, {
    method: 'GET',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
  });
}

export async function getLead(workspaceId: string, leadId: string): Promise<Lead> {
  return apiRequest<Lead>(`/leads/${leadId}`, {
    method: 'GET',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
  });
}

export async function createLead(
  workspaceId: string,
  payload: CreateLeadPayload,
): Promise<Lead> {
  return apiRequest<Lead>('/leads', {
    method: 'POST',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
    body: payload,
  });
}

export async function updateLead(
  workspaceId: string,
  leadId: string,
  payload: UpdateLeadPayload,
): Promise<Lead> {
  return apiRequest<Lead>(`/leads/${leadId}`, {
    method: 'PATCH',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
    body: payload,
  });
}

export async function deleteLead(
  workspaceId: string,
  leadId: string,
): Promise<{ success: true }> {
  return apiRequest<{ success: true }>(`/leads/${leadId}`, {
    method: 'DELETE',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
  });
}
