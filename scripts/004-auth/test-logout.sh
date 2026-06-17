#!/usr/bin/env bash
# Task #004 — POST /v1/auth/logout (JWT required; server returns success — client discards token)
#
# Provide token via ACCESS_TOKEN, or leave unset to login first using scripts/_shared/login.json
#
#   ACCESS_TOKEN="eyJ..." scripts/004-auth/test-logout.sh
#   scripts/004-auth/test-logout.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SHARED="$ROOT/scripts/_shared"

BASE_URL="${BASE_URL:-http://localhost:3001/v1}"
LOGIN_FILE="${LOGIN_FILE:-$SHARED/login.json}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required (sudo apt-get install -y jq)"
  exit 1
fi

TOKEN="${ACCESS_TOKEN:-}"
if [[ -z "$TOKEN" ]]; then
  if [[ ! -f "$LOGIN_FILE" ]]; then
    echo "Set ACCESS_TOKEN or provide $LOGIN_FILE for login"
    exit 1
  fi
  LOGIN_RES="$(curl -sS -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    --data @"$LOGIN_FILE")"
  TOKEN="$(echo "$LOGIN_RES" | jq -r '.accessToken // empty')"
  if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
    echo "Login failed:"
    echo "$LOGIN_RES" | jq .
    exit 1
  fi
fi

echo "POST $BASE_URL/auth/logout"
curl -sS -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
