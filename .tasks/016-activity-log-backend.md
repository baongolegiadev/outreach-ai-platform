---
id: '016'
title: 'Activity log: event model, emission hooks, query API'
status: 'todo'
area: 'backend'
agent: '@backend-developer'
priority: 'normal'
created_at: '2026-04-12'
due_date: null
started_at: null
completed_at: null
prd_refs: ['FR-080', 'FR-081']
blocks: ['017']
blocked_by: ['011']
---

## Description

Create an **append-only activity event** model capturing at minimum: **email sent**, **email opened**, **reply received**, **stage change**. Centralize writers called from mailer, tracking, reply, and pipeline services. Expose **query API** filtered by workspace, optional leadId, and time range with pagination.

## Acceptance Criteria

- [ ] Events recorded for each required type with consistent payload schema.
- [ ] Query API documented in `API.md`.
- [ ] Indexes support high volume (workspaceId + createdAt).
- [ ] Relevant tests written and passing.
- [ ] Relevant documentation updated.

## Technical Notes

- Consider outbox pattern if cross-service consistency becomes an issue.

## History

| Date       | Agent / Human | Event        |
| ---------- | ------------- | ------------ |
| 2026-04-12 | human         | Task created |
