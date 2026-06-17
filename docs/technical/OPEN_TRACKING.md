<!--
DOCUMENT METADATA
Owner: @backend-developer
Update trigger: Open tracking behavior, compliance, or analytics contracts change
-->

# Open tracking (v1)

> **Last updated**: 2026-04-18

## Mechanism

- Each `OutboundMessageJob` receives a unique, unguessable `openTrackingToken` (48 hex characters from 24 random bytes) when the job row is created at dispatch time.
- The outbound worker appends a 1×1 transparent GIF `<img>` to the HTML body before sending (inserted before `</body>` when present).
- The image `src` is `{API_PUBLIC_URL}/track/opens/{token}` (no `/v1` prefix; the route is excluded from the API global prefix).
- The first HTTP GET that successfully matches a **sent** job with `openedAt IS NULL` sets `openedAt` and appends one `OutboundMessageEvent` row with type `OPENED`. Subsequent loads are no-ops for persistence but still return the same pixel.

## Idempotency and analytics

- **Unique opens per message** (for open rate) are modeled by `openedAt` and a single `OPENED` event per job.
- Aggregates for dashboards (task #014) can count jobs with `openedAt` not null vs `status = SENT`.

## Privacy and limitations

- Recipients (and clients such as Apple Mail Privacy Protection) may **block remote images**; no open is recorded in that case.
- Some clients **prefetch** images; that can register an open before the human reads the message.
- The pixel URL is **not** authenticated; possession of the token is sufficient. Tokens are high-entropy and not embedded in predictable URLs besides the email itself.

## Fraud, bots, and false positives (v1 scope)

- Automated link scanners and security appliances may request the pixel URL and create a **false positive** open. Mitigations for later iterations: IP rate limits, ASN heuristics, delayed open confirmation, or correlation with ESP webhooks.
- **Provider-native** open events (Gmail postmaster, ESP dashboards) are not ingested in v1; the PRD open question remains for a future ADR if we dual-write or replace the pixel.

## Activity log (FR-080)

- Until the unified activity model (task #016) ships, **`OutboundMessageEvent` with type `OPENED`** is the canonical persisted signal for “email opened” alongside `OutboundMessageJob.openedAt`.
