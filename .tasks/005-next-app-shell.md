---
id: "005"
title: "Next.js app shell: auth screens and API client"
status: "todo"
area: "frontend"
agent: "@frontend-developer"
priority: "high"
created_at: "2026-04-12"
due_date: null
started_at: null
completed_at: null
prd_refs: ["FR-001", "FR-002", "FR-003"]
blocks: ["007", "010", "014", "015", "017"]
blocked_by: ["001", "004"]
---

## Description

Implement the **authenticated app shell** in `apps/web`: routing layout, **sign up / log in / log out** flows calling Nest auth endpoints, token/session handling per security choice (prefer httpOnly cookies if API supports BFF pattern; otherwise secure storage documented). Centralize **API base URL** from `NEXT_PUBLIC_*` env vars. Desktop-first responsive layout stub for dashboard sections.

## Acceptance Criteria

- [ ] Users can sign up, log in, and log out against the real API in local dev.
- [ ] Authenticated layout protects app routes; unauthenticated users redirected to login.
- [ ] API errors surface readable inline messages for auth forms.
- [ ] `README.md` / `ARCHITECTURE.md` updated if env vars or ports differ from docs.
- [ ] Vitest smoke test for a simple component or util (if configured).
- [ ] Relevant documentation updated.

## Technical Notes

- Coordinate CORS and cookie domains between Vercel and Railway early.

## History

| Date | Agent / Human | Event |
|------|--------------|-------|
| 2026-04-12 | human | Task created |
