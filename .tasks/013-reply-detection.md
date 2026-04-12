---
id: "013"
title: "Reply detection, stop enrollment, reply status"
status: "todo"
area: "backend"
agent: "@backend-developer"
priority: "normal"
created_at: "2026-04-12"
due_date: null
started_at: null
completed_at: null
prd_refs: ["FR-050", "FR-051", "FR-052", "FR-080"]
blocks: ["014"]
blocked_by: ["011"]
---

## Description

Implement **inbound reply detection** per the approach chosen from PRD open questions (webhook, polling, or provider integration). When a reply matches a lead/thread, **stop active sequence enrollment**, update **reply status** fields, log **activity**, and optionally advance pipeline stage in coordination with #015 rules (document behavior).

## Acceptance Criteria

- [ ] Inbound handler is authenticated/validated to prevent spoofing.
- [ ] Stopping enrollment is idempotent and race-safe under duplicate events.
- [ ] Lead shows replied state in API responses used by UI.
- [ ] Failure modes logged for operator debugging.
- [ ] Relevant tests written and passing.
- [ ] Relevant documentation updated.

## Technical Notes

- Spike may precede full implementation; document outcomes in `DECISIONS.md` as ADR-002 if major.

## History

| Date | Agent / Human | Event |
|------|--------------|-------|
| 2026-04-12 | human | Task created |
