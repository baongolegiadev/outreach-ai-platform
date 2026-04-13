---
id: '002'
title: 'Prisma schema: users, workspaces, memberships, leads, tags'
status: 'completed'
area: 'database'
agent: '@database-expert'
priority: 'high'
created_at: '2026-04-12'
due_date: null
started_at: '2026-04-13'
completed_at: '2026-04-13'
prd_refs:
  [
    'FR-010',
    'FR-011',
    'FR-012',
    'FR-013',
    'FR-014',
    'FR-020',
    'FR-021',
    'FR-023',
    'FR-024',
  ]
blocks: ['003', '004', '006']
blocked_by: ['001']
---

## Description

Introduce **Prisma** with an initial relational schema supporting **multi-tenant workspaces**, **memberships** with **Admin/Member** roles, **users**, **leads** (name, email, company, workspace FK), and **tags** (many-to-many with leads). Include indexes supporting search and scale targets (10k–100k leads per workspace). Migrations must be reversible and reviewed against `docs/technical/DATABASE.md`.

## Acceptance Criteria

- [x] Prisma schema and first migration create all tables above with FK constraints and cascading rules defined.
- [x] Every lead row is scoped with `workspaceId`; uniqueness rules documented (e.g. email unique per workspace).
- [x] Seed script optional but documented if used for local dev only.
- [x] `docs/technical/DATABASE.md` updated with table definitions and ER summary.
- [x] Relevant tests written and passing (if schema tested via integration harness).
- [x] Relevant documentation updated.

## Technical Notes

- Supabase connection string via `DATABASE_URL`.
- Coordinate with upcoming auth task for `User` password hash field naming.

## History

| Date       | Agent / Human | Event        |
| ---------- | ------------- | ------------ |
| 2026-04-12 | human         | Task created |
| 2026-04-13 | agent         | Task implemented: Prisma core schema, migration, and DB docs updated |
