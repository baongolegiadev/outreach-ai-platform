<!--
Owner: backend / QA — update when adding or moving task scripts.
-->

# Manual test scripts (by task)

Shell and Node helpers live under **`scripts/<NNN-task-slug>/`**. Shared JSON/CSV fixtures are in **`scripts/_shared/`**.

Run scripts from the **repository root** (paths below assume that).

## Task index (#001–#017)

| Task | Area | Scripts in this repo |
| ---- | ---- | --------------------- |
| **001** | Monorepo scaffold | — |
| **002** | Prisma core schema | Use Prisma CLI (`pnpm migrate:dev`, etc.), no bash helper here |
| **003** | Nest foundations | Tests live under `apps/api` |
| **004** | Auth JWT | `scripts/004-auth/test-register.sh`, `test-login.sh`, `test-logout.sh` · bodies: `scripts/_shared/login.json`, `register.example.json` |
| **005** | Next app shell | Frontend |
| **006** | Leads REST API | No bash helper yet |
| **007** | Leads UI | Frontend |
| **008** | CSV import leads | `scripts/008-csv-import/test-csv-import.sh` |
| **009** | Sequences API | `scripts/009-sequences-api/test-sequences-api.sh` |
| **010** | Sequence builder UI | Frontend |
| **011** | Outbound mailer queue | `scripts/011-outbound-mailer/test-queue.sh`, `test-send-to-email.sh` |
| **012** | Open tracking | `scripts/012-open-tracking/test-open-tracking.sh`, `test-open-tracking-integration.mjs` |
| **013**–**017** | (reply, analytics, pipeline, activity) | Not added yet |

## Shared fixtures (`scripts/_shared/`)

These files are **data only** (JSON/CSV). **Do not run them as shell commands** (e.g. `scripts/_shared/login.json` will fail: the shell tries to execute JSON). They are read by the `*.sh` scripts or by `curl --data @...`.

| File | Purpose |
| ---- | ------- |
| `login.json` | Login request body (`email`, `password`) for the API |
| `register.example.json` | Example register body — **edit `email` to a unique value** if used with `REGISTER_JSON=` |
| `workspace.json` | Default `workspaceId` for curl / optional login context |
| `lead-create.json` | Create a test lead |
| `sequence-create.json` | Create a test sequence |
| `sequence-step-create.json` | Create a test step |
| `sequence-enroll.json` | Enroll payload (placeholder `leadIds`) |
| `sample-leads.csv` | Sample CSV for import |

## Quick commands

```bash
chmod +x scripts/*/**/*.sh   # Linux/WSL if needed

# Auth (task 004)
scripts/004-auth/test-register.sh
SAVE_WORKSPACE_JSON=1 scripts/004-auth/test-register.sh   # optional: overwrite scripts/_shared/workspace.json
scripts/004-auth/test-login.sh
scripts/004-auth/test-logout.sh

scripts/008-csv-import/test-csv-import.sh
scripts/009-sequences-api/test-sequences-api.sh
scripts/011-outbound-mailer/test-queue.sh
scripts/012-open-tracking/test-open-tracking.sh
scripts/012-open-tracking/test-open-tracking.sh --integration
```

Integration mode for open tracking (`--integration`) needs a `.env` at the repo root and at least one `SENT` outbound job (e.g. after running the task **011** queue script).

Standalone Node check:

```bash
node --env-file=.env scripts/012-open-tracking/test-open-tracking-integration.mjs
```
