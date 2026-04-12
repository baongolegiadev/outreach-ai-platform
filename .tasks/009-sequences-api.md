---
id: '009'
title: 'Sequences API: steps, delays, merge fields, enrollment'
status: 'todo'
area: 'backend'
agent: '@backend-developer'
priority: 'normal'
created_at: '2026-04-12'
due_date: null
started_at: null
completed_at: null
prd_refs: ['FR-030', 'FR-031', 'FR-032', 'FR-033', 'FR-034']
blocks: ['010', '011']
blocked_by: ['004', '006']
---

## Description

Extend Prisma models and Nest modules for **sequences** (campaigns), **ordered steps** with **delay durations** between sends, **per-step templates** supporting `{{first_name}}` and `{{company}}`, and **lead enrollment** records with state (active, completed, stopped). All entities are workspace-scoped.

## Acceptance Criteria

- [ ] Schema migration adds sequence, step, enrollment tables with indexes for queue scanning.
- [ ] CRUD endpoints for sequences and steps documented in `API.md`.
- [ ] Enrollment endpoint assigns many leads to a sequence atomically or in batches with progress reporting.
- [ ] Server-side validation prevents cycles or zero/negative delays per product rules.
- [ ] `docs/technical/DATABASE.md` updated.
- [ ] Relevant tests written and passing.
- [ ] Relevant documentation updated.

## Technical Notes

- Coordinate with mailer task for job payload shape.

## History

| Date       | Agent / Human | Event        |
| ---------- | ------------- | ------------ |
| 2026-04-12 | human         | Task created |
