'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAuthSession } from '@/lib/auth-storage';
import {
  DelayUnit,
  Sequence,
  SequenceStep,
  createSequence,
  createSequenceStep,
  deleteSequence,
  deleteSequenceStep,
  delayToMinutes,
  extractMergeFields,
  listSequenceSteps,
  listSequences,
  minutesToDelay,
  previewTemplate,
  updateSequence,
  updateSequenceStep,
} from '@/lib/sequences-api';

type StepDraft = {
  id?: string;
  stepOrder: number;
  delayValue: number;
  delayUnit: DelayUnit;
  subject: string;
  body: string;
  isSaving?: boolean;
};

const MIN_STEPS_RECOMMENDED = 3;
const TEMPLATE_EXAMPLE = { first_name: 'Jane', company: 'Acme Inc' };

function stepToDraft(step: SequenceStep): StepDraft {
  const delay = minutesToDelay(step.delayMinutes);
  return {
    id: step.id,
    stepOrder: step.stepOrder,
    delayValue: delay.value,
    delayUnit: delay.unit,
    subject: step.subject,
    body: step.body,
  };
}

export default function SequencesPage(): React.JSX.Element {
  const session = getAuthSession();
  const workspaceId = session?.workspaceId ?? '';

  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<StepDraft[]>([]);
  const [sequenceNameInput, setSequenceNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSequence, setIsSavingSequence] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const selectedStepCount = steps.length;

  const mergeFieldsUsed = useMemo(() => {
    const fields = steps.flatMap((step) => [
      ...extractMergeFields(step.subject),
      ...extractMergeFields(step.body),
    ]);
    return Array.from(new Set(fields)).sort();
  }, [steps]);

  async function loadSequences(): Promise<void> {
    if (!workspaceId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await listSequences(workspaceId, { limit: 100, offset: 0, search: search || undefined });
      setSequences(response.data);
      if (selectedSequenceId && !response.data.some((s) => s.id === selectedSequenceId)) {
        setSelectedSequenceId(null);
        setSelectedSequence(null);
        setSteps([]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load sequences.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSequenceDetail(sequenceId: string): Promise<void> {
    if (!workspaceId) return;
    setErrorMessage(null);
    try {
      const seq = sequences.find((s) => s.id === sequenceId) ?? null;
      setSelectedSequence(seq);
      setSequenceNameInput(seq?.name ?? '');
      const stepRows = await listSequenceSteps(workspaceId, sequenceId);
      setSteps(stepRows.map(stepToDraft));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load sequence details.');
      setSteps([]);
    }
  }

  useEffect(() => {
    void loadSequences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    if (selectedSequenceId) {
      void loadSequenceDetail(selectedSequenceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSequenceId]);

  async function handleCreateSequence(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!workspaceId) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    if (!name) return;

    setIsSavingSequence(true);
    setErrorMessage(null);
    try {
      const created = await createSequence(workspaceId, { name });
      await loadSequences();
      setSelectedSequenceId(created.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create sequence.');
    } finally {
      setIsSavingSequence(false);
    }
  }

  async function handleSaveSequenceName(): Promise<void> {
    if (!workspaceId || !selectedSequenceId) return;
    setIsSavingSequence(true);
    setErrorMessage(null);
    try {
      const updated = await updateSequence(workspaceId, selectedSequenceId, {
        name: sequenceNameInput.trim(),
      });
      setSelectedSequence(updated);
      await loadSequences();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update sequence.');
    } finally {
      setIsSavingSequence(false);
    }
  }

  async function handleDeleteSequence(sequence: Sequence): Promise<void> {
    if (!workspaceId) return;
    const confirmed = window.confirm(`Delete sequence "${sequence.name}"? This will also delete its steps and enrollments.`);
    if (!confirmed) return;
    setErrorMessage(null);
    try {
      await deleteSequence(workspaceId, sequence.id);
      await loadSequences();
      if (selectedSequenceId === sequence.id) {
        setSelectedSequenceId(null);
        setSelectedSequence(null);
        setSteps([]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete sequence.');
    }
  }

  function addDraftStep(): void {
    const nextOrder = steps.length;
    setSteps((current) => [
      ...current,
      {
        stepOrder: nextOrder,
        delayValue: nextOrder === 0 ? 0 : 1,
        delayUnit: nextOrder === 0 ? 'minutes' : 'hours',
        subject: 'Hello {{first_name}}',
        body: 'Hi {{first_name}}, saw you at {{company}}.',
      },
    ]);
  }

  function updateDraft(index: number, patch: Partial<StepDraft>): void {
    setSteps((current) => current.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }

  async function handleSaveStep(index: number): Promise<void> {
    if (!workspaceId || !selectedSequenceId) return;
    const draft = steps[index];
    if (!draft) return;

    const delayMinutes = delayToMinutes(draft.delayValue, draft.delayUnit);
    if (draft.stepOrder > 0 && delayMinutes < 1) {
      setErrorMessage('Delay must be at least 1 minute for non-first steps.');
      return;
    }

    updateDraft(index, { isSaving: true });
    setErrorMessage(null);
    try {
      if (!draft.id) {
        const created = await createSequenceStep(workspaceId, selectedSequenceId, {
          stepOrder: draft.stepOrder,
          delayMinutes,
          subject: draft.subject,
          body: draft.body,
        });
        updateDraft(index, { ...stepToDraft(created), isSaving: false });
      } else {
        const updated = await updateSequenceStep(workspaceId, selectedSequenceId, draft.id, {
          stepOrder: draft.stepOrder,
          delayMinutes,
          subject: draft.subject,
          body: draft.body,
        });
        updateDraft(index, { ...stepToDraft(updated), isSaving: false });
      }
    } catch (error) {
      updateDraft(index, { isSaving: false });
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save step.');
    }
  }

  async function handleDeleteStep(index: number): Promise<void> {
    if (!workspaceId || !selectedSequenceId) return;
    const draft = steps[index];
    if (!draft) return;
    const confirmed = window.confirm(`Delete step #${draft.stepOrder + 1}?`);
    if (!confirmed) return;

    setErrorMessage(null);
    try {
      if (draft.id) {
        await deleteSequenceStep(workspaceId, selectedSequenceId, draft.id);
      }
      const remaining = steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, stepOrder: i }));
      setSteps(remaining);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete step.');
    }
  }

  const recommendedStepsHint =
    selectedStepCount < MIN_STEPS_RECOMMENDED
      ? `Recommended: create at least ${MIN_STEPS_RECOMMENDED} steps for a meaningful sequence.`
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Sequences</h2>
        <p className="text-sm text-slate-600">
          Create sequences, define step delays, preview merge variables, and enroll leads from the Leads page.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive" data-testid="sequences-error">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your sequences</CardTitle>
            <CardDescription>Pick a sequence to edit steps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search sequences"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="sequences-search"
              />
              <Button type="button" variant="outline" onClick={() => void loadSequences()} data-testid="sequences-search-apply">
                Search
              </Button>
            </div>

            <form className="space-y-2" onSubmit={handleCreateSequence}>
              <Label htmlFor="sequence-create-name">New sequence name</Label>
              <div className="flex gap-2">
                <Input id="sequence-create-name" name="name" required data-testid="sequence-create-name" />
                <Button type="submit" disabled={isSavingSequence} data-testid="sequence-create-submit">
                  {isSavingSequence ? 'Saving...' : 'Create'}
                </Button>
              </div>
            </form>

            {isLoading ? (
              <p className="text-sm text-slate-500">Loading sequences...</p>
            ) : sequences.length === 0 ? (
              <p className="text-sm text-slate-500">No sequences yet.</p>
            ) : (
              <div className="space-y-2" data-testid="sequences-list">
                {sequences.map((sequence) => {
                  const isActive = sequence.id === selectedSequenceId;
                  return (
                    <div
                      key={sequence.id}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                        isActive ? 'border-slate-400 bg-slate-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => setSelectedSequenceId(sequence.id)}
                        data-testid={`sequence-select-${sequence.id}`}
                      >
                        <div className="text-sm font-medium text-slate-900">{sequence.name}</div>
                        <div className="text-xs text-slate-500">{sequence.id}</div>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDeleteSequence(sequence)}
                        data-testid={`sequence-delete-${sequence.id}`}
                      >
                        Delete
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="sequence-builder">
          <CardHeader>
            <CardTitle className="text-lg">Sequence builder</CardTitle>
            <CardDescription>
              {selectedSequence ? 'Edit sequence name and steps.' : 'Select a sequence to start editing.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedSequence ? (
              <p className="text-sm text-slate-500">No sequence selected.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sequence-name">Sequence name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sequence-name"
                      value={sequenceNameInput}
                      onChange={(e) => setSequenceNameInput(e.target.value)}
                      data-testid="sequence-name-input"
                    />
                    <Button
                      type="button"
                      onClick={() => void handleSaveSequenceName()}
                      disabled={isSavingSequence}
                      data-testid="sequence-name-save"
                    >
                      Save
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="text-sm font-medium text-slate-900">Merge variables</div>
                  <div className="mt-1 text-xs text-slate-600">
                    Supported: <code>{'{{first_name}}'}</code>, <code>{'{{company}}'}</code>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mergeFieldsUsed.length === 0 ? (
                      <span className="text-xs text-slate-500">No merge fields used yet.</span>
                    ) : (
                      mergeFieldsUsed.map((field) => (
                        <span key={field} className="rounded bg-white px-2 py-1 text-xs text-slate-700">
                          {field}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-900">Steps</div>
                    {recommendedStepsHint && <div className="text-xs text-slate-600">{recommendedStepsHint}</div>}
                  </div>
                  <Button type="button" variant="outline" onClick={addDraftStep} data-testid="step-add">
                    Add step
                  </Button>
                </div>

                <div className="space-y-4">
                  {steps.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No steps yet. Add at least {MIN_STEPS_RECOMMENDED} steps to match the recommended minimum.
                    </p>
                  ) : (
                    steps.map((step, index) => {
                      const previewSubject = previewTemplate(step.subject, TEMPLATE_EXAMPLE);
                      const previewBody = previewTemplate(step.body, TEMPLATE_EXAMPLE);
                      return (
                        <div key={step.id ?? `draft-${index}`} className="rounded-lg border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900">Step {index + 1}</div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleDeleteStep(index)}
                              data-testid={`step-delete-${index}`}
                            >
                              Delete
                            </Button>
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Order</Label>
                              <Input value={String(step.stepOrder)} disabled />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Delay after previous step</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  value={String(step.delayValue)}
                                  onChange={(e) => updateDraft(index, { delayValue: Number(e.target.value) })}
                                  data-testid={`step-delay-value-${index}`}
                                />
                                <select
                                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                                  value={step.delayUnit}
                                  onChange={(e) => updateDraft(index, { delayUnit: e.target.value as DelayUnit })}
                                  data-testid={`step-delay-unit-${index}`}
                                >
                                  <option value="minutes">minutes</option>
                                  <option value="hours">hours</option>
                                  <option value="days">days</option>
                                </select>
                              </div>
                              <div className="text-xs text-slate-500">
                                Stored as {delayToMinutes(step.delayValue, step.delayUnit)} minute(s).
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            <Label>Subject</Label>
                            <Input
                              value={step.subject}
                              onChange={(e) => updateDraft(index, { subject: e.target.value })}
                              data-testid={`step-subject-${index}`}
                            />
                            <div className="text-xs text-slate-500">Preview: {previewSubject}</div>
                          </div>

                          <div className="mt-3 space-y-2">
                            <Label>Body</Label>
                            <textarea
                              className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                              value={step.body}
                              onChange={(e) => updateDraft(index, { body: e.target.value })}
                              data-testid={`step-body-${index}`}
                            />
                            <div className="text-xs text-slate-500">Preview: {previewBody}</div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button
                              type="button"
                              onClick={() => void handleSaveStep(index)}
                              disabled={step.isSaving}
                              data-testid={`step-save-${index}`}
                            >
                              {step.isSaving ? 'Saving...' : step.id ? 'Save changes' : 'Create step'}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

