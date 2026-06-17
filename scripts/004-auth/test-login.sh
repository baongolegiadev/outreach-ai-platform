#!/usr/bin/env bash
# Task #004 — POST /v1/auth/login
#
# Uses scripts/_shared/login.json (email + password).
# Optional: set workspace context with WORKSPACE_ID or scripts/_shared/workspace.json
#
#   scripts/004-auth/test-login.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SHARED="$ROOT/scripts/_shared"

BASE_URL="${BASE_URL:-http://localhost:3001/v1}"
LOGIN_FILE="${LOGIN_FILE:-$SHARED/login.json}"
WORKSPACE_FILE="${WORKSPACE_FILE:-$SHARED/workspace.json}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required (sudo apt-get install -y jq)"
  exit 1
fi

if [[ ! -f "$LOGIN_FILE" ]]; then
  echo "Missing login file: $LOGIN_FILE"
  exit 1
fi

BODY="$(cat "$LOGIN_FILE")"
if [[ -n "${WORKSPACE_ID:-}" ]]; then
  BODY="$(echo "$BODY" | jq --arg wid "$WORKSPACE_ID" '. + {workspaceId: $wid}')"
elif [[ -f "$WORKSPACE_FILE" ]]; then
  WID="$(jq -r '.workspaceId // empty' "$WORKSPACE_FILE")"
  if [[ -n "$WID" && "$WID" != "null" ]]; then
    BODY="$(echo "$BODY" | jq --arg wid "$WID" '. + {workspaceId: $wid}')"
  fi
fi

echo "POST $BASE_URL/auth/login"
curl -sS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  --data-binary "$BODY" | jq .
