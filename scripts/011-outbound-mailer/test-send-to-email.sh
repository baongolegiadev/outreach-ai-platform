#!/usr/bin/env bash
set -euo pipefail

# Task #011 — helper: tạo sequence tối thiểu + dispatch tới một email (Mailtrap / SMTP test).
#
#   TARGET_EMAIL="you@example.com" scripts/011-outbound-mailer/test-send-to-email.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SHARED="$ROOT/scripts/_shared"

BASE_URL="${BASE_URL:-http://localhost:3001/v1}"
WORKSPACE_ID="${WORKSPACE_ID:-}"
WORKSPACE_FILE="${WORKSPACE_FILE:-$SHARED/workspace.json}"
LOGIN_FILE="${LOGIN_FILE:-$SHARED/login.json}"
TARGET_EMAIL="${TARGET_EMAIL:-nlgbsw@gmail.com}"
TARGET_NAME="${TARGET_NAME:-Manual Test Lead}"
TARGET_COMPANY="${TARGET_COMPANY:-Personal}"
WAIT_SECONDS="${WAIT_SECONDS:-8}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required. Install it in WSL:"
  echo "  sudo apt-get update && sudo apt-get install -y jq"
  exit 1
fi

if [[ -z "$WORKSPACE_ID" && -f "$WORKSPACE_FILE" ]]; then
  WORKSPACE_ID="$(jq -r '.workspaceId // empty' "$WORKSPACE_FILE")"
fi

if [[ -z "$WORKSPACE_ID" ]]; then
  echo "Missing WORKSPACE_ID (or scripts/_shared/workspace.json)."
  exit 1
fi

if [[ ! -f "$LOGIN_FILE" ]]; then
  echo "Login file not found: $LOGIN_FILE"
  exit 1
fi

echo "1) Logging in..."
LOGIN_RES="$(curl -sS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  --data @"$LOGIN_FILE")"
TOKEN="$(echo "$LOGIN_RES" | jq -r '.accessToken // empty')"
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "Login failed. Response:"
  echo "$LOGIN_RES" | jq .
  exit 1
fi

auth_headers=(
  -H "Authorization: Bearer $TOKEN"
  -H "x-workspace-id: $WORKSPACE_ID"
  -H "Content-Type: application/json"
)

echo
echo "2) Create/find lead: $TARGET_EMAIL"
LEAD_PAYLOAD="$(jq -n \
  --arg name "$TARGET_NAME" \
  --arg email "$TARGET_EMAIL" \
  --arg company "$TARGET_COMPANY" \
  '{name: $name, email: $email, company: $company}')"

LEAD_RES="$(curl -sS -X POST "$BASE_URL/leads" "${auth_headers[@]}" --data-binary "$LEAD_PAYLOAD")"
LEAD_ID="$(echo "$LEAD_RES" | jq -r '.id // empty')"

if [[ -z "$LEAD_ID" || "$LEAD_ID" == "null" ]]; then
  echo "Lead create response:"
  echo "$LEAD_RES" | jq .
  echo "Try to find existing lead by email..."
  LEAD_ID="$(curl -sS -X GET "$BASE_URL/leads?search=$TARGET_EMAIL&limit=1&offset=0" \
    -H "Authorization: Bearer $TOKEN" \
    -H "x-workspace-id: $WORKSPACE_ID" | jq -r '.data[0].id // empty')"
fi

if [[ -z "$LEAD_ID" || "$LEAD_ID" == "null" ]]; then
  echo "Could not resolve lead ID for $TARGET_EMAIL"
  exit 1
fi
echo "leadId=$LEAD_ID"

echo
echo "3) Create sequence..."
SEQ_RES="$(curl -sS -X POST "$BASE_URL/sequences" "${auth_headers[@]}" \
  --data '{"name":"Send to single target email"}')"
SEQUENCE_ID="$(echo "$SEQ_RES" | jq -r '.id // empty')"
if [[ -z "$SEQUENCE_ID" || "$SEQUENCE_ID" == "null" ]]; then
  echo "Create sequence failed:"
  echo "$SEQ_RES" | jq .
  exit 1
fi
echo "$SEQ_RES" | jq .

echo
echo "4) Create step..."
STEP_RES="$(curl -sS -X POST "$BASE_URL/sequences/$SEQUENCE_ID/steps" "${auth_headers[@]}" \
  --data '{
    "stepOrder": 0,
    "delayMinutes": 0,
    "subject": "Outbound test to {{first_name}}",
    "body": "Hi {{first_name}}, this is a direct queue send test for {{company}}."
  }')"
STEP_ID="$(echo "$STEP_RES" | jq -r '.id // empty')"
if [[ -z "$STEP_ID" || "$STEP_ID" == "null" ]]; then
  echo "Create step failed:"
  echo "$STEP_RES" | jq .
  exit 1
fi
echo "$STEP_RES" | jq .

echo
echo "5) Enroll lead..."
ENROLL_RES="$(curl -sS -X POST "$BASE_URL/sequences/$SEQUENCE_ID/enroll" "${auth_headers[@]}" \
  --data "{\"leadIds\":[\"$LEAD_ID\"],\"batchSize\":500}")"
echo "$ENROLL_RES" | jq .

echo
echo "6) Dispatch (expect HTTP 202)..."
DISPATCH_FILE="$(mktemp)"
DISPATCH_CODE="$(curl -sS -o "$DISPATCH_FILE" -w "%{http_code}" \
  -X POST "$BASE_URL/sequences/$SEQUENCE_ID/dispatch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-workspace-id: $WORKSPACE_ID")"
cat "$DISPATCH_FILE" | jq .
rm -f "$DISPATCH_FILE"

if [[ "$DISPATCH_CODE" != "202" ]]; then
  echo "Dispatch failed, expected 202 but got $DISPATCH_CODE"
  exit 1
fi

echo
echo "7) Wait worker ${WAIT_SECONDS}s..."
sleep "$WAIT_SECONDS"

echo
echo "8) Dead letters check..."
DEAD_RES="$(curl -sS -X GET "$BASE_URL/sequences/$SEQUENCE_ID/dead-letters" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-workspace-id: $WORKSPACE_ID")"
echo "$DEAD_RES" | jq .

echo
echo "Done."
echo "Summary:"
echo "  targetEmail=$TARGET_EMAIL"
echo "  leadId=$LEAD_ID"
echo "  sequenceId=$SEQUENCE_ID"
echo "  stepId=$STEP_ID"
