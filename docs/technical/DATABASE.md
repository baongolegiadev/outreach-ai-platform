<!--
DOCUMENT METADATA
Owner: @database-expert
-->

# Database Reference

> **Engine**: PostgreSQL (Supabase-managed)  
> **ORM**: Prisma  
> **Connection**: `DATABASE_URL`  
> **Last updated**: 2026-04-13

---

## Schema Overview

Current core entities implemented in task `002-prisma-core-schema`: **User**, **Workspace**, **Membership** (user ↔ workspace + role), **Lead** (workspace-scoped), **Tag** (workspace-scoped), and **LeadTag** (M:N join between leads and tags).

```
User ──< Membership >── Workspace
Workspace ──< Lead ──< LeadTag >── Tag
```

---

## Tables

### User

**Purpose**: Account identity for API authentication and workspace membership.

| Column    | Type           | Constraints                               | Description                         |
| --------- | -------------- | ----------------------------------------- | ----------------------------------- |
| id        | uuid           | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Primary key                         |
| email     | text           | NOT NULL, UNIQUE                          | Login and identity email            |
| name      | text           | NULL                                      | Optional display name               |
| createdAt | timestamptz(6) | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`     | Record creation timestamp           |
| updatedAt | timestamptz(6) | NOT NULL                                  | Last update timestamp (app-managed) |

**Indexes**:

- `User_email_key` on `(email)` - global uniqueness and direct lookup by email.

**Relationships**:

- Referenced by `Membership.userId` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`).

**Notes**: User rows can belong to multiple workspaces via `Membership`.

### Workspace

**Purpose**: Tenant boundary for all business data and authorization scope.

| Column    | Type           | Constraints                               | Description               |
| --------- | -------------- | ----------------------------------------- | ------------------------- |
| id        | uuid           | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Primary key               |
| name      | text           | NOT NULL                                  | Workspace name            |
| createdAt | timestamptz(6) | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`     | Record creation timestamp |
| updatedAt | timestamptz(6) | NOT NULL                                  | Last update timestamp     |

**Relationships**:

- Referenced by `Membership.workspaceId` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`).
- Referenced by `Lead.workspaceId` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`).
- Referenced by `Tag.workspaceId` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`).

**Notes**: Deleting a workspace cascades to memberships, leads, tags, and lead-tag links.

### Membership

**Purpose**: Workspace access mapping and role assignment (`ADMIN` or `MEMBER`).

| Column      | Type           | Constraints                           | Description                     |
| ----------- | -------------- | ------------------------------------- | ------------------------------- |
| userId      | uuid           | NOT NULL, FK -> `User.id`             | Linked user                     |
| workspaceId | uuid           | NOT NULL, FK -> `Workspace.id`        | Linked workspace                |
| role        | MembershipRole | NOT NULL, DEFAULT `'MEMBER'`          | Authorization role in workspace |
| createdAt   | timestamptz(6) | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Membership creation timestamp   |

**Indexes**:

- `Membership_pkey` on `(userId, workspaceId)` - prevents duplicate memberships.
- `Membership_workspaceId_role_idx` on `(workspaceId, role)` - workspace member listing by role.

**Relationships**:

- `userId` -> `User.id` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`)
- `workspaceId` -> `Workspace.id` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`)

**Notes**: Composite PK enforces one role per user-workspace pair.

### Lead

**Purpose**: Workspace-scoped contact record used for lead management and campaign targeting.

| Column      | Type           | Constraints                               | Description                           |
| ----------- | -------------- | ----------------------------------------- | ------------------------------------- |
| id          | uuid           | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Primary key                           |
| workspaceId | uuid           | NOT NULL, FK -> `Workspace.id`            | Tenant scope (required for all leads) |
| name        | text           | NOT NULL                                  | Lead name                             |
| email       | text           | NOT NULL                                  | Lead email                            |
| company     | text           | NULL                                      | Lead company                          |
| createdAt   | timestamptz(6) | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`     | Record creation timestamp             |
| updatedAt   | timestamptz(6) | NOT NULL                                  | Last update timestamp                 |

**Indexes**:

- `Lead_workspaceId_email_key` on `(workspaceId, email)` - unique email per workspace.
- `Lead_workspaceId_name_idx` on `(workspaceId, name)` - scoped name search and sorting.
- `Lead_workspaceId_company_idx` on `(workspaceId, company)` - company filtering.
- `Lead_workspaceId_createdAt_idx` on `(workspaceId, createdAt)` - stable pagination and latest-first feeds.

**Relationships**:

- `workspaceId` -> `Workspace.id` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`)
- Referenced by `LeadTag.leadId` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`)

**Notes**: The `(workspaceId, email)` uniqueness rule guarantees no duplicate lead email within a tenant while allowing the same email across different workspaces.

### Tag

**Purpose**: Workspace-scoped labels used to classify leads for filtering and segmentation.

| Column      | Type           | Constraints                               | Description               |
| ----------- | -------------- | ----------------------------------------- | ------------------------- |
| id          | uuid           | PK, NOT NULL, DEFAULT `gen_random_uuid()` | Primary key               |
| workspaceId | uuid           | NOT NULL, FK -> `Workspace.id`            | Tenant scope              |
| name        | text           | NOT NULL                                  | Tag display name          |
| createdAt   | timestamptz(6) | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`     | Record creation timestamp |
| updatedAt   | timestamptz(6) | NOT NULL                                  | Last update timestamp     |

**Indexes**:

- `Tag_workspaceId_name_key` on `(workspaceId, name)` - unique tag names per workspace.
- `Tag_workspaceId_name_idx` on `(workspaceId, name)` - efficient workspace tag filtering.

**Relationships**:

- `workspaceId` -> `Workspace.id` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`)
- Referenced by `LeadTag.tagId` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`)

**Notes**: Tags are isolated by workspace for strict tenant separation.

### LeadTag

**Purpose**: Many-to-many join between leads and tags.

| Column    | Type           | Constraints                           | Description             |
| --------- | -------------- | ------------------------------------- | ----------------------- |
| leadId    | uuid           | NOT NULL, FK -> `Lead.id`             | Linked lead             |
| tagId     | uuid           | NOT NULL, FK -> `Tag.id`              | Linked tag              |
| createdAt | timestamptz(6) | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Link creation timestamp |

**Indexes**:

- `LeadTag_pkey` on `(leadId, tagId)` - prevents duplicate lead-tag links.
- `LeadTag_tagId_leadId_idx` on `(tagId, leadId)` - tag-based lead filtering.

**Relationships**:

- `leadId` -> `Lead.id` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`)
- `tagId` -> `Tag.id` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`)

**Notes**: Cascading deletes avoid orphan rows when leads or tags are removed.

---

## Migrations Log

| Migration                       | Date       | Description                                                                                                                                                                                                                      |
| ------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `202604130001_init_core_schema` | 2026-04-13 | Added initial Prisma core schema for users, workspaces, memberships, leads, tags, and lead-tag join table. Includes FK cascades, lead uniqueness on `(workspaceId, email)`, and workspace-scoped indexes for lead/tag filtering. |

Rollback companion: `prisma/migrations/202604130001_init_core_schema/rollback.sql` (destructive, local/dev recovery only).

---

## Query Patterns

- All domain queries must scope by `workspaceId` to enforce tenant isolation.
- Leads list pattern: `WHERE workspaceId = $1 ORDER BY createdAt DESC LIMIT/OFFSET` (uses `Lead_workspaceId_createdAt_idx`).
- Search/filter pattern: workspace-scoped filters on `name`, `company`, and tags (`LeadTag` + `Tag` join).
- Tag filter pattern: `JOIN LeadTag ON LeadTag.leadId = Lead.id WHERE LeadTag.tagId = $tagId AND Lead.workspaceId = $workspaceId`.

---

## Known Issues & Tech Debt

| Issue                                                                       | Impact                                               | Plan                                           |
| --------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| No case-insensitive email uniqueness yet (`citext` or normalized lowercase) | Potential duplicate casing variants within workspace | Evaluate in auth + lead import hardening tasks |
