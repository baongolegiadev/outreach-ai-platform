# Outreach AI Platform — Claude Instructions

> Stack: Next.js (App Router) · TypeScript · NestJS · PostgreSQL (Supabase) · Prisma · Vercel · Railway · pnpm
> Last updated: 2026-04-12

## Project Context

Outreach AI Platform is an email-first outbound SaaS for **SDRs, sales teams, founders, and growth teams**. It automates lead management, multi-step email sequences, queued sending with retries and rate limits, reply detection, analytics, and a lightweight Kanban pipeline—built for **real daily usage**, not a demo.

**Tech stack summary**: Next.js (web) · NestJS (API) · PostgreSQL on Supabase · Prisma · JWT auth · pnpm monorepo

---

## Agents Available

**Mandatory delegation — this is not optional.** Every task that falls within a specialist's domain MUST be routed to that agent. Do not implement code, design schemas, write docs, or configure pipelines yourself — delegate. Only handle directly: project-level questions, routing decisions, and tasks explicitly outside all specialist domains.

| Agent | Role | Invoke when... |
|-------|------|----------------|
| `project-manager` | Backlog & coordination | "What's next?", sprint planning, breaking down features, reprioritizing |
| `systems-architect` | Architecture & ADRs | New feature design, tech decisions, system integration |
| `frontend-developer` | UI implementation | Components, pages, client-side state, styling |
| `react-native-developer` | Mobile UI implementation | React Native screens, navigation, native modules, platform styling, mobile performance |
| `backend-developer` | API & business logic | Endpoints, auth, background jobs, integrations |
| `ui-ux-designer` | UX & design system | User flows, wireframes, component specs, accessibility |
| `database-expert` | Schema & queries | Migrations, schema design, query optimization |
| `qa-engineer` | Testing (Playwright) | E2E tests, test strategy, coverage gaps |
| `documentation-writer` | Living docs | User guide updates, post-feature documentation |
| `cicd-engineer` | CI/CD & GitHub Actions | Pipelines, deployments, branch protection, release automation |
| `docker-expert` | Containerization | Dockerfiles, docker-compose, image optimization, container networking |
| `copywriter-seo` | Copy & SEO | Landing page copy, marketing content, meta tags, keyword strategy, structured data specs, brand voice |

---

## Critical Rules

These apply to all agents at all times. No exceptions without explicit human instruction.

1. **PRD.md requires explicit human approval to modify.** Do not edit it unless the human has clearly instructed you to do so in the current conversation. Read it to understand requirements.
2. **TODO.md is the living backlog.** Agents may add items, mark items complete, and move items to "Completed". Preserve section order and existing item priority — do not reorder items within a section unless explicitly asked to reprioritize.
3. **All commits use Conventional Commits format** (see Git Conventions below).
4. **Update the relevant `docs/` file** after every significant change before marking a task complete.
5. **Run tests before marking any implementation task complete.**
6. **Never hardcode secrets, credentials, or environment-specific values** in source code.
7. **Consult `docs/technical/DECISIONS.md`** before proposing changes that may conflict with prior architectural decisions.
8. **Always delegate to the right specialist.** If a task touches frontend, mobile (React Native), backend, database, UX/design, QA, documentation, CI/CD, Docker, or copy/SEO — invoke the appropriate agent immediately. Do not implement it yourself. The delegation table above is binding, not advisory.
9. **Commit your own changes; never push.** After completing your work, create a local commit (Conventional Commits format). Do not `git push`. The orchestrator is responsible for pushing the branch and opening the PR.

---

## Slash Commands

Use these commands to trigger common multi-step workflows:

| Command | What it does |
|---------|--------------|
| `/orchestrate <task>` | Full multi-agent task execution — decompose, plan, branch, execute in waves |
| `/review [branch or file]` | Multi-agent code review: architectural drift + test coverage + implementation quality |
| `/release [version]` | Pre-release quality pass — QA, docs, CI/CD check, gated release checklist |
| `/checkpoint [description]` | Verify docs, run lint/tests, commit WIP before pausing |
| `/status` | Render a live project health card (tasks, commits, open PRs, blockers) |
| `/start` | Run project onboarding from `START_HERE.md` |
| `/sync-template` | Pull latest agent definitions and templates from upstream |

---

## MCP Servers

Project MCP servers are declared in `.mcp.json` (committed to the repo — shared by the whole team). No extra credentials required — both servers are unauthenticated.

| Server | Purpose | Agents that use it |
|--------|---------|-------------------|
| `sequential-thinking` | Structured multi-step reasoning scratchpad | `systems-architect`, `project-manager` |
| `context7` | Live, version-accurate library documentation | `frontend-developer`, `react-native-developer`, `backend-developer`, `database-expert`, `docker-expert` |

**GitHub integration** — use the `gh` CLI (already authenticated via `gh auth login`). All agents with `Bash` access can run `gh` commands directly. No token configuration needed.

---

## Hooks

Hooks in `.claude/settings.json` fire automatically and enforce conventions that are otherwise advisory:

| Hook | Trigger | What it does |
|------|---------|--------------|
| `guard-destructive.sh` | Before any Bash call | Blocks `rm -rf`, `git push --force`, `DROP TABLE`, `npm publish`, and direct pushes to `main` |
| `format-on-write.sh` | After any Write or Edit | Runs prettier/eslint (JS/TS), ruff/black (Python), gofmt (Go), or rustfmt on the changed file — no-ops if tooling not installed |
| `validate-completion.sh` | When Claude finishes a turn | Warns if implementation files changed but `docs/` was not updated, or if `TODO.md` was not updated |
| `log-agent.sh` | When a subagent starts | Appends a timestamped line to `.claude/agent-log.txt` for an audit trail |

Hooks are non-interactive — they run silently unless they block an action or print a warning.

---

## File-Scoped Rules

Rules in `.claude/rules/` inject context automatically based on the file being edited:

| Rule file | Applied to | Key standards |
|-----------|-----------|---------------|
| `typescript.md` | `*.ts`, `*.tsx` | No `any`, no `!` assertions, no `console.log`, explicit return types |
| `migrations.md` | `*.sql`, `migrations/**` | Reversible migrations, naming convention, no destructive ops without guards |
| `tests.md` | `*.spec.ts`, `*.test.ts`, `tests/**` | Page Object Model, `data-testid` selectors, no `test.only`, 80% coverage |

---

## Project Structure

```
apps/
  web/                  # Next.js App Router (Vercel)
  api/                  # NestJS API (Railway)
packages/               # Shared types, eslint config, etc. (as introduced)
prisma/                 # Prisma schema & migrations (location TBD in monorepo — follow task #002)
tests/
  e2e/                  # Playwright E2E tests (*.spec.ts)
docs/
  user/USER_GUIDE.md
  technical/            # Architecture, API, DB, decisions, design system
  content/              # N/A for v1 (app-only); file retained for template compatibility
.claude/
  agents/
  commands/
  hooks/
  rules/
  settings.json
  templates/            # Upstream templates — do not edit
.mcp.json
.tasks/                 # Detailed task files — one per TODO item
```

---

## Git Conventions

### Commit Format
```
<type>(<scope>): <short description>

[optional body]
[optional footer: Closes #issue]
```

**Types**: `feat` · `fix` · `docs` · `style` · `refactor` · `test` · `chore` · `perf` · `ci`

### Branch Naming
```
feature/<ticket-id>-short-description
fix/<ticket-id>-short-description
chore/<description>
docs/<description>
refactor/<description>
```

### PR Requirements

> **Workflow note:** Specialist agents commit locally; the orchestrator pushes and opens the PR.

- PR title follows Conventional Commits format
- Fill out `.github/PULL_REQUEST_TEMPLATE.md` completely — do not delete sections
- Link to the related issue/ticket (`Closes #XXX`)
- At least one reviewer required before merge
- All CI checks must pass

---

## Code Style

- **Language**: TypeScript (strict mode) in both `apps/web` and `apps/api`
- **Formatter**: Prettier (root + package configs as added in task #001)
- **Linter**: ESLint (Next.js + NestJS appropriate configs)
- **Import style**: Prefer path aliases per package (`@/` etc.) once configured in each app
- **No `console.log`** in production code — use the project logger utility once introduced
- **No commented-out code** committed — delete it or track it in TODO.md

---

## Testing Conventions

- **Web unit tests**: Vitest — colocated or `*.test.ts` / `*.spec.ts` per `apps/web` config
- **API unit tests**: Jest — NestJS default (`*.spec.ts` next to sources)
- **E2E tests**: Playwright — in `tests/e2e/*.spec.ts`
- **Run from repo root**: `pnpm test` (runs all workspaces); scoped: `pnpm --filter web test` / `pnpm --filter api test`
- **Run E2E**: `pnpm run test:e2e` (after scripts exist)
- **Coverage target**: 80% for new features
- E2E tests use Page Object Model pattern and `data-testid` selectors

---

## Environment & Commands

- **Node**: 20.x LTS (see `.nvmrc`)
- **Package manager**: pnpm
- `pnpm dev` — start all apps in dev (monorepo root)
- `pnpm build` — production build for all packages/apps
- `pnpm test` — unit tests (web: Vitest, api: Jest)
- `pnpm run test:e2e` — E2E tests (once configured)
- `pnpm run lint` — lint check (root orchestrates filters)
- `pnpm run typecheck` — TypeScript check across workspaces

Scoped examples: `pnpm --filter web dev`, `pnpm --filter api dev`

---

## Key Documentation

@docs/technical/ARCHITECTURE.md
@docs/technical/DESIGN_SYSTEM.md
@docs/technical/DECISIONS.md
@docs/technical/API.md
@docs/technical/DATABASE.md
@docs/user/USER_GUIDE.md
