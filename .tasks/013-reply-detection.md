---
id: '013'
title: 'Reply detection, stop enrollment, reply status'
status: 'done'
area: 'backend'
agent: '@backend-developer'
priority: 'normal'
created_at: '2026-04-12'
due_date: null
started_at: null
completed_at: '2026-05-13'
prd_refs: ['FR-050', 'FR-051', 'FR-052', 'FR-080']
blocks: ['014']
blocked_by: ['011']
---

## Description

Implement **inbound reply detection** per the approach chosen from PRD open questions (webhook, polling, or provider integration). When a reply matches a lead/thread, **stop active sequence enrollment**, update **reply status** fields, log **activity**, and optionally advance pipeline stage in coordination with #015 rules (document behavior).

## Acceptance Criteria

- [x] Inbound handler is authenticated/validated to prevent spoofing.
- [x] Stopping enrollment is idempotent and race-safe under duplicate events.
- [x] Lead shows replied state in API responses used by UI.
- [x] Failure modes logged for operator debugging.
- [x] Relevant tests written and passing.
- [x] Relevant documentation updated.

## Technical Notes

- v1 decision: **ADR-004** (`docs/technical/DECISIONS.md`). Centralized activity model remains **#016**.

## History

| Date       | Agent / Human | Event        |
| ---------- | ------------- | ------------ |
| 2026-04-12 | human         | Task created |
| 2026-05-13 | agent         | ADR-004: shared-secret `POST /webhooks/inbound-replies`, dedupe via `ProcessedInboundReply`, lead `replyStatus`/`repliedAt`, manual test script |
