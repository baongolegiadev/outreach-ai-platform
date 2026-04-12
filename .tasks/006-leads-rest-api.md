---
id: "006"
title: "Leads REST API: CRUD, search, filter, tags"
status: "todo"
area: "backend"
agent: "@backend-developer"
priority: "normal"
created_at: "2026-04-12"
due_date: null
started_at: null
completed_at: null
prd_refs: ["FR-020", "FR-021", "FR-023", "FR-024"]
blocks: ["007", "008", "009", "015"]
blocked_by: ["002", "003", "004"]
---

## Description

Expose **workspace-scoped** REST endpoints to create, read, update, and delete leads with **name, email, company**, attach **tags**, and support **search/filter** query parameters with pagination suitable for large workspaces. Validate inputs and return stable error codes.

## Acceptance Criteria

- [ ] CRUD endpoints documented in `docs/technical/API.md`.
- [ ] All queries filter by authenticated workspace; attempt to access other workspace IDs returns 403/404 per policy.
- [ ] Tag assignment endpoints or nested payloads defined and tested.
- [ ] Pagination defaults documented (cursor or offset).
- [ ] Relevant tests written and passing.
- [ ] Relevant documentation updated.

## Technical Notes

- Index `(workspaceId, email)` uniqueness as decided in #002.

## History

| Date | Agent / Human | Event |
|------|--------------|-------|
| 2026-04-12 | human | Task created |
