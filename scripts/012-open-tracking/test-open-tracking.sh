#!/usr/bin/env bash
# Task #012 — Open tracking (pixel + GET /track/opens/:token).
#
#   scripts/012-open-tracking/test-open-tracking.sh
#   scripts/012-open-tracking/test-open-tracking.sh --integration

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
INTEGRATION=0
if [[ "${1:-}" == "--integration" ]] || [[ "${1:-}" == "-i" ]]; then
  INTEGRATION=1
fi

die() {
  echo "ERROR: $*" >&2
  exit 1
}

echo "== Open tracking smoke tests (API_BASE_URL=$API_BASE_URL)"
echo

echo "1) GET /health"
code="$(curl -sS -o /dev/null -w "%{http_code}" "$API_BASE_URL/health")"
[[ "$code" == "200" ]] || die "health expected 200, got $code"
echo "   OK (HTTP $code)"
echo

echo "2) GET /track/opens/<token> — invalid token still returns 200 + transparent GIF"
tmp="$(mktemp)"
hdr="$(mktemp)"
trap 'rm -f "$tmp" "$hdr"' EXIT
code="$(curl -sS -D "$hdr" -o "$tmp" -w "%{http_code}" "$API_BASE_URL/track/opens/not-a-real-token-for-smoke-test")"
[[ "$code" == "200" ]] || die "track/opens expected 200, got $code"
ct="$(grep -i '^content-type:' "$hdr" | tr -d '\r' | sed 's/^[Cc]ontent-[Tt]ype:[[:space:]]*//')"
[[ "$ct" == image/gif* ]] || die "expected Content-Type image/gif, got: $ct"
cc="$(grep -i '^cache-control:' "$hdr" | tr -d '\r' | sed 's/^[Cc]ache-[Cc]ontrol:[[:space:]]*//')"
[[ "$cc" == *no-store* ]] || die "expected Cache-Control to include no-store, got: $cc"
size="$(wc -c <"$tmp" | tr -d ' ')"
[[ "$size" -ge 40 ]] || die "GIF body too small ($size bytes)"
echo "   OK (HTTP $code, image/gif, ${size} bytes, cache no-store)"
echo

echo "3) Route is NOT under /v1 (short URL for emails)"
code_v1="$(curl -sS -o /dev/null -w "%{http_code}" "$API_BASE_URL/v1/track/opens/x" || true)"
if [[ "$code_v1" == "200" ]]; then
  echo "   WARN: /v1/track/opens also returned 200 — verify global prefix exclude in main.ts"
else
  echo "   OK (/v1/track/opens is not the public pixel path; got HTTP $code_v1)"
fi
echo

echo "All smoke checks passed."
echo

if [[ "$INTEGRATION" -eq 1 ]]; then
  cd "$ROOT"
  if [[ ! -f .env ]]; then
    die "Integration mode needs a .env at repo root (with DATABASE_URL and API_PUBLIC_URL)."
  fi
  echo "Running integration script (Node 20+, database + one SENT job)..."
  node --env-file=.env "$SCRIPT_DIR/test-open-tracking-integration.mjs"
fi
