<!--
DOCUMENT METADATA
Owner: @backend-developer
Update trigger: Endpoints added/changed/removed
-->

# API Reference

> **Base URL (production)**: `[TBD — Railway service URL]/v1`  
> **Base URL (local)**: `http://localhost:3001/v1`  
> **Authentication**: `Authorization: Bearer <JWT>` unless cookie model adopted  
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

See future sections: `POST /v1/auth/register`, `POST /v1/auth/login` (names illustrative).

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

## Changelog

| Date       | Change                                     |
| ---------- | ------------------------------------------ |
| 2026-04-12 | Initial shell — stack and auth model noted |
| 2026-04-13 | Added `/health`, stable error-code mappings, and base-route clarification |
