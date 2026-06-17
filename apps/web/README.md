# Web App (`apps/web`)

Next.js App Router frontend for Outreach AI Platform.

## Stack

- Next.js 15 + TypeScript
- Tailwind CSS v4
- shadcn/ui component patterns
- Vitest (smoke/unit tests)

## Environment

The web app expects:

- `NEXT_PUBLIC_API_URL` (example: `http://localhost:3001`)

Auth requests target `${NEXT_PUBLIC_API_URL}/v1/auth/*`.

## Local Development

From repo root:

```bash
corepack pnpm --filter web dev
```

Web runs on `http://localhost:3000`.

## Auth Shell Notes

- `/login` and `/signup` provide auth form flows.
- `/app` is the protected authenticated shell.
- Middleware guards `/app` and redirects unauthenticated traffic to `/login`.
- Current session strategy stores token payload in `localStorage` and mirrors access token into a non-httpOnly cookie for middleware route gating. This is an interim approach until API-issued httpOnly cookie/BFF flow is implemented.
