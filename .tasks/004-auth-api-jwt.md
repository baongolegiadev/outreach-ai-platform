---
id: "004"
title: "Auth API: register, login, JWT, workspace guard"
status: "todo"
area: "backend"
agent: "@backend-developer"
priority: "high"
created_at: "2026-04-12"
due_date: null
started_at: null
completed_at: null
prd_refs: ["FR-001", "FR-002", "FR-003", "FR-004", "FR-010", "FR-011", "FR-012", "FR-013", "FR-014"]
blocks: ["005", "006", "009", "011"]
blocked_by: ["002", "003"]
---

## Description

Implement **email/password registration and login**, **password hashing**, **JWT issuance**, and a **workspace-scoped authorization layer** (header or param strategy documented in `API.md`). Ensure **cross-tenant access is impossible** for protected handlers. Include **logout** semantics consistent with JWT approach (e.g. denylist or short TTL + refresh [TBD]). Default workspace creation on first user optional—document chosen flow.

## Acceptance Criteria

- [ ] Register and login endpoints persist user and return JWT payload contract documented in `API.md`.
- [ ] Protected sample route proves JWT guard works.
- [ ] Workspace membership enforced for workspace-scoped resources (pattern reusable by lead/sequence modules).
- [ ] Admin vs Member permissions stubbed with clear extension point for future routes.
- [ ] `docs/technical/API.md` lists auth endpoints and example payloads.
- [ ] Relevant tests written and passing.
- [ ] Relevant documentation updated.

## Technical Notes

- Align with PRD open question on password reset for v1.
- Never log secrets or JWTs.

## History

| Date | Agent / Human | Event |
|------|--------------|-------|
| 2026-04-12 | human | Task created |
