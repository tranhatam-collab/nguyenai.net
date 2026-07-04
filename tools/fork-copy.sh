#!/bin/bash
# Copy 25 packages from aiagent.iai.one → nguyenai.net/packages/@nai/
# Skip node_modules, .git, dist, files with spaces

SRC="/Users/tranhatam/Documents/Devnewproject/aiagent.iai.one/packages"
DST="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/packages/@nai"

# src:dst_pkg:@nai_name
FORKS="contracts:contracts:@nai/contracts
agent-runtime-sdk:runtime-sdk:@nai/runtime-sdk
agent-matrix-sdk:matrix-sdk:@nai/matrix-sdk
model-gateway-sdk:gateway-sdk:@nai/gateway-sdk
a2a-sdk:delegation-sdk:@nai/delegation-sdk
connector-sdk:connector-sdk:@nai/connector-sdk
memory-sdk:memory-sdk:@nai/memory-sdk
storage-sdk:storage-sdk:@nai/storage-sdk
auth-sdk:auth-service-sdk:@nai/auth-service-sdk
entitlement-sdk:entitlement-matrix:@nai/entitlement-matrix
policy-sdk:policy-matrix:@nai/policy-matrix
eval-sdk:eval-sdk:@nai/eval-sdk
trust-graph-sdk:trust-graph:@nai/trust-graph
billing-sdk:billing-sdk:@nai/billing-sdk
cost-guard:cost-guard:@nai/cost-guard
payment-payos:payment-payos:@nai/payment-payos
payment-stripe:payment-stripe:@nai/payment-stripe
commerce-primitives:commerce:@nai/commerce
email-sdk:email-sdk:@nai/email-sdk
i18n-sdk:i18n:@nai/i18n
language-routing-sdk:language-router:@nai/language-router
locale-kit:locale-kit:@nai/locale-kit
observability-sdk:observability:@nai/observability
protocol-stack:protocol:@nai/protocol
resilience-sdk:resilience:@nai/resilience"

COUNT=0
TOTAL=$(echo "$FORKS" | wc -l | tr -d ' ')

echo "$FORKS" | while IFS=: read -r src pkg name; do
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
  # Copy with rsync, excluding node_modules + files with spaces
  rsync -a --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.turbo' \
    --exclude='* *' --exclude='.*' \
    "$SRC/$src/" "$DST/$pkg/" 2>/dev/null
  echo "[$COUNT/$TOTAL] $src → $pkg ✓"
done

echo "=== Copy done ==="
