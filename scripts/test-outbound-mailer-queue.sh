#!/usr/bin/env bash
set -euo pipefail

# WORKSPACE_ID="6c5f6ef6-bbb7-4968-a63f-17faa81fff50" AUTO_CREATE_LEAD=1 ./scripts/test-outbound-mailer-queue.sh

BASE_URL="${BASE_URL:-http://localhost:3001/v1}"
WORKSPACE_ID="${WORKSPACE_ID:-}"
WORKSPACE_FILE="${WORKSPACE_FILE:-scripts/workspace.json}"
LOGIN_FILE="${LOGIN_FILE:-scripts/login.json}"

SEQ_CREATE_FILE="${SEQ_CREATE_FILE:-scripts/sequence-create.json}"
STEP_CREATE_FILE="${STEP_CREATE_FILE:-scripts/sequence-step-create.json}"
ENROLL_FILE="${ENROLL_FILE:-scripts/sequence-enroll.json}"
AUTO_CREATE_LEAD="${AUTO_CREATE_LEAD:-1}"
LEAD_CREATE_FILE="${LEAD_CREATE_FILE:-scripts/lead-create.json}"

if [[ -z "$WORKSPACE_ID" && -f "$WORKSPACE_FILE" ]]; then
  WORKSPACE_ID="$(jq -r '.workspaceId // empty' "$WORKSPACE_FILE")"
fi

if [[ -z "$WORKSPACE_ID" ]]; then
  echo "Missing WORKSPACE_ID."
  echo "Example:"
  echo "  WORKSPACE_ID='<uuid>' AUTO_CREATE_LEAD=1 ./scripts/test-outbound-mailer-queue.sh"
  exit 1
fi

files=("$LOGIN_FILE" "$SEQ_CREATE_FILE" "$STEP_CREATE_FILE" "$ENROLL_FILE")
if [[ "$AUTO_CREATE_LEAD" == "1" ]]; then
  files+=("$LEAD_CREATE_FILE")
fi

for f in "${files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "File not found: $f"
    exit 1
  fi
done

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required. Install it in WSL:"
  echo "  sudo apt-get update && sudo apt-get install -y jq"
  exit 1
fi

echo "Logging in..."
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
echo "1) Create sequence..."
SEQ_RES="$(curl -sS -X POST "$BASE_URL/sequences" "${auth_headers[@]}" --data @"$SEQ_CREATE_FILE")"
echo "$SEQ_RES" | jq .

SEQUENCE_ID="$(echo "$SEQ_RES" | jq -r '.id // empty')"
if [[ -z "$SEQUENCE_ID" || "$SEQUENCE_ID" == "null" ]]; then
  echo "Failed to get sequence id from response."
  exit 1
fi

echo
echo "2) Create first step..."
STEP_RES="$(curl -sS -X POST "$BASE_URL/sequences/$SEQUENCE_ID/steps" "${auth_headers[@]}" --data @"$STEP_CREATE_FILE")"
echo "$STEP_RES" | jq .

STEP_ID="$(echo "$STEP_RES" | jq -r '.id // empty')"
if [[ -z "$STEP_ID" || "$STEP_ID" == "null" ]]; then
  echo "Failed to get step id from response."
  exit 1
fi

echo
echo "3) Prepare enroll payload..."
ENROLL_PAYLOAD="$(cat "$ENROLL_FILE")"
if [[ "$AUTO_CREATE_LEAD" == "1" ]]; then
  echo "3a) Create a test lead..."
  LEAD_RES="$(curl -sS -X POST "$BASE_URL/leads" "${auth_headers[@]}" --data @"$LEAD_CREATE_FILE")"
  echo "$LEAD_RES" | jq .

  LEAD_ID="$(echo "$LEAD_RES" | jq -r '.id // empty')"
  if [[ -z "$LEAD_ID" || "$LEAD_ID" == "null" ]]; then
    echo "Failed to get lead id from response."
    exit 1
  fi

  ENROLL_PAYLOAD="$(echo "$ENROLL_PAYLOAD" | jq --arg leadId "$LEAD_ID" '.leadIds = [$leadId]')"
fi
echo "$ENROLL_PAYLOAD" | jq .

echo
echo "4) Enroll lead(s)..."
ENROLL_RES="$(curl -sS -X POST "$BASE_URL/sequences/$SEQUENCE_ID/enroll" "${auth_headers[@]}" --data-binary "$ENROLL_PAYLOAD")"
echo "$ENROLL_RES" | jq .

echo
echo "5) Dispatch outbound queue (expects 202)..."
DISPATCH_RES_FILE="$(mktemp)"
DISPATCH_HTTP_CODE="$(curl -sS -o "$DISPATCH_RES_FILE" -w "%{http_code}" \
  -X POST "$BASE_URL/sequences/$SEQUENCE_ID/dispatch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-workspace-id: $WORKSPACE_ID")"
cat "$DISPATCH_RES_FILE" | jq .
rm -f "$DISPATCH_RES_FILE"

if [[ "$DISPATCH_HTTP_CODE" != "202" ]]; then
  echo "Dispatch endpoint did not return 202. Actual: $DISPATCH_HTTP_CODE"
  exit 1
fi
echo "Dispatch returned HTTP 202 as expected."

echo
echo "6) Wait for worker to process..."
sleep 6

echo
echo "7) Read dead-letter list (should be [] for healthy SMTP stub/transport)..."
curl -sS -X GET "$BASE_URL/sequences/$SEQUENCE_ID/dead-letters" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-workspace-id: $WORKSPACE_ID" | jq .

echo
echo "Done."
