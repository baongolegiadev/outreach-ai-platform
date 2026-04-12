# Outreach AI Platform

> Email-first outbound SaaS: lead management, multi-step sequences, queued sending, reply tracking, analytics, and a lightweight pipeline—built for real sales usage.

---

## Overview

Outreach AI Platform helps **SDRs, sales teams, founders, and growth teams** move from spreadsheets and one-off inbox work to a **single workspace** for leads, campaigns, and outcomes. Users today often pull leads from Excel or LinkedIn exports, send messages manually, and lose track of follow-ups—wasting time and missing revenue.

This product focuses the v1 scope on a **dependable email engine**: multi-tenant workspaces, lead CRUD and CSV import, sequences with delays and personalization, asynchronous sending with retries and per-inbox rate limits, reply detection to stop sequences, engagement analytics, a **New → Contacted → Replied → Closed** Kanban, and an auditable activity log.

The web app is **authenticated only** (no public marketing site in v1). Hosting targets: **Next.js on Vercel**, **NestJS on Railway**, **PostgreSQL on Supabase**.

---

## Tech Stack

| Layer           | Technology                          | Notes                                                     |
| --------------- | ----------------------------------- | --------------------------------------------------------- |
| Frontend        | Next.js (App Router), TypeScript    | Deployed to Vercel                                        |
| Styling         | [TBD — align with DESIGN_SYSTEM.md] | @ui-ux-designer                                           |
| Backend         | NestJS, TypeScript                  | Deployed to Railway                                       |
| Database        | PostgreSQL (Supabase-managed)       | Connection via `DATABASE_URL`                             |
| ORM             | Prisma                              | Migrations as schema evolves                              |
| Auth            | JWT for API sessions                | Workspace-scoped authorization                            |
| Queue / workers | [TBD — e.g. BullMQ + Redis]         | See `docs/technical/DECISIONS.md` / open questions in PRD |
| Package manager | pnpm                                | Monorepo: `apps/web`, `apps/api`                          |
| CI/CD           | GitHub Actions                      | [TBD — add in infra task]                                 |

---

## Getting Started

### Prerequisites

- Node.js **20.x** LTS (see `.nvmrc`)
- **pnpm** 9+ (Corepack: `corepack enable && corepack prepare pnpm@latest --activate`)
- Supabase (or local PostgreSQL) for `DATABASE_URL`
- Redis or queue provider when worker tasks land (see PRD open questions)

### Installation

```bash
git clone https://github.com/[org]/outreach-ai-platform.git
cd outreach-ai-platform
corepack enable && corepack prepare pnpm@9.15.4 --activate
pnpm install
cp .env.example .env
# Edit .env with real values (never commit secrets)
```

### Running Locally

`pnpm dev` runs **Next.js on port 3000** and **NestJS on port 3001** together.

```bash
pnpm dev
```

Scoped:

```bash
pnpm --filter web dev
pnpm --filter api dev
```

### Running Tests

```bash
pnpm test
pnpm --filter web test
pnpm --filter api test
pnpm run test:e2e
pnpm run lint
pnpm run typecheck
```

---

## Project Structure

```
apps/
  web/                 # Next.js App Router
  api/                 # NestJS API
packages/              # Shared libraries (introduced as needed)
prisma/                # Prisma schema (exact path set during #002)
tests/e2e/             # Playwright
docs/
  technical/           # Architecture, API, database, ADRs, design system
  user/                # USER_GUIDE.md
  content/             # N/A for v1 (app-only); placeholder retained
.tasks/                # One markdown file per backlog item
PRD.md                 # Product requirements (human-governed edits)
TODO.md                # Backlog
CLAUDE.md              # Agent instructions
```

---

## Environment Variables

| Variable                                              | Required           | Description                                                     |
| ----------------------------------------------------- | ------------------ | --------------------------------------------------------------- |
| `DATABASE_URL`                                        | Yes                | PostgreSQL connection string (Supabase pooler or direct)        |
| `JWT_SECRET`                                          | Yes                | Secret used to sign API JWTs                                    |
| `JWT_EXPIRES_IN`                                      | No                 | Token TTL (e.g. `7d`) — default chosen at implementation        |
| `NEXT_PUBLIC_API_URL`                                 | Yes                | Browser-facing Nest API base URL (e.g. `http://localhost:3001`) |
| `WEB_ORIGIN`                                          | Yes (prod)         | Allowed browser origin for CORS (e.g. Vercel URL)               |
| `API_PUBLIC_URL`                                      | Yes (prod)         | Public base URL of the Nest API (webhooks, links)               |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | When using SMTP    | Outbound mail transport                                         |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`           | If using Gmail API | OAuth app for sending (v1 scope TBD in tasks)                   |
| `REDIS_URL`                                           | When queue enabled | BullMQ / rate-limit store                                       |

See `.env.example` once added in implementation tasks.

---

## Deployment

- **Web (Next.js)**: Vercel — connect the `apps/web` project (or monorepo root per Vercel docs).
- **API (NestJS)**: Railway — deploy `apps/api` with `DATABASE_URL` and secrets.
- **Database**: Supabase PostgreSQL.

CI/CD details: [TBD — tracked in backlog].

---

## License

See [LICENSE](LICENSE) if present; otherwise [TBD].
