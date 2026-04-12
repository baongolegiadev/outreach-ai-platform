---
id: '010'
title: 'Sequence builder UI and enrollment actions'
status: 'todo'
area: 'frontend'
agent: '@frontend-developer'
priority: 'normal'
created_at: '2026-04-12'
due_date: null
started_at: null
completed_at: null
prd_refs: ['FR-030', 'FR-031', 'FR-032', 'FR-033', 'FR-034']
blocks: []
blocked_by: ['005', '009']
---

## Description

Provide UI to **create/edit sequences**, define **at least three steps** with delays, preview **merge variables**, and **enroll selected leads** from the leads list. Surface enrollment status per lead where practical.

## Acceptance Criteria

- [ ] Authoring flow persists to API and reloads correctly.
- [ ] Delays configurable per step with clear UX for units (minutes/hours/days).
- [ ] Enrollment action visible from leads context.
- [ ] `docs/user/USER_GUIDE.md` sequences section started.
- [ ] Relevant tests written and passing.
- [ ] Relevant documentation updated.

## Technical Notes

- @ui-ux-designer consult for complex forms if needed.

## History

| Date       | Agent / Human | Event        |
| ---------- | ------------- | ------------ |
| 2026-04-12 | human         | Task created |
