---
id: '012'
title: 'Open tracking pipeline'
status: 'done'
area: 'backend'
agent: '@backend-developer'
priority: 'normal'
created_at: '2026-04-12'
due_date: null
started_at: null
completed_at: '2026-04-18'
prd_refs: ['FR-061', 'FR-080']
blocks: ['013', '014']
blocked_by: ['011']
---

## Description

Record **email opens** in a privacy-conscious, documented way (tracking pixel and/or ESP events). Persist open events linked to lead/message, feed **analytics**, and append **activity log** entries.

## Acceptance Criteria

- [x] Opening a sent message triggers a recorded event idempotently where possible.
- [x] Fraud/bot considerations documented (even if minimal in v1).
- [x] `docs/technical/API.md` includes tracking endpoint if applicable.
- [x] Relevant tests written and passing.
- [x] Relevant documentation updated.

## Technical Notes

- Align with PRD open question on pixel vs provider-native events.

## History

| Date       | Agent / Human | Event        |
| ---------- | ------------- | ------------ |
| 2026-04-12 | human         | Task created |
| 2026-04-18 | agent         | Implemented pixel + first-open persistence (ADR-003) |
