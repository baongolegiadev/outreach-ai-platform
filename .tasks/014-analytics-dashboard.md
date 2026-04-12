---
id: "014"
title: "Analytics dashboard (API aggregates + UI)"
status: "todo"
area: "frontend"
agent: "@frontend-developer"
priority: "normal"
created_at: "2026-04-12"
due_date: null
started_at: null
completed_at: null
prd_refs: ["FR-060", "FR-061", "FR-062", "FR-063", "FR-064"]
blocks: []
blocked_by: ["005", "011", "012", "013"]
---

## Description

Expose backend **aggregates** for emails sent, **open rate**, **reply rate**, **active sequences**, and **funnel stage counts** (New → Contacted → Replied → Closed). Build a **dashboard page** in Next.js with charts or stat cards that perform well for large workspaces (server-side aggregation, not naive full-table fetches).

## Acceptance Criteria

- [ ] Dashboard loads metrics scoped to current workspace.
- [ ] Definitions of rates documented (denominators) in `USER_GUIDE.md` or `API.md`.
- [ ] Loading/error/empty states implemented.
- [ ] Relevant tests written and passing.
- [ ] Relevant documentation updated.

## Technical Notes

- Backend aggregation endpoints may live in Nest alongside read models.

## History

| Date | Agent / Human | Event |
|------|--------------|-------|
| 2026-04-12 | human | Task created |
