#!/usr/bin/env bash
# Task #013 — POST /webhooks/inbound-replies (Bearer INBOUND_REPLY_WEBHOOK_SECRET)
#
# Requires: curl, jq. API must be running with migration applied and env set.
#
#   export INBOUND_REPLY_WEBHOOK_SECRET='...'   # min 32 chars, must match API .env
#   scripts/013-reply-detection/test-reply-detection.sh
#
# Optional: WORKSPACE_ID, LEAD_EMAIL, EXTERNAL_MSG_ID override the example body.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SHARED="$ROOT/scripts/_shared"

API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
EXAMPLE_BODY="${EXAMPLE_BODY:-$SHARED/inbound-reply-webhook.example.json}"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

if ! command -v jq >/dev/null 2>&1; then
  die "jq is required"
fi

if [[ -z "${INBOUND_REPLY_WEBHOOK_SECRET:-}" ]]; then
  die "Set INBOUND_REPLY_WEBHOOK_SECRET (min 32 chars) to match the API environment"
fi

if [[ ! -f "$EXAMPLE_BODY" ]]; then
  die "Missing body template: $EXAMPLE_BODY"
fi

BODY="$(cat "$EXAMPLE_BODY")"
if [[ -n "${WORKSPACE_ID:-}" ]]; then
  BODY="$(echo "$BODY" | jq --arg wid "$WORKSPACE_ID" '.workspaceId = $wid')"
fi
if [[ -n "${LEAD_EMAIL:-}" ]]; then
  BODY="$(echo "$BODY" | jq --arg em "$LEAD_EMAIL" '.leadEmail = $em')"
fi
if [[ -n "${EXTERNAL_MSG_ID:-}" ]]; then
  BODY="$(echo "$BODY" | jq --arg mid "$EXTERNAL_MSG_ID" '.externalMessageId = $mid')"
fi

HDR_AUTH="Authorization: Bearer ${INBOUND_REPLY_WEBHOOK_SECRET}"
WRONG_SECRET='bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

echo "== Reply detection smoke tests (API_BASE_URL=$API_BASE_URL)"
echo

echo "1) GET /health"
code="$(curl -sS -o /dev/null -w "%{http_code}" "$API_BASE_URL/health")"
[[ "$code" == "200" ]] || die "health expected 200, got $code"
echo "   OK (HTTP $code)"
echo

echo "2) POST /webhooks/inbound-replies — missing Authorization → 401"
code="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$API_BASE_URL/webhooks/inbound-replies" \
  -H "Content-Type: application/json" \
  --data-binary "$BODY")"
[[ "$code" == "401" ]] || die "expected 401 without secret, got $code"
echo "   OK (HTTP $code)"
echo

echo "3) POST /webhooks/inbound-replies — wrong Bearer → 401"
code="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$API_BASE_URL/webhooks/inbound-replies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${WRONG_SECRET}" \
  --data-binary "$BODY")"
[[ "$code" == "401" ]] || die "expected 401 for wrong secret, got $code"
echo "   OK (HTTP $code)"
echo

echo "4) POST /webhooks/inbound-replies — invalid JSON body → 422"
code="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$API_BASE_URL/webhooks/inbound-replies" \
  -H "Content-Type: application/json" \
  -H "$HDR_AUTH" \
  --data-binary '{"workspaceId":"not-a-uuid"}')"
[[ "$code" == "422" ]] || die "expected 422 for invalid body, got $code"
echo "   OK (HTTP $code)"
echo

echo "5) POST /webhooks/inbound-replies — valid body (404 until WORKSPACE_ID + LEAD_EMAIL match DB)"
tmp="$(mktemp)"
code="$(curl -sS -o "$tmp" -w "%{http_code}" -X POST "$API_BASE_URL/webhooks/inbound-replies" \
  -H "Content-Type: application/json" \
  -H "$HDR_AUTH" \
  --data-binary "$BODY")"
echo "   HTTP $code body:"
(jq . <"$tmp" 2>/dev/null) || cat "$tmp"
rm -f "$tmp"
[[ "$code" == "404" || "$code" == "200" ]] || die "expected 404 (unknown lead) or 200 (applied), got $code"
echo

echo "6) Route is NOT under /v1"
code_v1="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$API_BASE_URL/v1/webhooks/inbound-replies" \
  -H "Content-Type: application/json" \
  -H "$HDR_AUTH" \
  --data-binary "$BODY" || true)"
if [[ "$code_v1" == "404" ]] || [[ "$code_v1" == "401" ]]; then
  echo "   OK (/v1/webhooks/... not served as primary path; HTTP $code_v1)"
else
  echo "   WARN: unexpected HTTP $code_v1 for /v1/webhooks/inbound-replies"
fi
echo

echo "Optional: set WORKSPACE_ID + LEAD_EMAIL + EXTERNAL_MSG_ID, run twice with same EXTERNAL_MSG_ID — second response should be {\"status\":\"duplicate\"}."
echo "All smoke checks passed."
