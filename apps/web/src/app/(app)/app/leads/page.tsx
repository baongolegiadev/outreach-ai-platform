'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAuthSession } from '@/lib/auth-storage';
import {
  Lead,
  createLead,
  deleteLead,
  getLead,
  listLeads,
  parseTagIdsInput,
  updateLead,
} from '@/lib/leads-api';

type SortKey = 'name' | 'email' | 'company' | 'createdAt';

const PAGE_SIZE = 10;

function formatDate(dateIso: string): string {
  const date = new Date(dateIso);
  return date.toLocaleDateString();
}

export default function LeadsPage(): React.JSX.Element {
  const [rows, setRows] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [tagFilterInput, setTagFilterInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeCompany, setActiveCompany] = useState('');
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailName, setDetailName] = useState('');
  const [detailEmail, setDetailEmail] = useState('');
  const [detailCompany, setDetailCompany] = useState('');
  const [detailTagIds, setDetailTagIds] = useState('');

  const session = getAuthSession();
  const workspaceId = session?.workspaceId ?? '';

  const hasMore = offset + rows.length < total;

  const sortedRows = useMemo(() => {
    const valueForSort = (lead: Lead, key: SortKey): string => {
      if (key === 'company') {
        return lead.company ?? '';
      }
      return String(lead[key] ?? '');
    };

    return [...rows].sort((left, right) => {
      const leftValue = valueForSort(left, sortBy).toLowerCase();
      const rightValue = valueForSort(right, sortBy).toLowerCase();
      if (leftValue === rightValue) {
        return 0;
      }
      const direction = sortDir === 'asc' ? 1 : -1;
      return leftValue > rightValue ? direction : -direction;
    });
  }, [rows, sortBy, sortDir]);

  async function loadLeads(nextOffset = offset): Promise<void> {
    if (!workspaceId) {
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await listLeads(workspaceId, {
        search: activeSearch || undefined,
        company: activeCompany || undefined,
        tagIds: activeTagIds.length > 0 ? activeTagIds : undefined,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      setRows(response.data);
      setTotal(response.pagination.total);
      setOffset(nextOffset);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to load leads for this workspace.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function reloadSelectedLead(): Promise<void> {
    if (!workspaceId || !selectedLeadId) {
      return;
    }
    try {
      const lead = await getLead(workspaceId, selectedLeadId);
      setSelectedLead(lead);
      setDetailName(lead.name);
      setDetailEmail(lead.email);
      setDetailCompany(lead.company ?? '');
      setDetailTagIds(lead.tags.map((tag) => tag.id).join(','));
    } catch {
      setSelectedLead(null);
      setSelectedLeadId(null);
    }
  }

  useEffect(() => {
    void loadLeads(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, activeSearch, activeCompany, activeTagIds.join(',')]);

  useEffect(() => {
    void reloadSelectedLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeadId, workspaceId]);

  function handleSort(column: SortKey): void {
    if (sortBy === column) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortDir('asc');
  }

  function openLeadDetail(lead: Lead): void {
    setSelectedLeadId(lead.id);
    setSelectedLead(lead);
    setDetailName(lead.name);
    setDetailEmail(lead.email);
    setDetailCompany(lead.company ?? '');
    setDetailTagIds(lead.tags.map((tag) => tag.id).join(','));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!workspaceId) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      company: String(form.get('company') ?? '').trim() || undefined,
      tagIds: parseTagIdsInput(String(form.get('tagIds') ?? '')),
    };

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await createLead(workspaceId, payload);
      event.currentTarget.reset();
      await loadLeads(0);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create lead.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateSelectedLead(): Promise<void> {
    if (!workspaceId || !selectedLeadId) {
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await updateLead(workspaceId, selectedLeadId, {
        name: detailName.trim(),
        email: detailEmail.trim(),
        company: detailCompany.trim() || undefined,
        tagIds: parseTagIdsInput(detailTagIds),
      });
      await reloadSelectedLead();
      await loadLeads(offset);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update lead.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(lead: Lead): Promise<void> {
    if (!workspaceId) {
      return;
    }
    const confirmed = window.confirm(`Delete lead "${lead.name}"?`);
    if (!confirmed) {
      return;
    }

    const previousRows = rows;
    const nextRows = rows.filter((row) => row.id !== lead.id);
    setRows(nextRows);
    if (selectedLeadId === lead.id) {
      setSelectedLeadId(null);
      setSelectedLead(null);
    }

    try {
      await deleteLead(workspaceId, lead.id);
      await loadLeads(nextRows.length === 0 && offset > 0 ? Math.max(0, offset - PAGE_SIZE) : offset);
    } catch (error) {
      setRows(previousRows);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete lead.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Leads</h2>
        <p className="text-sm text-slate-600">
          Manage workspace leads with search, tag filters, and editable lead details.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive" data-testid="leads-error">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card data-testid="lead-create-card">
        <CardHeader>
          <CardTitle className="text-lg">Add lead</CardTitle>
          <CardDescription>
            Create a lead with optional company and workspace tag IDs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input id="create-name" name="name" required data-testid="lead-create-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                name="email"
                type="email"
                required
                data-testid="lead-create-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-company">Company</Label>
              <Input id="create-company" name="company" data-testid="lead-create-company" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-tagIds">Tag IDs (comma separated)</Label>
              <Input id="create-tagIds" name="tagIds" data-testid="lead-create-tag-ids" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isSaving} data-testid="lead-create-submit">
                {isSaving ? 'Saving...' : 'Create lead'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>
            Search by name/email/company and filter by company or tag IDs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              placeholder="Search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              data-testid="leads-filter-search"
            />
            <Input
              placeholder="Company"
              value={companyInput}
              onChange={(event) => setCompanyInput(event.target.value)}
              data-testid="leads-filter-company"
            />
            <Input
              placeholder="Tag IDs (comma separated)"
              value={tagFilterInput}
              onChange={(event) => setTagFilterInput(event.target.value)}
              data-testid="leads-filter-tags"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActiveSearch(searchInput.trim());
                  setActiveCompany(companyInput.trim());
                  setActiveTagIds(parseTagIdsInput(tagFilterInput));
                }}
                data-testid="leads-filter-apply"
              >
                Apply
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearchInput('');
                  setCompanyInput('');
                  setTagFilterInput('');
                  setActiveSearch('');
                  setActiveCompany('');
                  setActiveTagIds([]);
                }}
                data-testid="leads-filter-reset"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card data-testid="leads-table-card">
          <CardHeader>
            <CardTitle className="text-lg">Leads table</CardTitle>
            <CardDescription>
              Total: {total} lead(s), page size: {PAGE_SIZE}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-slate-500" data-testid="leads-loading">
                Loading leads...
              </p>
            ) : sortedRows.length === 0 ? (
              <p className="text-sm text-slate-500" data-testid="leads-empty">
                No leads found for this filter set.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" data-testid="leads-table">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="px-3 py-2">
                        <button type="button" onClick={() => handleSort('name')}>
                          Name
                        </button>
                      </th>
                      <th className="px-3 py-2">
                        <button type="button" onClick={() => handleSort('email')}>
                          Email
                        </button>
                      </th>
                      <th className="px-3 py-2">
                        <button type="button" onClick={() => handleSort('company')}>
                          Company
                        </button>
                      </th>
                      <th className="px-3 py-2">Tags</th>
                      <th className="px-3 py-2">
                        <button type="button" onClick={() => handleSort('createdAt')}>
                          Created
                        </button>
                      </th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((lead) => (
                      <tr key={lead.id} className="border-b border-slate-100">
                        <td className="px-3 py-2">{lead.name}</td>
                        <td className="px-3 py-2">{lead.email}</td>
                        <td className="px-3 py-2">{lead.company ?? '-'}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {lead.tags.length === 0 ? (
                              <span className="text-slate-400">No tags</span>
                            ) : (
                              lead.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600"
                                >
                                  {tag.name}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">{formatDate(lead.createdAt)}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openLeadDetail(lead)}
                              data-testid={`lead-open-${lead.id}`}
                            >
                              View
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleDelete(lead)}
                              data-testid={`lead-delete-${lead.id}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {rows.length === 0 ? 0 : offset + 1}-
                {Math.min(offset + rows.length, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0 || isLoading}
                  onClick={() => void loadLeads(Math.max(0, offset - PAGE_SIZE))}
                  data-testid="leads-pagination-prev"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore || isLoading}
                  onClick={() => void loadLeads(offset + PAGE_SIZE)}
                  data-testid="leads-pagination-next"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="lead-detail-drawer">
          <CardHeader>
            <CardTitle className="text-lg">Lead detail</CardTitle>
            <CardDescription>
              {selectedLead
                ? 'Edit lead profile and replace tag assignment by tag IDs.'
                : 'Select a lead from the table to edit details.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedLead ? (
              <p className="text-sm text-slate-500">No lead selected.</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="detail-name">Name</Label>
                  <Input
                    id="detail-name"
                    value={detailName}
                    onChange={(event) => setDetailName(event.target.value)}
                    data-testid="lead-detail-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detail-email">Email</Label>
                  <Input
                    id="detail-email"
                    type="email"
                    value={detailEmail}
                    onChange={(event) => setDetailEmail(event.target.value)}
                    data-testid="lead-detail-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detail-company">Company</Label>
                  <Input
                    id="detail-company"
                    value={detailCompany}
                    onChange={(event) => setDetailCompany(event.target.value)}
                    data-testid="lead-detail-company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detail-tag-ids">Tag IDs (comma separated)</Label>
                  <Input
                    id="detail-tag-ids"
                    value={detailTagIds}
                    onChange={(event) => setDetailTagIds(event.target.value)}
                    data-testid="lead-detail-tags"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => void handleUpdateSelectedLead()}
                    disabled={isSaving}
                    data-testid="lead-detail-save"
                  >
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setSelectedLeadId(null);
                      setSelectedLead(null);
                    }}
                    data-testid="lead-detail-close"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
