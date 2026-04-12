<!--
DOCUMENT METADATA
Owner: @database-expert
-->

# Database Reference

> **Engine**: PostgreSQL (Supabase-managed)  
> **ORM**: Prisma  
> **Connection**: `DATABASE_URL`  
> **Last updated**: 2026-04-12

Schema details will be filled after **task #002** (initial Prisma models and migrations). Below is the **planned** entity overview for alignment.

---

## Schema Overview (planned)

Core entities: **User**, **Workspace**, **Membership** (user ↔ workspace + role), **Lead** (workspace-scoped, tags M:N), **Tag**, **Sequence**, **SequenceStep**, **Enrollment** (lead in sequence + state), **EmailMessage** / **SendJob** (exact naming in migrations), **ActivityEvent**, optional **SendingIdentity**.

```
User ──< Membership >── Workspace
Workspace ──< Lead ──< join >── Tag
Workspace ──< Sequence ──< SequenceStep
Lead ──< Enrollment >── Sequence
```

---

## Tables

_Detailed column tables will replace this section per migration in task #002+._

---

## Migrations Log

| Migration | Date | Description    |
| --------- | ---- | -------------- |
| [TBD]     | —    | Initial schema |

---

## Query Patterns

[TBD after schema — pagination for leads, workspace filter on all selects]

---

## Known Issues & Tech Debt

| Issue              | Impact         | Plan              |
| ------------------ | -------------- | ----------------- |
| Schema not created | Cannot run app | Execute task #002 |
