---
id: "001"
title: "Scaffold pnpm monorepo (Next.js web + NestJS api)"
status: "todo"
area: "setup"
agent: "@systems-architect"
priority: "high"
created_at: "2026-04-12"
due_date: null
started_at: null
completed_at: null
prd_refs: []
blocks: ["002", "003", "005"]
blocked_by: []
---

## Description

Create the **pnpm workspace** layout with `apps/web` (Next.js App Router + TypeScript + Vitest stub) and `apps/api` (NestJS + Jest stub), plus root scripts so `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm run lint`, and `pnpm run typecheck` orchestrate both packages. Add **Prettier** and **ESLint** at the root with sensible shared ignores, and commit **`.nvmrc` (20)** alignment. This task establishes the baseline repo shape documented in `README.md` and `docs/technical/ARCHITECTURE.md`.

## Acceptance Criteria

- [ ] `pnpm-workspace.yaml` includes `apps/*` (and `packages/*` if introduced).
- [ ] `pnpm dev` runs web + api concurrently (or documented parallel terminals if tooling defers aggregate runner).
- [ ] `pnpm build` builds both apps without errors.
- [ ] `pnpm test` executes Vitest (web) and Jest (api) smoke tests.
- [ ] `pnpm run lint` and `pnpm run typecheck` exist at root and pass on clean tree.
- [ ] `.env.example` stubs `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, `API_PUBLIC_URL` (no secrets).
- [ ] `README.md` commands match actual scripts.
- [ ] Relevant documentation updated (`ARCHITECTURE.md` ports/paths if finalized).

## Technical Notes

- Follow ADR-001 hosting split: Next on Vercel, Nest on Railway.
- Keep secrets out of git; use env vars only.

## History

| Date | Agent / Human | Event |
|------|--------------|-------|
| 2026-04-12 | human | Task created (onboarding backlog) |
