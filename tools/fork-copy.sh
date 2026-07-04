#!/bin/bash
# Copy 25 packages from aiagent.iai.one → nguyenai.net/packages/@nai/
# Uses cp -R with manual exclusion (rsync has glob issues with space patterns)

SRC="/Users/tranhatam/Documents/Devnewproject/aiagent.iai.one/packages"
DST="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/packages/@nai"

# src:dst_pkg
FORKS="contracts:contracts
agent-runtime-sdk:runtime-sdk
agent-matrix-sdk:matrix-sdk
model-gateway-sdk:gateway-sdk
a2a-sdk:delegation-sdk
connector-sdk:connector-sdk
memory-sdk:memory-sdk
storage-sdk:storage-sdk
auth-sdk:auth-service-sdk
entitlement-sdk:entitlement-matrix
policy-sdk:policy-matrix
eval-sdk:eval-sdk
trust-graph-sdk:trust-graph
billing-sdk:billing-sdk
cost-guard:cost-guard
payment-payos:payment-payos
payment-stripe:payment-stripe
commerce-primitives:commerce
email-sdk:email-sdk
i18n-sdk:i18n
language-routing-sdk:language-router
locale-kit:locale-kit
observability-sdk:observability
protocol-stack:protocol
resilience-sdk:resilience"

COUNT=0
TOTAL=$(echo "$FORKS" | wc -l | tr -d ' ')

echo "$FORKS" | while IFS=: read -r src pkg; do
  COUNT=$((COUNT+1))
  if [ -d "$DST/$pkg" ]; then
    echo "[$COUNT/$TOTAL] SKIP $pkg (exists)"
    continue
  fi
  if [ ! -d "$SRC/$src" ]; then
    echo "[$COUNT/$TOTAL] ERROR $src (not found)"
    continue
  fi
  mkdir -p "$DST/$pkg"
  # Copy each entry manually, skip node_modules/.git/dist + files with spaces
  for entry in "$SRC/$src"/*; do
    [ -e "$entry" ] || continue
    base=$(basename "$entry")
    # skip files/dirs with spaces
    case "$base" in
      *" "*) continue ;;
    esac
    cp -R "$entry" "$DST/$pkg/" 2>/dev/null
  done
  echo "[$COUNT/$TOTAL] $src → $pkg ✓"
done

echo "=== Copy done ==="
    --exclude='.*' \
    --exclude='* *' \
    "$SRC/$src/" "$DST/$pkg/" 2>/dev/null
  echo "[$COUNT/$TOTAL] $src → $pkg ✓"
done

echo "=== Copy done ==="
    "$SRC/$src/" "$DST/$pkg/" 2>/dev/null
  echo "[$COUNT/$TOTAL] $src → $pkg ✓"
done

echo "=== Copy done ==="
