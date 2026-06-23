#!/usr/bin/env bash
#
# Deployment smoke test for AnyQuant.
#
# Run this on the server (or anywhere with network access) to confirm a
# deployment is healthy: the Next.js frontend is serving, the backend API is
# reachable, auth is enforced, and — optionally — a real login works.
#
# Requires only `bash` and `curl`. `jq` is used if present, otherwise a grep
# fallback is used for JSON parsing.
#
# Usage:
#   scripts/test-deployment.sh [options]
#
# Options:
#   --frontend URL     Frontend base URL        (default: $FRONTEND_URL or http://localhost:3000)
#   --backend  URL     Backend API base URL     (default: $BACKEND_URL  or https://anyquant.co.uk)
#   --email    EMAIL   Login smoke-test email   (or $TEST_EMAIL)
#   --password PASS    Login smoke-test password(or $TEST_PASSWORD)
#   --token    TOKEN   Existing auth token to test an authenticated endpoint (or $AUTH_TOKEN)
#   --skip-frontend    Skip frontend checks (e.g. backend-only host)
#   --skip-backend     Skip backend checks
#   --with-metaapi     Also run scripts/verify-deployment.js (needs node + .env.local)
#   --timeout SECONDS  Per-request timeout      (default: 15)
#   -v, --verbose      Print response bodies on failure
#   -h, --help         Show this help
#
# Exit code is 0 only if every required check passes.
#
# Examples:
#   scripts/test-deployment.sh
#   scripts/test-deployment.sh --frontend https://app.anyquant.co.uk
#   TEST_EMAIL=me@x.com TEST_PASSWORD=secret scripts/test-deployment.sh --with-metaapi

set -uo pipefail

# ----------------------------------------------------------------------------
# Config / arg parsing
# ----------------------------------------------------------------------------
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-https://anyquant.co.uk}"
EMAIL="${TEST_EMAIL:-}"
PASSWORD="${TEST_PASSWORD:-}"
TOKEN="${AUTH_TOKEN:-}"
TIMEOUT=15
SKIP_FRONTEND=0
SKIP_BACKEND=0
WITH_METAAPI=0
VERBOSE=0

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() { sed -n '2,33p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --frontend)     FRONTEND_URL="$2"; shift 2;;
    --backend)      BACKEND_URL="$2";  shift 2;;
    --email)        EMAIL="$2";        shift 2;;
    --password)     PASSWORD="$2";     shift 2;;
    --token)        TOKEN="$2";        shift 2;;
    --timeout)      TIMEOUT="$2";      shift 2;;
    --skip-frontend) SKIP_FRONTEND=1;  shift;;
    --skip-backend)  SKIP_BACKEND=1;   shift;;
    --with-metaapi)  WITH_METAAPI=1;   shift;;
    -v|--verbose)    VERBOSE=1;        shift;;
    -h|--help)       usage 0;;
    *) echo "Unknown option: $1" >&2; usage 1;;
  esac
done

# Strip trailing slashes so we control the joins.
FRONTEND_URL="${FRONTEND_URL%/}"
BACKEND_URL="${BACKEND_URL%/}"

# ----------------------------------------------------------------------------
# Output helpers
# ----------------------------------------------------------------------------
if [ -t 1 ]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; BLUE=$'\033[0;34m'; BOLD=$'\033[1m'; NC=$'\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; NC=''
fi

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() { PASS_COUNT=$((PASS_COUNT+1)); echo "  ${GREEN}PASS${NC}  $1"; }
fail() { FAIL_COUNT=$((FAIL_COUNT+1)); echo "  ${RED}FAIL${NC}  $1"; }
warn() { WARN_COUNT=$((WARN_COUNT+1)); echo "  ${YELLOW}WARN${NC}  $1"; }
info() { echo "  ${BLUE}··${NC}    $1"; }
section() { echo; echo "${BOLD}$1${NC}"; }

# curl wrapper: prints "<http_code> <time_total>" and writes body to $BODY_FILE.
BODY_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE"' EXIT

http() {
  # http METHOD URL [extra curl args...]
  local method="$1" url="$2"; shift 2
  curl -sS -o "$BODY_FILE" -w '%{http_code} %{time_total}' \
    --max-time "$TIMEOUT" -X "$method" "$url" "$@" 2>"$BODY_FILE.err"
}

show_body_on_fail() {
  [ "$VERBOSE" -eq 1 ] || return 0
  if [ -s "$BODY_FILE.err" ]; then info "curl: $(tr '\n' ' ' < "$BODY_FILE.err")"; fi
  if [ -s "$BODY_FILE" ]; then info "body: $(head -c 300 "$BODY_FILE" | tr '\n' ' ')"; fi
}

# Extract a JSON string field (token-ish) without hard dependency on jq.
json_field() {
  local field="$1" file="$2"
  if command -v jq >/dev/null 2>&1; then
    jq -r --arg f "$field" '.[$f] // empty' "$file" 2>/dev/null
  else
    grep -oE "\"$field\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$file" 2>/dev/null \
      | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/'
  fi
}

echo "${BOLD}AnyQuant deployment smoke test${NC}"
echo "  frontend: $FRONTEND_URL"
echo "  backend:  $BACKEND_URL"
echo "  timeout:  ${TIMEOUT}s"

# ----------------------------------------------------------------------------
# 1. Frontend
# ----------------------------------------------------------------------------
if [ "$SKIP_FRONTEND" -eq 0 ]; then
  section "1. Frontend (Next.js)"
  read -r code time < <(http GET "$FRONTEND_URL/")
  if [ -z "${code:-}" ]; then
    fail "frontend unreachable ($FRONTEND_URL)"; show_body_on_fail
  elif [ "$code" -ge 200 ] && [ "$code" -lt 400 ]; then
    pass "frontend responding (HTTP $code, ${time}s)"
  else
    fail "frontend returned HTTP $code"; show_body_on_fail
  fi
else
  section "1. Frontend (Next.js)"; info "skipped"
fi

# ----------------------------------------------------------------------------
# 2. Backend API
# ----------------------------------------------------------------------------
if [ "$SKIP_BACKEND" -eq 0 ]; then
  section "2. Backend API ($BACKEND_URL)"

  # 2a. TCP/TLS/HTTP reachability — any HTTP status proves the server answered.
  read -r code time < <(http GET "$BACKEND_URL/")
  if [ -z "${code:-}" ]; then
    fail "backend unreachable (no HTTP response)"; show_body_on_fail
  elif [ "$code" -ge 500 ]; then
    fail "backend returned server error HTTP $code"; show_body_on_fail
  else
    pass "backend reachable (HTTP $code, ${time}s)"
  fi

  # 2b. Auth is enforced — protected endpoint must reject an anonymous request.
  read -r code time < <(http GET "$BACKEND_URL/api/strategies/")
  if [ "${code:-000}" = "401" ] || [ "${code:-000}" = "403" ]; then
    pass "auth enforced on /api/strategies/ (HTTP $code)"
  elif [ "${code:-000}" = "200" ]; then
    fail "/api/strategies/ returned 200 without a token — auth not enforced!"; show_body_on_fail
  else
    warn "/api/strategies/ returned HTTP ${code:-?} (expected 401/403)"; show_body_on_fail
  fi

  # 2c. Public endpoint returns a clean app-level response (not 5xx).
  read -r code time < <(http GET "$BACKEND_URL/api/getuserfromuserinput/__deploy_healthcheck__")
  if [ -z "${code:-}" ]; then
    warn "user-lookup endpoint gave no response"; show_body_on_fail
  elif [ "$code" -ge 500 ]; then
    fail "user-lookup endpoint server error HTTP $code"; show_body_on_fail
  else
    pass "public user-lookup endpoint healthy (HTTP $code)"
  fi
else
  section "2. Backend API"; info "skipped"
fi

# ----------------------------------------------------------------------------
# 3. Login smoke test (optional)
# ----------------------------------------------------------------------------
if [ "$SKIP_BACKEND" -eq 0 ] && [ -n "$EMAIL" ] && [ -n "$PASSWORD" ]; then
  section "3. Login smoke test"
  read -r code time < <(http POST "$BACKEND_URL/api/customtoken/" \
    -H 'Content-Type: application/json' \
    --data "{\"login_identifier\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
  if [ "${code:-000}" = "200" ]; then
    LOGIN_TOKEN="$(json_field token "$BODY_FILE")"
    [ -z "$LOGIN_TOKEN" ] && LOGIN_TOKEN="$(json_field access "$BODY_FILE")"
    if [ -n "$LOGIN_TOKEN" ]; then
      pass "login succeeded and returned a token"
      [ -z "$TOKEN" ] && TOKEN="$LOGIN_TOKEN"
    else
      warn "login HTTP 200 but no token field found in response"; show_body_on_fail
    fi
  else
    fail "login failed (HTTP ${code:-?})"; show_body_on_fail
  fi
elif [ -n "$EMAIL$PASSWORD" ] && { [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; }; then
  section "3. Login smoke test"
  warn "need both --email and --password; skipping"
fi

# ----------------------------------------------------------------------------
# 4. Authenticated endpoint (if we have a token)
# ----------------------------------------------------------------------------
if [ "$SKIP_BACKEND" -eq 0 ] && [ -n "$TOKEN" ]; then
  section "4. Authenticated request"
  read -r code time < <(http GET "$BACKEND_URL/api/strategies/" -H "Authorization: Bearer $TOKEN")
  if [ "${code:-000}" = "200" ]; then
    pass "GET /api/strategies/ with token (HTTP 200, ${time}s)"
  elif [ "${code:-000}" = "401" ]; then
    fail "token rejected (HTTP 401) — expired or invalid token"; show_body_on_fail
  else
    warn "GET /api/strategies/ returned HTTP ${code:-?}"; show_body_on_fail
  fi
fi

# ----------------------------------------------------------------------------
# 5. MetaAPI (optional, delegates to the existing node verifier)
# ----------------------------------------------------------------------------
if [ "$WITH_METAAPI" -eq 1 ]; then
  section "5. MetaAPI connectivity"
  if command -v node >/dev/null 2>&1 && [ -f "$SCRIPT_DIR/verify-deployment.js" ]; then
    if node "$SCRIPT_DIR/verify-deployment.js" >/dev/null 2>&1; then
      pass "MetaAPI verification passed (scripts/verify-deployment.js)"
    else
      fail "MetaAPI verification failed — run 'node scripts/verify-deployment.js' for details"
    fi
  else
    warn "node or scripts/verify-deployment.js not available; skipping MetaAPI check"
  fi
fi

# ----------------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------------
section "Summary"
echo "  ${GREEN}$PASS_COUNT passed${NC}, ${RED}$FAIL_COUNT failed${NC}, ${YELLOW}$WARN_COUNT warnings${NC}"
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "  ${RED}${BOLD}DEPLOYMENT CHECK FAILED${NC}"
  exit 1
fi
echo "  ${GREEN}${BOLD}DEPLOYMENT OK${NC}"
exit 0
