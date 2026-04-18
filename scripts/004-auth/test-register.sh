#!/usr/bin/env bash
# Task #004 — POST /v1/auth/register (creates user + workspace + ADMIN membership)
#
# Default: unique email apitest-<unix_ts>@example.com so repeated runs do not conflict.
# Override: REGISTER_EMAIL, REGISTER_PASSWORD, REGISTER_WORKSPACE_NAME, REGISTER_NAME
# Or pass a full JSON file: REGISTER_JSON=scripts/_shared/register.example.json (edit email first)
#
# Optional: SAVE_WORKSPACE_JSON=1 writes workspace id to scripts/_shared/workspace.json (overwrite — use with care)
#
#   scripts/004-auth/test-register.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SHARED="$ROOT/scripts/_shared"

BASE_URL="${BASE_URL:-http://localhost:3001/v1}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required (sudo apt-get install -y jq)"
  exit 1
fi

if [[ -n "${REGISTER_JSON:-}" ]]; then
  if [[ ! -f "$REGISTER_JSON" ]]; then
    echo "REGISTER_JSON not found: $REGISTER_JSON"
    exit 1
  fi
  BODY="$(cat "$REGISTER_JSON")"
else
  EMAIL="${REGISTER_EMAIL:-apitest-$(date +%s)@example.com}"
  PASSWORD="${REGISTER_PASSWORD:-StrongPass123!}"
  WS_NAME="${REGISTER_WORKSPACE_NAME:-Script Register Workspace}"
  NAME="${REGISTER_NAME:-API Script User}"
  BODY="$(jq -n \
    --arg email "$EMAIL" \
    --arg password "$PASSWORD" \
    --arg workspaceName "$WS_NAME" \
    --arg name "$NAME" \
    '{email: $email, password: $password, workspaceName: $workspaceName, name: $name}')"
fi

echo "POST $BASE_URL/auth/register"
RESP="$(curl -sS -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  --data-binary "$BODY")"
echo "$RESP" | jq .

WID="$(echo "$RESP" | jq -r '.workspace.id // empty')"
if [[ "${SAVE_WORKSPACE_JSON:-0}" == "1" && -n "$WID" && "$WID" != "null" ]]; then
  echo "{\"workspaceId\": \"$WID\"}" | jq . >"$SHARED/workspace.json"
  echo "Wrote $SHARED/workspace.json (workspaceId=$WID)"
fi
