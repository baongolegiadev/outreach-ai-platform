import { apiRequest } from '@/lib/api-client';

export interface Sequence {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceStep {
  id: string;
  sequenceId: string;
  stepOrder: number;
  delayMinutes: number;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface SequenceListResponse {
  data: Sequence[];
  pagination: Pagination;
}

export interface ListSequencesQuery {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateSequencePayload {
  name: string;
}

export interface UpdateSequencePayload {
  name?: string;
}

export interface CreateSequenceStepPayload {
  stepOrder: number;
  delayMinutes: number;
  subject: string;
  body: string;
}

export interface UpdateSequenceStepPayload {
  stepOrder?: number;
  delayMinutes?: number;
  subject?: string;
  body?: string;
}

export interface EnrollLeadsPayload {
  leadIds: string[];
  batchSize?: number;
}

export interface EnrollLeadsResponse {
  totals: {
    requested: number;
    validLeads: number;
    created: number;
    skippedAlreadyEnrolled: number;
    invalidLeadIds: number;
  };
  progress: Array<{
    batch: number;
    attempted: number;
    created: number;
    skippedAlreadyEnrolled: number;
  }>;
}

function buildWorkspaceHeaders(workspaceId: string): Record<string, string> {
  return {
    'x-workspace-id': workspaceId,
  };
}

function toQueryString(query: ListSequencesQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const serialized = params.toString();
  return serialized.length > 0 ? `?${serialized}` : '';
}

export type DelayUnit = 'minutes' | 'hours' | 'days';

export function delayToMinutes(value: number, unit: DelayUnit): number {
  const normalized = Number.isFinite(value) ? Math.floor(value) : 0;
  if (normalized <= 0) return 0;
  if (unit === 'hours') return normalized * 60;
  if (unit === 'days') return normalized * 60 * 24;
  return normalized;
}

export function minutesToDelay(minutes: number): { value: number; unit: DelayUnit } {
  if (minutes % (60 * 24) === 0 && minutes >= 60 * 24) {
    return { value: minutes / (60 * 24), unit: 'days' };
  }
  if (minutes % 60 === 0 && minutes >= 60) {
    return { value: minutes / 60, unit: 'hours' };
  }
  return { value: minutes, unit: 'minutes' };
}

export function extractMergeFields(text: string): string[] {
  const matches = Array.from(text.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi));
  const fields = matches.map((m) => String(m[1] ?? '').toLowerCase()).filter(Boolean);
  return Array.from(new Set(fields));
}

export function previewTemplate(
  text: string,
  example: { first_name: string; company: string },
): string {
  return text
    .replaceAll(/\{\{\s*first_name\s*\}\}/gi, example.first_name)
    .replaceAll(/\{\{\s*company\s*\}\}/gi, example.company);
}

export async function listSequences(
  workspaceId: string,
  query: ListSequencesQuery,
): Promise<SequenceListResponse> {
  const qs = toQueryString(query);
  return apiRequest<SequenceListResponse>(`/sequences${qs}`, {
    method: 'GET',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
  });
}

export async function createSequence(
  workspaceId: string,
  payload: CreateSequencePayload,
): Promise<Sequence> {
  return apiRequest<Sequence>('/sequences', {
    method: 'POST',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
    body: payload,
  });
}

export async function updateSequence(
  workspaceId: string,
  sequenceId: string,
  payload: UpdateSequencePayload,
): Promise<Sequence> {
  return apiRequest<Sequence>(`/sequences/${sequenceId}`, {
    method: 'PATCH',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
    body: payload,
  });
}

export async function deleteSequence(
  workspaceId: string,
  sequenceId: string,
): Promise<{ success: true }> {
  return apiRequest<{ success: true }>(`/sequences/${sequenceId}`, {
    method: 'DELETE',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
  });
}

export async function listSequenceSteps(
  workspaceId: string,
  sequenceId: string,
): Promise<SequenceStep[]> {
  return apiRequest<SequenceStep[]>(`/sequences/${sequenceId}/steps`, {
    method: 'GET',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
  });
}

export async function createSequenceStep(
  workspaceId: string,
  sequenceId: string,
  payload: CreateSequenceStepPayload,
): Promise<SequenceStep> {
  return apiRequest<SequenceStep>(`/sequences/${sequenceId}/steps`, {
    method: 'POST',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
    body: payload,
  });
}

export async function updateSequenceStep(
  workspaceId: string,
  sequenceId: string,
  stepId: string,
  payload: UpdateSequenceStepPayload,
): Promise<SequenceStep> {
  return apiRequest<SequenceStep>(`/sequences/${sequenceId}/steps/${stepId}`, {
    method: 'PATCH',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
    body: payload,
  });
}

export async function deleteSequenceStep(
  workspaceId: string,
  sequenceId: string,
  stepId: string,
): Promise<{ success: true }> {
  return apiRequest<{ success: true }>(`/sequences/${sequenceId}/steps/${stepId}`, {
    method: 'DELETE',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
  });
}

export async function enrollLeads(
  workspaceId: string,
  sequenceId: string,
  payload: EnrollLeadsPayload,
): Promise<EnrollLeadsResponse> {
  return apiRequest<EnrollLeadsResponse>(`/sequences/${sequenceId}/enroll`, {
    method: 'POST',
    auth: true,
    headers: buildWorkspaceHeaders(workspaceId),
    body: payload,
  });
}

