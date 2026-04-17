#!/usr/bin/env bash
set -euo pipefail

# Run this termnial to test
# oryton@oryton:/mnt/d/outreach-ai-platform$ 
# WORKSPACE_ID="6c5f6ef6-bbb7-4968-a63f-17faa81fff50" ./scripts/test-leads-csv-import.sh

BASE_URL="${BASE_URL:-http://localhost:3001/v1}"
WORKSPACE_ID="${WORKSPACE_ID:-}"
WORKSPACE_FILE="${WORKSPACE_FILE:-scripts/workspace.json}"
LOGIN_FILE="${LOGIN_FILE:-scripts/login.json}"
CSV_FILE="${CSV_FILE:-scripts/sample-leads.csv}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required. Install it in WSL:"
  echo "  sudo apt-get update && sudo apt-get install -y jq"
  exit 1
fi

if [[ -z "$WORKSPACE_ID" && -f "$WORKSPACE_FILE" ]]; then
  WORKSPACE_ID="$(jq -r '.workspaceId // empty' "$WORKSPACE_FILE")"
fi

if [[ -z "$WORKSPACE_ID" ]]; then
  echo "Missing WORKSPACE_ID."
  echo "Example:"
  echo "  WORKSPACE_ID='<uuid>' ./scripts/test-leads-csv-import.sh"
  exit 1
fi

if [[ ! -f "$LOGIN_FILE" ]]; then
  echo "Login file not found: $LOGIN_FILE"
  exit 1
fi

if [[ ! -f "$CSV_FILE" ]]; then
  echo "CSV file not found: $CSV_FILE"
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

echo "Token acquired. Calling CSV import..."
curl -sS -X POST "$BASE_URL/leads/import/csv" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-workspace-id: $WORKSPACE_ID" \
  -F "file=@${CSV_FILE};type=text/csv" | jq .

echo "Done."

