---
id: '007'
title: 'Leads UI: table, detail, tags, filters'
status: 'todo'
area: 'frontend'
agent: '@frontend-developer'
priority: 'normal'
created_at: '2026-04-12'
due_date: null
started_at: null
completed_at: null
prd_refs: ['FR-020', 'FR-023', 'FR-024']
blocks: ['015']
blocked_by: ['005', '006']
---

## Description

Build the **Leads** experience: sortable/filterable **table** with pagination, **detail** drawer or page, **tag** editor, and search box wired to the leads API. Empty and loading states should be usable for large datasets.

## Acceptance Criteria

- [ ] List view loads leads for active workspace with pagination.
- [ ] Create/edit/delete flows call API and refresh list with optimistic UI only where safe.
- [ ] Tagging and tag-based filters work end-to-end.
- [ ] `docs/user/USER_GUIDE.md` updated with basic lead instructions.
- [ ] Relevant tests written and passing.
- [ ] Relevant documentation updated.

## Technical Notes

- Use `data-testid` hooks for future Playwright coverage.

## History

| Date       | Agent / Human | Event        |
| ---------- | ------------- | ------------ |
| 2026-04-12 | human         | Task created |
