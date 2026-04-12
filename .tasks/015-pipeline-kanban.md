---
id: '015'
title: 'Pipeline Kanban board and stage API'
status: 'todo'
area: 'frontend'
agent: '@frontend-developer'
priority: 'normal'
created_at: '2026-04-12'
due_date: null
started_at: null
completed_at: null
prd_refs: ['FR-070', 'FR-071', 'FR-072', 'FR-080']
blocks: []
blocked_by: ['005', '006']
---

## Description

Implement **Kanban columns** for New, Contacted, Replied, Closed with **drag-and-drop** updating persisted **stage** on leads via API. Emit or hook **activity log** entries on stage changes. Respect RBAC.

## Acceptance Criteria

- [ ] Drag-and-drop updates server state and handles optimistic failures.
- [ ] Columns match PRD naming (or mapped labels documented).
- [ ] Stage changes create activity events (coordinate with #016 if needed).
- [ ] `docs/user/USER_GUIDE.md` pipeline section updated.
- [ ] Relevant tests written and passing.
- [ ] Relevant documentation updated.

## Technical Notes

- If backend endpoints missing, extend #006 service or add small Nest module.

## History

| Date       | Agent / Human | Event        |
| ---------- | ------------- | ------------ |
| 2026-04-12 | human         | Task created |
