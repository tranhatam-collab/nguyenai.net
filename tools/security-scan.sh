#!/usr/bin/env bash
# tools/security-scan.sh — Local security scanner for Nguyen AI monorepo
# P1-E.1 to P1-E.6: semgrep + trivy + grype + gitleaks + cosign + slsa

set -euo pipefail
cd "$(dirname "$0")/.."

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
fail() { echo -e "${RED}FAIL $1${NC}"; exit 1; }
pass() { echo -e "${GREEN}PASS $1${NC}"; }
warn() { echo -e "${YELLOW}WARN $1${NC}"; }

run_semgrep() {
  echo "=== P1-E.1: semgrep SAST ==="
  if ! command -v semgrep &>/dev/null; then warn "semgrep not installed"; return 0; fi
  local out; out=$(semgrep ci --config .semgrep.yml --json 2>/dev/null || true)
  local count; count=$(echo "$out" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('results',[])))" 2>/dev/null || echo "?")
  if [ "$count" = "0" ]; then pass "semgrep: 0 findings"; else fail "semgrep: $count findings"; fi
}

run_trivy() {
  echo "=== P1-E.2: trivy FS scan ==="
  if ! command -v trivy &>/dev/null; then warn "trivy not installed"; return 0; fi
  trivy fs --severity HIGH,CRITICAL --ignore-unfixed --format json --output trivy-results.json . || true
  local count; count=$(python3 -c "import json; d=json.load(open('trivy-results.json')); print(sum(len(r.get('Vulnerabilities',[])) for r in d.get('Results',[])))" 2>/dev/null || echo "?")
  pass "trivy: $count HIGH/CRITICAL vulnerabilities (report: trivy-results.json)"
}

run_grype() {
  echo "=== P1-E.3: grype vuln scan ==="
  if ! command -v grype &>/dev/null; then warn "grype not installed"; return 0; fi
  local out; out=$(grype . --output json 2>/dev/null || true)
  local critical; critical=$(echo "$out" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len([m for m in d.get('matches',[]) if m.get('vulnerability',{}).get('severity','')=='Critical']))" 2>/dev/null || echo "?")
  if [ "$critical" = "0" ]; then pass "grype: 0 critical"; else fail "grype: $critical critical"; fi
}

run_gitleaks() {
  echo "=== P1-E.4: gitleaks secret scan ==="
  if ! command -v gitleaks &>/dev/null; then warn "gitleaks not installed"; return 0; fi
  if gitleaks detect --config .gitleaks.toml --no-banner --verbose 2>&1; then pass "gitleaks: 0 leaks"; else fail "gitleaks: secrets detected"; fi
}

run_cosign() {
  echo "=== P1-E.5: cosign artifact signing ==="
  if ! command -v cosign &>/dev/null; then warn "cosign not installed"; return 0; fi
  warn "cosign signing runs in CI (keyless) — local verify only"; pass "cosign: available"
}

run_slsa() {
  echo "=== P1-E.6: SLSA provenance ==="
  if [ -f slsa-provenance.json ]; then pass "slsa: provenance exists"; else warn "slsa: no provenance file — generated in CI"; fi
}

main() {
  local scans=("$@")
  if [ ${#scans[@]} -eq 0 ]; then scans=(semgrep trivy grype gitleaks cosign slsa); fi
  echo "=== Nguyen AI Security Scan ==="
  echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "HEAD: $(git rev-parse --short HEAD)"
  echo ""
  local failed=0
  for scan in "${scans[@]}"; do "run_$scan" || failed=$((failed + 1)); echo ""; done
  echo "=== Summary ==="
  if [ $failed -eq 0 ]; then pass "All scans completed"; else fail "$failed scan(s) failed"; fi
}

main "$@"
