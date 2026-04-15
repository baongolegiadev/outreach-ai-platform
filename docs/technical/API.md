<!--
DOCUMENT METADATA
Owner: @backend-developer
Update trigger: Endpoints added/changed/removed
-->

# API Reference

> **Base URL (production)**: `[TBD — Railway service URL]/v1`  
> **Base URL (local)**: `http://localhost:3001/v1`  
> **Authentication**: `Authorization: Bearer <JWT>`  
> **Content-Type**: `application/json`  
> **Last updated**: 2026-04-13

Concrete route list, request/response schemas, and error codes will be appended as endpoints ship (start with **task #004** auth and **#006** leads).

---

## Authentication

### How to Authenticate

Include JWT on each request:

```
Authorization: Bearer <access_token>
```

### Obtaining a Token

Use `POST /v1/auth/register` or `POST /v1/auth/login`.

### Workspace Context Strategy

Workspace-scoped routes use one of these patterns:

1. **Header strategy (default):** pass `x-workspace-id: <workspace_uuid>`
2. **Path strategy:** include `:workspaceId` route params for nested resources

Both strategies are enforced by the workspace guard layer. A user must be a member of the target workspace; membership role is attached to request context for role checks (`ADMIN`, `MEMBER`).

---

## Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [],
    "requestId": "optional-request-correlation-id"
  }
}
```

| HTTP Status | Code               | Meaning                        |
| ----------- | ------------------ | ------------------------------ |
| 400         | `VALIDATION_ERROR` | Invalid input                  |
| 401         | `UNAUTHENTICATED`  | Missing/invalid JWT            |
| 403         | `UNAUTHORIZED`     | Not allowed for workspace/role |
| 404         | `NOT_FOUND`        | Unknown resource               |
| 409         | `CONFLICT`         | State conflict / duplicate     |
| 429         | `RATE_LIMITED`     | Throttled                      |
| 500         | `INTERNAL_ERROR`   | Unhandled server error         |

---

## Rate Limiting

[TBD — document per-route limits for auth and send enqueue endpoints]

---

## Endpoints

#### [GET] /health

**Auth required**: No
**Description**: Service health check for uptime probes. This route is intentionally outside the `/v1` prefix.

**Request body**:

```json
{}
```

**Response 200**:

```json
{
  "status": "ok"
}
```

**Error codes**:

- `500` - Internal server error

---

#### [POST] /auth/register

**Auth required**: No
**Description**: Register a new user, create their first workspace, and issue an access token.

**Request body**:

```json
{
  "email": "string - valid email",
  "password": "string - 8 to 128 characters",
  "name": "string - optional display name",
  "workspaceName": "string - initial workspace name"
}
```

**Response 201**:

```json
{
  "accessToken": "string - JWT access token",
  "tokenType": "Bearer",
  "expiresIn": "number - seconds",
  "user": {
    "id": "string - user UUID",
    "email": "string - user email",
    "name": "string|null - display name"
  },
  "workspace": {
    "id": "string - workspace UUID",
    "name": "string - workspace name",
    "role": "ADMIN"
  }
}
```

**Error codes**:

- `409` - Email already registered
- `422` - Validation error
- `500` - Internal server error

#### [POST] /auth/login

**Auth required**: No
**Description**: Authenticate with email/password and issue an access token for a workspace.

**Request body**:

```json
{
  "email": "string - valid email",
  "password": "string - 8 to 128 characters",
  "workspaceId": "string - optional workspace UUID; defaults to first membership"
}
```

**Response 200**:

```json
{
  "accessToken": "string - JWT access token",
  "tokenType": "Bearer",
  "expiresIn": "number - seconds",
  "user": {
    "id": "string - user UUID",
    "email": "string - user email",
    "name": "string|null - display name"
  },
  "workspace": {
    "id": "string - workspace UUID",
    "name": "string - workspace name",
    "role": "ADMIN|MEMBER"
  }
}
```

**Error codes**:

- `401` - Invalid credentials or no workspace membership
- `422` - Validation error
- `500` - Internal server error

#### [POST] /auth/logout

**Auth required**: Yes
**Description**: Logout acknowledgment endpoint for stateless JWT flow (client discards access token).

**Request body**:

```json
{}
```

**Response 200**:

```json
{
  "success": true,
  "message": "Logged out. Discard the access token on the client."
}
```

**Error codes**:

- `401` - Missing or invalid JWT
- `500` - Internal server error

#### [GET] /protected/workspace

**Auth required**: Yes
**Description**: Sample protected route proving JWT auth + workspace membership enforcement (header strategy).

**Request body**:

```json
{}
```

**Response 200**:

```json
{
  "message": "Workspace membership verified",
  "userId": "string - authenticated user UUID",
  "workspaceId": "string - workspace UUID from x-workspace-id",
  "role": "ADMIN|MEMBER"
}
```

**Error codes**:

- `401` - Missing or invalid JWT
- `403` - Missing workspace header or no workspace membership
- `500` - Internal server error

#### [GET] /protected/workspaces/:workspaceId/admin

**Auth required**: Yes
**Description**: Sample protected admin-only route proving role-based extension point.

**Request body**:

```json
{}
```

**Response 200**:

```json
{
  "message": "Admin-level workspace access verified",
  "userId": "string - authenticated user UUID",
  "workspaceId": "string - workspace UUID from route param",
  "role": "ADMIN"
}
```

**Error codes**:

- `401` - Missing or invalid JWT
- `403` - Not a workspace member or missing required role
- `500` - Internal server error

---

#### [POST] /leads

**Auth required**: Yes  
**Workspace context**: `x-workspace-id` header required  
**Description**: Create a workspace-scoped lead and optionally assign workspace tags.

**Request body**:

```json
{
  "name": "string - required, 1..160 chars",
  "email": "string - required, valid email",
  "company": "string - optional, 1..160 chars",
  "tagIds": ["string - optional tag UUIDs in same workspace"]
}
```

**Response 201**:

```json
{
  "id": "string - lead UUID",
  "name": "string",
  "email": "string",
  "company": "string|null",
  "createdAt": "string - ISO datetime",
  "updatedAt": "string - ISO datetime",
  "tags": [
    {
      "id": "string - tag UUID",
      "name": "string - tag name"
    }
  ]
}
```

**Error codes**:

- `401` - Missing or invalid JWT
- `403` - Missing workspace header or no workspace membership
- `409` - Duplicate lead email in this workspace
- `422` - Validation error (payload or invalid tag IDs)
- `500` - Internal server error

#### [GET] /leads

**Auth required**: Yes  
**Workspace context**: `x-workspace-id` header required  
**Description**: List workspace leads with search/filter and offset pagination.

**Query params**:

- `search` (optional): case-insensitive partial match against name, email, or company
- `company` (optional): case-insensitive partial match on company
- `tagIds` (optional): comma-separated UUIDs, returns leads matching any provided tag
- `limit` (optional): default `25`, min `1`, max `100`
- `offset` (optional): default `0`, min `0`

**Response 200**:

```json
{
  "data": [
    {
      "id": "string - lead UUID",
      "name": "string",
      "email": "string",
      "company": "string|null",
      "createdAt": "string - ISO datetime",
      "updatedAt": "string - ISO datetime",
      "tags": [
        {
          "id": "string - tag UUID",
          "name": "string - tag name"
        }
      ]
    }
  ],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "total": 1200,
    "hasMore": true
  }
}
```

**Error codes**:

- `401` - Missing or invalid JWT
- `403` - Missing workspace header or no workspace membership
- `422` - Validation error (query params)
- `500` - Internal server error

#### [GET] /leads/:leadId

**Auth required**: Yes  
**Workspace context**: `x-workspace-id` header required  
**Description**: Get a single lead in the current workspace.

**Response 200**: Same shape as `POST /leads`.

**Error codes**:

- `401` - Missing or invalid JWT
- `403` - Missing workspace header or no workspace membership
- `404` - Lead not found in workspace
- `500` - Internal server error

#### [PATCH] /leads/:leadId

**Auth required**: Yes  
**Workspace context**: `x-workspace-id` header required  
**Description**: Update lead fields and optionally replace all lead tags.

**Request body**:

```json
{
  "name": "string - optional",
  "email": "string - optional",
  "company": "string - optional",
  "tagIds": ["string - optional; replaces current tags when provided"]
}
```

At least one field must be provided.

**Response 200**: Same shape as `POST /leads`.

**Error codes**:

- `401` - Missing or invalid JWT
- `403` - Missing workspace header or no workspace membership
- `404` - Lead not found in workspace
- `409` - Duplicate lead email in this workspace
- `422` - Validation error (payload or invalid tag IDs)
- `500` - Internal server error

#### [DELETE] /leads/:leadId

**Auth required**: Yes  
**Workspace context**: `x-workspace-id` header required  
**Description**: Delete a lead in the current workspace.

**Response 200**:

```json
{
  "success": true
}
```

**Error codes**:

- `401` - Missing or invalid JWT
- `403` - Missing workspace header or no workspace membership
- `404` - Lead not found in workspace
- `500` - Internal server error

---

## Changelog

| Date       | Change                                                                        |
| ---------- | ----------------------------------------------------------------------------- |
| 2026-04-12 | Initial shell — stack and auth model noted                                    |
| 2026-04-13 | Added `/health`, stable error-code mappings, and base-route clarification     |
| 2026-04-13 | Added auth endpoints, JWT/workspace strategy, and protected workspace samples |
| 2026-04-15 | Added workspace-scoped leads CRUD endpoints with search/filter/tag support    |
