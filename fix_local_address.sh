#!/bin/bash
#
# Toggle hardcoded backend URLs between local dev and production server.
#
# Usage:
#   ./fix_local_address.sh local    # point repo at http://127.0.0.1:8000
#   ./fix_local_address.sh server   # point repo at https://anyquant.co.uk
#   ./fix_local_address.sh          # auto-toggle to the opposite of current state
#   ./fix_local_address.sh status   # show which mode the repo is currently in
#
# Only files with hardcoded URLs are touched. Files like components/sidebar.tsx
# that auto-switch via window.location.hostname are left alone.
#
# Do not commit the resulting changes.

set -e

SERVER_URL="https://anyquant.co.uk"
LOCAL_URL="http://127.0.0.1:8000"

# Files with hardcoded backend URLs that need to be toggled.
FILES=(
  "app/usefetch.js"
  "app/AllApiCalls.js"
  "app/optimization-results/page.tsx"
  "app/walk-forward-results/page.tsx"
)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

detect_mode() {
  # Inspect app/usefetch.js as the source of truth.
  if grep -q "$LOCAL_URL" app/usefetch.js 2>/dev/null; then
    echo "local"
  elif grep -q "$SERVER_URL" app/usefetch.js 2>/dev/null; then
    echo "server"
  else
    echo "unknown"
  fi
}

apply() {
  local from="$1"
  local to="$2"
  for f in "${FILES[@]}"; do
    if [ ! -f "$f" ]; then
      echo "  skip (missing): $f"
      continue
    fi
    if grep -q "$from" "$f"; then
      sed -i "s|$from|$to|g" "$f"
      echo "  updated: $f"
    fi
  done
}

mode="${1:-}"
current="$(detect_mode)"

case "$mode" in
  status)
    echo "Current mode: $current"
    exit 0
    ;;
  local)
    target="local"
    ;;
  server)
    target="server"
    ;;
  "")
    if [ "$current" = "local" ]; then
      target="server"
    elif [ "$current" = "server" ]; then
      target="local"
    else
      echo "Could not detect current mode from app/usefetch.js." >&2
      echo "Pass 'local' or 'server' explicitly." >&2
      exit 1
    fi
    ;;
  *)
    echo "Unknown argument: $mode" >&2
    echo "Usage: $0 [local|server|status]" >&2
    exit 1
    ;;
esac

if [ "$current" = "$target" ]; then
  echo "Already in '$target' mode. Nothing to do."
  exit 0
fi

echo "Switching: $current -> $target"
if [ "$target" = "local" ]; then
  apply "$SERVER_URL" "$LOCAL_URL"
else
  apply "$LOCAL_URL" "$SERVER_URL"
fi
echo "Done. Remember not to commit these changes."
