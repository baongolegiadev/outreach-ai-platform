---
id: "008"
title: "CSV import for leads with validation report"
status: "todo"
area: "backend"
agent: "@backend-developer"
priority: "normal"
created_at: "2026-04-12"
due_date: null
started_at: null
completed_at: null
prd_refs: ["FR-022"]
blocks: []
blocked_by: ["006"]
---

## Description

Add an endpoint (or job) to **import leads from CSV** with columns for name, email, company (header mapping documented). Return a structured **validation report**: accepted rows count, rejected rows with reasons, and optional partial commit policy (define explicitly). Protect against oversized uploads.

## Acceptance Criteria

- [ ] API contract documented in `docs/technical/API.md` including example CSV and error shapes.
- [ ] Handles duplicate emails per workspace per policy (skip/update/error—document choice).
- [ ] Streaming or chunking strategy documented if files are large.
- [ ] Relevant tests written and passing.
- [ ] Relevant documentation updated.

## Technical Notes

- May reuse lead service from #006.

## History

| Date | Agent / Human | Event |
|------|--------------|-------|
| 2026-04-12 | human | Task created |
