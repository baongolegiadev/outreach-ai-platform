# TODO / Backlog

> **Governor**: @project-manager — invoke for sprint planning, prioritization, and feature breakdown  
> **Agents**: May add items to "Backlog" and move completed items to "Completed". Preserve section order.

---

## In Progress

---

## Up Next (prioritized)

- [ ] #006 — Leads REST API: CRUD, search/filter, tags [area: backend] → [.tasks/006-leads-rest-api.md](.tasks/006-leads-rest-api.md)
- [ ] #007 — Leads UI: table, detail drawer, tag + filter controls [area: frontend] → [.tasks/007-leads-ui.md](.tasks/007-leads-ui.md)

---

## Backlog

- [ ] #008 — CSV import: upload, validation report, bulk insert [area: backend] → [.tasks/008-csv-import-leads.md](.tasks/008-csv-import-leads.md)
- [ ] #009 — Sequences API: campaigns, ordered steps with delays, merge fields [area: backend] → [.tasks/009-sequences-api.md](.tasks/009-sequences-api.md)
- [ ] #010 — Sequence builder UI + lead enrollment [area: frontend] → [.tasks/010-sequence-builder-ui.md](.tasks/010-sequence-builder-ui.md)
- [ ] #011 — Outbound mailer: queue worker, SMTP/Gmail adapter, retries + per-inbox rate limits [area: backend] → [.tasks/011-outbound-mailer-queue.md](.tasks/011-outbound-mailer-queue.md)
- [ ] #012 — Open tracking: pixel or provider hook, persist opens, analytics inputs [area: backend] → [.tasks/012-open-tracking.md](.tasks/012-open-tracking.md)
- [ ] #013 — Reply detection + auto-stop enrollment + lead reply status [area: backend] → [.tasks/013-reply-detection.md](.tasks/013-reply-detection.md)
- [ ] #014 — Analytics dashboard API + UI (sent, open rate, reply rate, active campaigns, funnel) [area: frontend] → [.tasks/014-analytics-dashboard.md](.tasks/014-analytics-dashboard.md)
- [ ] #015 — Pipeline Kanban: stages, drag-and-drop, API persistence [area: frontend] → [.tasks/015-pipeline-kanban.md](.tasks/015-pipeline-kanban.md)
- [ ] #016 — Activity log: event model, writers, and query API [area: backend] → [.tasks/016-activity-log-backend.md](.tasks/016-activity-log-backend.md)
- [ ] #017 — Activity log: timeline UI (lead + workspace views) [area: frontend] → [.tasks/017-activity-log-ui.md](.tasks/017-activity-log-ui.md)

---

## Completed

- [x] #005 — Next.js app shell: auth screens and API client [area: frontend] → [.tasks/005-next-app-shell.md](.tasks/005-next-app-shell.md)
- [x] #004 — Auth API: register, login, JWT, logout; workspace context guard [area: backend] → [.tasks/004-auth-api-jwt.md](.tasks/004-auth-api-jwt.md)
- [x] #003 — NestJS foundations (config, Prisma module, health, validation, error shape) [area: backend] → [.tasks/003-nest-foundations.md](.tasks/003-nest-foundations.md)
- [x] #002 — Prisma schema: users, workspaces, memberships, RBAC, leads, tags [area: database] → [.tasks/002-prisma-core-schema.md](.tasks/002-prisma-core-schema.md)
- [x] #001 — Scaffold pnpm monorepo (apps/web Next.js, apps/api NestJS, shared tooling, root scripts) [area: setup] → [.tasks/001-monorepo-scaffold.md](.tasks/001-monorepo-scaffold.md)
- [x] #000 — Initial project setup and template configuration → [.tasks/000-initial-project-setup.md](.tasks/000-initial-project-setup.md)

---

## Item Format Guide

```
- [ ] #NNN — Brief description [area: frontend|backend|database|qa|docs|infra|design|setup] → [.tasks/NNN-short-title.md](.tasks/NNN-short-title.md)
```

**Area tags**: `frontend` → @frontend-developer · `backend` → @backend-developer · `database` → @database-expert · `design` → @ui-ux-designer · `qa` → @qa-engineer · `docs` → @documentation-writer · `infra` → @systems-architect · `setup` → general orchestration
