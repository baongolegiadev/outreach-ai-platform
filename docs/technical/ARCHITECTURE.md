<!--
DOCUMENT METADATA
Owner: @systems-architect
Update trigger: System architecture changes, new integrations, component additions
Read by: All agents.
For design tokens and UX flows see DESIGN_SYSTEM.md (@ui-ux-designer).
-->

# System Architecture

> Last updated: 2026-04-15  
> Version: 0.1.0

---

## Overview

Outreach AI Platform is a **pnpm monorepo** with a **Next.js** browser client and a **NestJS** API backed by **PostgreSQL** (hosted on **Supabase**). The Nest API owns authentication (JWT), workspace-scoped business logic, queues for outbound email, and webhooks/polling endpoints for reply and tracking events. The Next app provides the authenticated UI (dashboard, leads, sequences, pipeline, analytics) and calls the API over HTTPS.

Key architectural choices: **clear separation** between web (Vercel) and API (Railway), **Prisma** as the single ORM for relational data, and **asynchronous workers** for mail delivery and retries (specific broker TBD—see `DECISIONS.md` and PRD open questions).

```
  Browser (Next.js on Vercel)
            │
            ▼ HTTPS / JSON
     NestJS API (Railway)
       │        │
       ▼        ├──────────► PostgreSQL (Supabase)
   Workers            Redis / queue [TBD]
       │
       ├──────────► SMTP / Gmail outbound
       └──────────► Inbound reply channel [TBD]
```

---

## Tech Stack

| Layer            | Technology            | Version        | Why Chosen                              |
| ---------------- | --------------------- | -------------- | --------------------------------------- |
| Frontend         | Next.js (App Router)  | 15.x [TBD pin] | SSR/RSC ecosystem, Vercel-native deploy |
| Language         | TypeScript            | 5.x [TBD pin]  | Shared typing across apps               |
| Backend          | NestJS                | 11.x [TBD pin] | Structured modules, DI, scalable APIs   |
| Database         | PostgreSQL (Supabase) | 15+ [managed]  | Relational integrity, JSON where needed |
| ORM              | Prisma                | 6.x [TBD pin]  | Migrations, type-safe queries           |
| Auth             | JWT (API-issued)      | —              | Stateless API fits split deploy         |
| Hosting web      | Vercel                | —              | Next.js operational fit                 |
| Hosting API      | Railway               | —              | Long-running Node + workers             |
| Package manager  | pnpm                  | 9+             | Workspace filters, disk efficiency      |
| Unit tests (web) | Vitest                | —              | Fast DX for UI                          |
| Unit tests (api) | Jest                  | —              | Nest default                            |
| CI/CD            | GitHub Actions        | —              | [TBD — pipeline tasks]                  |

---

## System Components

### Frontend Architecture

The Next.js app uses the **App Router**. Server and client components split will follow feature implementation. **Server state** (lists, detail, mutations) should use a consistent approach (e.g. React Query) once introduced in task work.

**Routing**: `apps/web/src/app/` with route groups:

- `(auth)` for `/login` and `/signup`
- `(app)` for the authenticated shell at `/app`

**State management**: [TBD in implementation — prefer React Query for API data.]

**Data fetching**: Authenticated fetches to Nest **base URL** from env (`NEXT_PUBLIC_API_URL`); no secrets in client bundle.

**Styling/UI primitives**: Tailwind CSS v4 + shadcn/ui component pattern in `apps/web/src/components/ui`.

---

### Backend Architecture

NestJS modules align to domains: **auth**, **workspaces**, **leads**, **sequences**, **sending**, **events/activity**, **analytics aggregations**.

**API style**: REST JSON under a versioned prefix (e.g. `/v1`) — finalize in `docs/technical/API.md`.

**Middleware stack** (conceptual):

1. Authentication — validate JWT on protected routes.
2. Workspace resolution — derive active workspace from header or path per ADR.
3. Validation — DTO pipes (class-validator / Zod [TBD]).
4. Exception filter — standard error envelope (see API.md).

---

### Infrastructure

| Environment      | URL                     | Branch | Notes                             |
| ---------------- | ----------------------- | ------ | --------------------------------- |
| Production (web) | `[TBD]` Vercel          | `main` | Env: `NEXT_PUBLIC_API_URL` etc.   |
| Production (api) | `[TBD]` Railway         | `main` | Secrets: DB, JWT, SMTP, Redis     |
| Database         | Supabase project URL    | n/a    | `DATABASE_URL` only in server env |
| Local web        | `http://localhost:3000` | any    | `pnpm --filter web dev`           |
| Local api        | `http://localhost:3001` | any    | `pnpm --filter api dev`           |

**CI/CD**: [TBD — describe pipelines when `.github/workflows` exist.]

---

## Data Flow

### Authentication (summary)

1. User submits email/password to Nest auth endpoints.
2. API validates credentials against Prisma `User` records.
3. API issues **JWT**; current web client stores session metadata in `localStorage` and mirrors access token to a non-httpOnly cookie for route middleware checks.
4. Subsequent requests include JWT; Nest guards enforce workspace authorization.

### Outbound send (summary)

1. Client requests enqueue/enroll send job.
2. API persists outbox/job row and pushes to queue.
3. Worker sends via SMTP/Gmail, records result, retries on transient failure.
4. Activity + analytics updated from worker events.

Detailed diagrams belong here as implementation lands.

> Security follow-up: move to server-issued httpOnly cookie/BFF token handling when backend support is added, and remove JS-accessible token storage.

---

## Design system and UX

Canonical **design system** lives in [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (@ui-ux-designer). Other agents: read-only unless you are @ui-ux-designer.

---

## Security Architecture

**Authentication model**: JWT access tokens; refresh strategy [TBD].

**Authorization**: Workspace-scoped RBAC (Admin / Member). Every query filters by `workspaceId`.

**Data protection**: Passwords hashed with a modern KDF (bcrypt/argon2 — choose in implementation). Secrets only on server/worker env.

**Key decisions**: See `docs/technical/DECISIONS.md`.

---

## Performance Considerations

- Pagination and indexes on foreign keys for lead and enrollment tables (see `DATABASE.md` as schema evolves).
- Aggregate analytics via SQL or materialized rollups [TBD] to keep dashboards fast at 10k–100k leads.

---

## Known Constraints and Technical Debt

| Item                               | Impact                 | Plan                        |
| ---------------------------------- | ---------------------- | --------------------------- |
| Reply detection approach undecided | Blocks full FR-050–052 | Resolve in ADR + spike task |
| Queue broker not pinned            | Worker reliability     | ADR + infra task            |
