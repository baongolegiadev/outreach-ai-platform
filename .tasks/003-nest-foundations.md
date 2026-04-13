---
id: '003'
title: 'NestJS foundations (Prisma module, config, health, errors)'
status: 'in_progress'
area: 'backend'
agent: '@backend-developer'
priority: 'high'
created_at: '2026-04-12'
due_date: null
started_at: '2026-04-13'
completed_at: null
prd_refs: ['FR-004']
blocks: ['004', '006']
blocked_by: ['001', '002']
---

## Description

Bootstrap the **NestJS** service in `apps/api` with **configuration module** (validated env), **Prisma service** lifecycle, **global validation pipe**, and a **standard error envelope** compatible with `docs/technical/API.md`. Add `/health` for Railway checks. Establish CORS policy placeholder for the Next.js origin.

## Acceptance Criteria

- [ ] App boots with `pnpm --filter api dev` using `DATABASE_URL`.
- [x] `/health` returns 200 with minimal JSON payload.
- [x] Global exception filter maps common errors to stable `error.code` values.
- [x] Prisma client is injectable in modules; clean shutdown on SIGTERM.
- [x] `docs/technical/API.md` updated with base path and error format if changed.
- [ ] Relevant tests written and passing.
- [x] Relevant documentation updated.

## Technical Notes

- JWT verification comes in task #004; keep routes open where appropriate until then.

## History

| Date       | Agent / Human | Event        |
| ---------- | ------------- | ------------ |
| 2026-04-12 | human         | Task created |
| 2026-04-13 | @backend-developer | Implemented config validation, Prisma module, global filter/pipe, and health endpoint |
