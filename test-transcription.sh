#!/bin/bash

echo "=== Testing Transcription System ==="
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${BLUE}Step 1: Testing simple transcription storage...${NC}"
echo "POST $BASE_URL/api/test-transcription"

response=$(curl -s -X POST "$BASE_URL/api/test-transcription" \
  -H "Content-Type: application/json" \
  -w "HTTPSTATUS:%{http_code}")

body=$(echo "$response" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$status" -eq 201 ]; then
    echo -e "${GREEN}✓ Test transcription created successfully${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ Failed to create test transcription (Status: $status)${NC}"
    echo "$body"
fi

echo
echo -e "${BLUE}Step 2: Retrieving test transcriptions...${NC}"
echo "GET $BASE_URL/api/test-transcription"

response2=$(curl -s -X GET "$BASE_URL/api/test-transcription" \
  -w "HTTPSTATUS:%{http_code}")

body2=$(echo "$response2" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
status2=$(echo "$response2" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$status2" -eq 200 ]; then
    echo -e "${GREEN}✓ Retrieved transcriptions successfully${NC}"
    echo "$body2" | jq '.'
else
    echo -e "${RED}✗ Failed to retrieve transcriptions (Status: $status2)${NC}"
    echo "$body2"
fi

echo
echo -e "${BLUE}Step 3: Testing webhook with mock data...${NC}"

# Create mock webhook payload
webhook_payload='{
  "type": "call.transcription_ready",
  "call_cid": "default:mock_call_' $(date +%s) '",
  "call_transcription": {
    "call_cid": "default:mock_call_' $(date +%s) '",
    "url": "data:text/plain;base64,eyJ0ZXh0IjogIkhlbGxvLCB3ZWxjb21lIHRvIHRvZGF5J3MgbWVudG9yaW5nIHNlc3Npb24uIiwgInNwZWFrZXIiOiAibWVudG9yIiwgInN0YXJ0X3RpbWUiOiAwLjUsICJlbmRfdGltZSI6IDMuMn0K"
  },
  "call": {
    "id": "mock_call_' $(date +%s) '",
    "session_id": "test_session",
    "duration_seconds": 120,
    "started_at": "' $(date -u -d '2 minutes ago' +%Y-%m-%dT%H:%M:%SZ) '",
    "ended_at": "' $(date -u +%Y-%m-%dT%H:%M:%SZ) '",
    "created_by": {
      "id": "test_mentor"
    },
    "members": [
      { "id": "test_participant" },
      { "id": "test_mentor" }
    ]
  }
}'

echo "POST $BASE_URL/api/webhooks/stream-transcription"

response3=$(curl -s -X POST "$BASE_URL/api/webhooks/stream-transcription" \
  -H "Content-Type: application/json" \
  -d "$webhook_payload" \
  -w "HTTPSTATUS:%{http_code}")

body3=$(echo "$response3" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
status3=$(echo "$response3" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$status3" -eq 200 ]; then
    echo -e "${GREEN}✓ Webhook processed successfully${NC}"
    echo "$body3" | jq '.'
else
    echo -e "${RED}✗ Webhook failed (Status: $status3)${NC}"
    echo "$body3"
fi

echo
echo -e "${BLUE}Testing Complete!${NC}"
echo "Check your console logs and Supabase database for stored transcriptions."