<!--
DOCUMENT METADATA
Owner: @backend-developer
Update trigger: Endpoints added/changed/removed
-->

# API Reference

> **Base URL (production)**: `[TBD — Railway service URL]/v1`  
> **Base URL (local)**: `http://localhost:3001/v1` [port TBD with implementation]  
> **Authentication**: `Authorization: Bearer <JWT>` unless cookie model adopted  
> **Content-Type**: `application/json`  
> **Last updated**: 2026-04-12

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
    "details": []
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

---

## Rate Limiting

[TBD — document per-route limits for auth and send enqueue endpoints]

---

## Endpoints

_Endpoint sections from the template will be filled in as the Nest modules land._

---

## Changelog

| Date       | Change                                     |
| ---------- | ------------------------------------------ |
| 2026-04-12 | Initial shell — stack and auth model noted |
