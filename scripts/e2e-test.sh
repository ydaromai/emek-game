#!/usr/bin/env bash
# =============================================================================
# Park HaMaayanot — End-to-End Test Suite
# =============================================================================
# Tests the full visitor + admin flow against a live Supabase + Vercel deployment.
#
# Usage:
#   ./scripts/e2e-test.sh                      # uses defaults from .env.local
#   SITE_URL=https://custom.vercel.app ./scripts/e2e-test.sh
#
# Prerequisites:
#   - .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#     SUPABASE_SERVICE_ROLE_KEY
#   - curl, python3 (for JSON parsing)
#   - Admin account: ydarom@gmail.com / Kokol000!
# =============================================================================

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load env vars from .env.local
if [ -f "$PROJECT_DIR/.env.local" ]; then
  set -a
  source "$PROJECT_DIR/.env.local"
  set +a
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:?Missing NEXT_PUBLIC_SUPABASE_URL}"
ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:?Missing NEXT_PUBLIC_SUPABASE_ANON_KEY}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?Missing SUPABASE_SERVICE_ROLE_KEY}"
SITE_URL="${SITE_URL:-https://emek-kappa.vercel.app}"

ADMIN_EMAIL="${ADMIN_EMAIL:-ydarom@gmail.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Kokol000!}"

PASS=0
FAIL=0
TOTAL=0
TEST_USER_ID=""
ADMIN_TOKEN=""
VISITOR_TOKEN=""

# ── Helpers ──────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
NC='\033[0m'

pass() {
  PASS=$((PASS + 1))
  TOTAL=$((TOTAL + 1))
  echo -e "  ${GREEN}✓${NC} $1"
}

fail() {
  FAIL=$((FAIL + 1))
  TOTAL=$((TOTAL + 1))
  echo -e "  ${RED}✗${NC} $1"
  if [ -n "${2:-}" ]; then
    echo -e "    ${RED}→ $2${NC}"
  fi
}

section() {
  echo ""
  echo -e "${BOLD}━━━ $1 ━━━${NC}"
}

# JSON field extractor (no jq dependency)
json_val() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d$1)" 2>/dev/null
}

json_len() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null
}

# Supabase REST helper
sb_get() {
  local path="$1"
  local token="${2:-$SERVICE_KEY}"
  curl -s "${SUPABASE_URL}/rest/v1/${path}" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $token"
}

sb_post() {
  local path="$1"
  local data="$2"
  local token="${3:-$SERVICE_KEY}"
  curl -s -X POST "${SUPABASE_URL}/rest/v1/${path}" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$data"
}

sb_post_upsert() {
  local path="$1"
  local data="$2"
  local token="${3:-$SERVICE_KEY}"
  curl -s -o /dev/null -w "%{http_code}" -X POST "${SUPABASE_URL}/rest/v1/${path}" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=ignore-duplicates" \
    -H "on-conflict: user_id,animal_id" \
    -d "$data"
}

sb_patch() {
  local path="$1"
  local data="$2"
  local token="${3:-$SERVICE_KEY}"
  curl -s -X PATCH "${SUPABASE_URL}/rest/v1/${path}" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$data"
}

sb_delete() {
  local path="$1"
  local token="${2:-$SERVICE_KEY}"
  curl -s -X DELETE "${SUPABASE_URL}/rest/v1/${path}" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $token"
}

# ── Cleanup previous test data ──────────────────────────────────────────────

cleanup() {
  section "Cleanup"
  echo "  Removing test user data..."

  if [ -n "$TEST_USER_ID" ]; then
    # Delete in correct order (foreign key constraints)
    sb_delete "redemptions?user_id=eq.$TEST_USER_ID"
    sb_delete "user_progress?user_id=eq.$TEST_USER_ID"
    sb_delete "profiles?id=eq.$TEST_USER_ID"

    # Delete auth user via admin API
    curl -s -o /dev/null -X DELETE "${SUPABASE_URL}/auth/v1/admin/users/$TEST_USER_ID" \
      -H "apikey: $SERVICE_KEY" \
      -H "Authorization: Bearer $SERVICE_KEY"

    echo "  Cleaned up test user $TEST_USER_ID"
  fi
}

# Always clean up, even on failure
trap cleanup EXIT

# =============================================================================
#  TEST 1: Page Routes
# =============================================================================

section "1. Page Routes"

check_route() {
  local path="$1"
  local expected="$2"
  local label="$3"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}${path}" --max-redirs 0 2>/dev/null)
  if [ "$code" = "$expected" ]; then
    pass "$label ($path → $code)"
  else
    fail "$label ($path → $code, expected $expected)"
  fi
}

# Public pages → 200
check_route "/" "200" "Landing page"
check_route "/register" "200" "Registration page"
check_route "/login" "200" "Login page"
check_route "/forgot-password" "200" "Forgot password page"
check_route "/reset-password" "200" "Reset password page"
check_route "/admin/login" "200" "Admin login page"
check_route "/scan/invalid-token" "200" "Invalid QR token (inline error)"

# Auth-protected pages → 307 redirect
check_route "/game" "307" "Game page (requires auth)"
check_route "/redeem" "307" "Redeem page (requires auth)"
check_route "/admin/dashboard" "307" "Admin dashboard (requires auth)"
check_route "/admin/users" "307" "Admin users (requires auth)"
check_route "/admin/animals" "307" "Admin animals (requires auth)"
check_route "/admin/verify-prize" "307" "Admin verify-prize (requires auth)"

# =============================================================================
#  TEST 2: API Auth Enforcement
# =============================================================================

section "2. API Auth Enforcement"

check_api_auth() {
  local path="$1"
  local label="$2"
  local body
  body=$(curl -s "${SITE_URL}${path}")
  if echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'error' in d else 1)" 2>/dev/null; then
    pass "$label rejects unauthenticated requests"
  else
    fail "$label does NOT reject unauthenticated requests" "$body"
  fi
}

check_api_auth "/api/admin/analytics" "Analytics API"
check_api_auth "/api/admin/export/users" "CSV Export API"

# Puzzle validate endpoint (POST)
PUZZLE_RESP=$(curl -s -X POST "${SITE_URL}/api/puzzle/validate" \
  -H "Content-Type: application/json" \
  -d '{"answer":"test"}')
if echo "$PUZZLE_RESP" | grep -q "מחוברים"; then
  pass "Puzzle API rejects unauthenticated requests"
else
  fail "Puzzle API does NOT reject unauthenticated requests" "$PUZZLE_RESP"
fi

# =============================================================================
#  TEST 3: Registration & Login
# =============================================================================

section "3. Registration & Login"

# Create test user via admin API (bypasses email verification)
TEST_EMAIL="e2e-test-$(date +%s)@parktest.co.il"
TEST_PASSWORD="E2eTest1234"

CREATE_RESP=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"email_confirm\":true}")

TEST_USER_ID=$(echo "$CREATE_RESP" | json_val '["id"]')

if [ -n "$TEST_USER_ID" ] && [ "$TEST_USER_ID" != "None" ]; then
  pass "Create test user via admin API (id: ${TEST_USER_ID:0:8}...)"
else
  fail "Create test user via admin API" "$CREATE_RESP"
  echo -e "${RED}Cannot continue without test user. Aborting.${NC}"
  exit 1
fi

# Create profile
PROFILE_RESP=$(sb_post "profiles" "{\"id\":\"$TEST_USER_ID\",\"full_name\":\"E2E Test User\",\"phone\":\"0501234567\",\"email\":\"$TEST_EMAIL\",\"role\":\"visitor\"}")
PROFILE_ROLE=$(echo "$PROFILE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['role'])" 2>/dev/null)

if [ "$PROFILE_ROLE" = "visitor" ]; then
  pass "Create visitor profile (role: visitor)"
else
  fail "Create visitor profile" "$PROFILE_RESP"
fi

# Login
LOGIN_RESP=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

VISITOR_TOKEN=$(echo "$LOGIN_RESP" | json_val '["access_token"]')

if [ -n "$VISITOR_TOKEN" ] && [ "$VISITOR_TOKEN" != "None" ]; then
  pass "Login as visitor (got access_token)"
else
  fail "Login as visitor" "$LOGIN_RESP"
  echo -e "${RED}Cannot continue without visitor token. Aborting.${NC}"
  exit 1
fi

# =============================================================================
#  TEST 4: QR Scan Flow
# =============================================================================

section "4. QR Scan → Animal Lookup → Progress"

# Fetch all animals
ANIMALS_JSON=$(sb_get "animals?select=id,name_he,letter,order_index,qr_token&order=order_index" "$VISITOR_TOKEN")
ANIMAL_COUNT=$(echo "$ANIMALS_JSON" | json_len)

if [ "$ANIMAL_COUNT" = "10" ]; then
  pass "Fetch all active animals (count: $ANIMAL_COUNT)"
else
  fail "Fetch all active animals (count: $ANIMAL_COUNT, expected 10)"
fi

# Lookup first animal by QR token
FIRST_QR=$(echo "$ANIMALS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['qr_token'])")
LOOKUP_RESP=$(sb_get "animals?qr_token=eq.$FIRST_QR&select=id,name_he,letter" "$VISITOR_TOKEN")
LOOKUP_NAME=$(echo "$LOOKUP_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['name_he'])" 2>/dev/null)

if [ -n "$LOOKUP_NAME" ] && [ "$LOOKUP_NAME" != "None" ]; then
  pass "Lookup animal by QR token ($LOOKUP_NAME)"
else
  fail "Lookup animal by QR token" "$LOOKUP_RESP"
fi

# Scan all 10 stations
SCAN_PASS=0
SCAN_FAIL=0

for i in $(seq 0 9); do
  ANIMAL_ID=$(echo "$ANIMALS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)[$i]['id'])")
  LETTER=$(echo "$ANIMALS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)[$i]['letter'])")

  HTTP_CODE=$(sb_post_upsert "user_progress" \
    "{\"user_id\":\"$TEST_USER_ID\",\"animal_id\":\"$ANIMAL_ID\",\"letter\":\"$LETTER\"}" \
    "$VISITOR_TOKEN")

  if [ "$HTTP_CODE" = "201" ]; then
    SCAN_PASS=$((SCAN_PASS + 1))
  else
    SCAN_FAIL=$((SCAN_FAIL + 1))
  fi
done

if [ "$SCAN_PASS" = "10" ]; then
  pass "Scan all 10 stations (10/10 HTTP 201)"
else
  fail "Scan all 10 stations ($SCAN_PASS passed, $SCAN_FAIL failed)"
fi

# Verify progress count
PROGRESS_COUNT=$(sb_get "user_progress?user_id=eq.$TEST_USER_ID&select=letter" "$VISITOR_TOKEN" | json_len)

if [ "$PROGRESS_COUNT" = "10" ]; then
  pass "User progress has 10 records"
else
  fail "User progress count: $PROGRESS_COUNT (expected 10)"
fi

# =============================================================================
#  TEST 5: Duplicate Scan Protection
# =============================================================================

section "5. Duplicate Scan Protection"

FIRST_ANIMAL_ID=$(echo "$ANIMALS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
FIRST_LETTER=$(echo "$ANIMALS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['letter'])")

DUP_CODE=$(sb_post_upsert "user_progress" \
  "{\"user_id\":\"$TEST_USER_ID\",\"animal_id\":\"$FIRST_ANIMAL_ID\",\"letter\":\"$FIRST_LETTER\"}" \
  "$VISITOR_TOKEN")

# 409 (conflict) or 200 (ignored duplicate) are both acceptable
if [ "$DUP_CODE" = "409" ] || [ "$DUP_CODE" = "200" ]; then
  pass "Duplicate scan rejected or ignored (HTTP $DUP_CODE)"
else
  fail "Duplicate scan returned unexpected code: $DUP_CODE"
fi

# Verify still 10 records
PROGRESS_AFTER=$(sb_get "user_progress?user_id=eq.$TEST_USER_ID&select=letter" "$VISITOR_TOKEN" | json_len)

if [ "$PROGRESS_AFTER" = "10" ]; then
  pass "Still 10 progress records after duplicate scan"
else
  fail "Progress count changed to $PROGRESS_AFTER after duplicate"
fi

# =============================================================================
#  TEST 6: Puzzle Word Validation
# =============================================================================

section "6. Puzzle Word"

# Build expected word from animal letters in order
EXPECTED_WORD=$(echo "$ANIMALS_JSON" | python3 -c "
import sys, json
animals = json.load(sys.stdin)
print(''.join(a['letter'] for a in animals))
")

COLLECTED_LETTERS=$(sb_get "user_progress?user_id=eq.$TEST_USER_ID&select=letter,animal_id" "$VISITOR_TOKEN" | python3 -c "
import sys, json
progress = json.load(sys.stdin)
print(''.join(p['letter'] for p in progress))
")

if [ ${#EXPECTED_WORD} -eq 10 ]; then
  pass "Expected puzzle word has 10 letters: $EXPECTED_WORD"
else
  fail "Expected puzzle word length: ${#EXPECTED_WORD} (expected 10)"
fi

if [ ${#COLLECTED_LETTERS} -eq 10 ]; then
  pass "User collected 10 letters: $COLLECTED_LETTERS"
else
  fail "User collected ${#COLLECTED_LETTERS} letters (expected 10)"
fi

# =============================================================================
#  TEST 7: Prize Redemption
# =============================================================================

section "7. Prize Redemption"

# Simulate puzzle completion: insert redemption code + mark profile completed
REDEMPTION_CODE="E2E$(date +%s | tail -c 6)"

REDEEM_RESP=$(sb_post "redemptions" \
  "{\"user_id\":\"$TEST_USER_ID\",\"redemption_code\":\"$REDEMPTION_CODE\"}")

REDEEM_OK=$(echo "$REDEEM_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['redemption_code'])" 2>/dev/null)

if [ "$REDEEM_OK" = "$REDEMPTION_CODE" ]; then
  pass "Create redemption code ($REDEMPTION_CODE)"
else
  fail "Create redemption code" "$REDEEM_RESP"
fi

# Mark profile completed
COMPLETE_RESP=$(sb_patch "profiles?id=eq.$TEST_USER_ID" \
  "{\"completion_status\":\"completed\",\"completed_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}")

COMPLETE_STATUS=$(echo "$COMPLETE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['completion_status'])" 2>/dev/null)

if [ "$COMPLETE_STATUS" = "completed" ]; then
  pass "Mark profile as completed"
else
  fail "Mark profile as completed" "$COMPLETE_RESP"
fi

# Visitor can read own redemption
OWN_REDEMPTION=$(sb_get "redemptions?user_id=eq.$TEST_USER_ID&select=redemption_code,redeemed" "$VISITOR_TOKEN")
OWN_CODE=$(echo "$OWN_REDEMPTION" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['redemption_code'])" 2>/dev/null)

if [ "$OWN_CODE" = "$REDEMPTION_CODE" ]; then
  pass "Visitor can read own redemption code"
else
  fail "Visitor cannot read own redemption code" "$OWN_REDEMPTION"
fi

# =============================================================================
#  TEST 8: Admin Login & Data Access
# =============================================================================

section "8. Admin Login & Data Access"

ADMIN_RESP=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo "$ADMIN_RESP" | json_val '["access_token"]')

if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "None" ]; then
  pass "Admin login successful"
else
  fail "Admin login failed" "$ADMIN_RESP"
  echo -e "${YELLOW}  Skipping admin data access tests${NC}"
  ADMIN_TOKEN=""
fi

if [ -n "$ADMIN_TOKEN" ]; then
  # Admin can see all profiles
  ALL_PROFILES=$(sb_get "profiles?select=id" "$ADMIN_TOKEN" | json_len)
  if [ "$ALL_PROFILES" -ge "2" ]; then
    pass "Admin can read all profiles (count: $ALL_PROFILES)"
  else
    fail "Admin can read all profiles (count: $ALL_PROFILES, expected >= 2)"
  fi

  # Admin can see all user progress
  ALL_PROGRESS=$(sb_get "user_progress?select=id" "$ADMIN_TOKEN" | json_len)
  if [ "$ALL_PROGRESS" -ge "10" ]; then
    pass "Admin can read all user progress (count: $ALL_PROGRESS)"
  else
    fail "Admin can read all user progress (count: $ALL_PROGRESS, expected >= 10)"
  fi

  # Admin can see all redemptions
  ALL_REDEMPTIONS=$(sb_get "redemptions?select=id" "$ADMIN_TOKEN" | json_len)
  if [ "$ALL_REDEMPTIONS" -ge "1" ]; then
    pass "Admin can read all redemptions (count: $ALL_REDEMPTIONS)"
  else
    fail "Admin can read all redemptions (count: $ALL_REDEMPTIONS, expected >= 1)"
  fi

  # Admin can update animals
  FIRST_ANIMAL=$(echo "$ANIMALS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
  UPDATE_RESP=$(sb_patch "animals?id=eq.$FIRST_ANIMAL" '{"fun_facts":"E2E test update"}' "$ADMIN_TOKEN")
  UPDATED_FACTS=$(echo "$UPDATE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['fun_facts'])" 2>/dev/null)

  if [ "$UPDATED_FACTS" = "E2E test update" ]; then
    pass "Admin can update animal content"
    # Revert
    sb_patch "animals?id=eq.$FIRST_ANIMAL" \
      '{"fun_facts":"השלדג הוא ציפור צבעונית שצוללת למים כדי לתפוס דגים. הוא יכול לזהות דגים מגובה של עד 10 מטרים!"}' \
      "$ADMIN_TOKEN" > /dev/null
  else
    fail "Admin cannot update animal content" "$UPDATE_RESP"
  fi

  # Admin can mark prize as redeemed
  VERIFY_RESP=$(sb_patch "redemptions?redemption_code=eq.$REDEMPTION_CODE" \
    "{\"redeemed\":true,\"redeemed_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    "$ADMIN_TOKEN")
  VERIFIED=$(echo "$VERIFY_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['redeemed'])" 2>/dev/null)

  if [ "$VERIFIED" = "True" ]; then
    pass "Admin can mark prize as redeemed"
  else
    fail "Admin cannot mark prize as redeemed" "$VERIFY_RESP"
  fi
fi

# =============================================================================
#  TEST 9: RLS Isolation (Visitor cannot see other users' data)
# =============================================================================

section "9. RLS Isolation"

# Visitor should only see their own profile
VISITOR_PROFILES=$(sb_get "profiles?select=id" "$VISITOR_TOKEN" | json_len)
if [ "$VISITOR_PROFILES" = "1" ]; then
  pass "Visitor can only see own profile (count: 1)"
else
  fail "Visitor sees $VISITOR_PROFILES profiles (expected 1)"
fi

# Visitor should only see own progress
VISITOR_PROGRESS=$(sb_get "user_progress?select=id" "$VISITOR_TOKEN" | json_len)
if [ "$VISITOR_PROGRESS" = "10" ]; then
  pass "Visitor sees only own progress (count: 10)"
else
  fail "Visitor sees $VISITOR_PROGRESS progress records (expected 10)"
fi

# Visitor should only see own redemption
VISITOR_REDEMPTIONS=$(sb_get "redemptions?select=id" "$VISITOR_TOKEN" | json_len)
if [ "$VISITOR_REDEMPTIONS" = "1" ]; then
  pass "Visitor sees only own redemption (count: 1)"
else
  fail "Visitor sees $VISITOR_REDEMPTIONS redemptions (expected 1)"
fi

# =============================================================================
#  TEST 10: Security Headers
# =============================================================================

section "10. Security Headers"

HEADERS=$(curl -sI "${SITE_URL}/" 2>/dev/null)

check_header() {
  local header="$1"
  local expected="$2"
  local label="$3"
  if echo "$HEADERS" | grep -qi "$header: $expected"; then
    pass "$label header present"
  else
    fail "$label header missing or incorrect"
  fi
}

check_header "x-frame-options" "DENY" "X-Frame-Options"
check_header "x-content-type-options" "nosniff" "X-Content-Type-Options"
check_header "referrer-policy" "strict-origin-when-cross-origin" "Referrer-Policy"
check_header "strict-transport-security" "max-age=" "HSTS"

# =============================================================================
#  Summary
# =============================================================================

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Results: $PASS passed, $FAIL failed ($TOTAL total)${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$FAIL" -gt 0 ]; then
  echo -e "  ${RED}SOME TESTS FAILED${NC}"
  exit 1
else
  echo -e "  ${GREEN}ALL TESTS PASSED${NC}"
  exit 0
fi
