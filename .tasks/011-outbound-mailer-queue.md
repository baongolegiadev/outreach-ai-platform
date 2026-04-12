---
id: "011"
title: "Outbound mailer: queue, SMTP/Gmail, retries, rate limits"
status: "todo"
area: "backend"
agent: "@backend-developer"
priority: "normal"
created_at: "2026-04-12"
due_date: null
started_at: null
completed_at: null
prd_refs: ["FR-040", "FR-041", "FR-042", "FR-043"]
blocks: ["012", "013", "016"]
blocked_by: ["004", "009"]
---

## Description

Implement **asynchronous sending**: enqueue jobs from API, process via worker (Nest microservice or separate process—document choice), integrate **SMTP and/or Gmail API** adapters behind an interface, apply **per-inbox rate limiting**, and perform **≥3 retries** with exponential backoff for transient errors. Persist send outcomes for analytics and activity logging hooks.

## Acceptance Criteria

- [ ] Sending path is non-blocking for HTTP callers (202/accepted pattern documented).
- [ ] Adapter interface supports at least SMTP; second adapter stub acceptable if secrets absent in dev.
- [ ] Rate limiter prevents burst beyond configured per identity.
- [ ] Failures after retries surface in operator-visible log or table (dead-letter concept).
- [ ] ADR or `ARCHITECTURE.md` updated with broker choice once implemented.
- [ ] Relevant tests written and passing (unit + integration with fake SMTP if possible).
- [ ] Relevant documentation updated.

## Technical Notes

- Resolve PRD open questions on Redis/BullMQ vs alternative with product owner if blocked.

## History

| Date | Agent / Human | Event |
|------|--------------|-------|
| 2026-04-12 | human | Task created |
