<!--
DOCUMENT METADATA
Owner: @systems-architect
Read by: All agents before proposing stack changes.
-->

# Architecture Decision Records

> **Rule**: Once an ADR is **Accepted**, do not edit its body. Supersede with a new ADR if the decision changes.

---

## Decision Index

| ID      | Title                                                                       | Status   | Date       |
| ------- | --------------------------------------------------------------------------- | -------- | ---------- |
| ADR-001 | Initial platform stack (Next.js, NestJS, PostgreSQL/Supabase, Prisma, pnpm) | Accepted | 2026-04-12 |
| ADR-002 | Outbound mail queue implementation (DB-backed worker in Nest API process)   | Accepted | 2026-04-17 |

---

## ADR-001: Initial platform stack (Next.js, NestJS, PostgreSQL/Supabase, Prisma, pnpm)

**Date**: 2026-04-12  
**Status**: Accepted  
**Deciders**: Founder (product owner) / onboarding

### Context

We are building an **email-first outbound SaaS** with lead management, sequences, queued sending, reply tracking, analytics, and a light Kanban. The product owner targets **real usage** (10k–100k leads per workspace), **split hosting** (Vercel + Railway), **PostgreSQL on Supabase**, and a **pnpm monorepo** with root scripts and `--filter` workflows. The team is small; leverage mature ecosystems over custom frameworks.

### Options Considered

1. **Full-stack Next.js only** (API routes + server actions): simpler deploy surface; weaker fit for long-running workers and explicit modular domains at scale.
2. **NestJS + separate React (Vite) SPA**: maximum decoupling; more bespoke SSR/SEO work than needed for an **app-only** v1.
3. **Next.js (App Router) + NestJS API + Prisma + Supabase Postgres**: clear separation of **web** and **API/workers**, strong TypeScript ergonomics, Prisma migrations for relational outbound domain, Supabase for managed Postgres.

### Decision

Adopt **Next.js (App Router, TypeScript)** for the web app, **NestJS (TypeScript)** for the backend, **PostgreSQL on Supabase**, **Prisma** as ORM, **pnpm** workspaces with root `dev` / `build` / `test`, **Node 20 LTS**, **JWT** API authentication, **Vercel** for web and **Railway** for API deployment.

### Consequences

- **Positive**: Clean boundaries for async mail workers; Nest modules map well to bounded contexts; Prisma aids safe schema iteration; hosting matches each runtime’s strengths.
- **Negative**: Two deployables and CORS/auth cookie details to manage; more initial scaffolding than a monolithic Next app.
- **Neutral**: Open choices (queue broker, reply ingestion) remain in PRD open questions and future ADRs.

---

## ADR-002: Outbound mail queue implementation (DB-backed worker in Nest API process)

**Date**: 2026-04-17  
**Status**: Accepted  
**Deciders**: Engineering implementation for task 011

### Context

Task 011 requires asynchronous outbound sending with a non-blocking HTTP path, retries with exponential backoff, per-identity rate limiting, and dead-letter visibility. A queueing solution was not yet pinned in accepted ADRs, and the product owner question around Redis/BullMQ remained open.

### Options Considered

1. **BullMQ + Redis**: mature queue semantics and horizontal worker scaling; requires Redis provisioning/operations now.
2. **Database-backed queue in existing PostgreSQL + in-process worker**: no new infrastructure, simpler local/dev rollout, leverages Prisma transactions.

### Decision

Use a **database-backed outbound queue** implemented with Prisma models (`OutboundMessageJob`, `OutboundMessageAttempt`, `OutboundMessageEvent`) and an **in-process Nest worker** (`OutboundMailerWorker`) that polls due jobs. Keep adapter-based delivery (`SMTP` + `GMAIL_STUB`) so broker/runtime can be swapped later without changing send orchestration contracts.

### Consequences

- **Positive**: Fastest path to production behavior with retries, rate limiting, and dead-letter persistence using current stack only.
- **Negative**: Throughput and fault isolation are lower than a dedicated broker/worker deployment; polling interval trades latency vs DB load.
- **Neutral**: If volume grows, we can supersede this ADR with BullMQ/Redis while preserving API contracts and adapter interfaces.

---

<!--
TEMPLATE FOR NEW ADRs — copy when adding ADR-002+

## ADR-NNN: Title

**Date**: YYYY-MM-DD
**Status**: Accepted
**Deciders**: ...

### Context
...

### Options Considered
...

### Decision
...

### Consequences
- **Positive**: ...
- **Negative**: ...
- **Neutral**: ...
-->
