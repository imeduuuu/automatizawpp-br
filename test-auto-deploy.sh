#!/bin/bash

##############################################################################
# Test Suite para Auto-Deploy Script
# Executa testes básicos de função do script
##############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Auto-Deploy Script — Test Suite                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

test_count=0
pass_count=0
fail_count=0

run_test() {
  local test_name="$1"
  local test_cmd="$2"

  test_count=$((test_count + 1))
  echo -n "Test $test_count: $test_name ... "

  if eval "$test_cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    pass_count=$((pass_count + 1))
  else
    echo -e "${RED}✗ FAIL${NC}"
    fail_count=$((fail_count + 1))
  fi
}

# Tests
echo "Running tests..."
echo ""

run_test "Script exists" "[ -f ./auto-deploy.sh ]"
run_test "Script is executable" "[ -x ./auto-deploy.sh ]"
run_test "Script is valid bash" "bash -n ./auto-deploy.sh"
run_test "Has help text" "grep -q 'Auto-Deploy' ./auto-deploy.sh"
run_test "Has Vercel support" "grep -q 'deploy_vercel' ./auto-deploy.sh"
run_test "Has Firebase support" "grep -q 'deploy_firebase' ./auto-deploy.sh"
run_test "Has Docker support" "grep -q 'deploy_docker' ./auto-deploy.sh"
run_test "Has error handling" "grep -q 'trap' ./auto-deploy.sh"
run_test "Has logging" "grep -q 'log_step' ./auto-deploy.sh"
run_test "Has health check" "grep -q 'health_check' ./auto-deploy.sh"
run_test "Has notifications" "grep -q 'send_notification' ./auto-deploy.sh"
run_test "README exists" "[ -f ./AUTO-DEPLOY-README.md ]"
run_test "Examples script exists" "[ -f ./AUTO-DEPLOY-EXAMPLES.sh ]"
run_test "Examples script executable" "[ -x ./AUTO-DEPLOY-EXAMPLES.sh ]"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                      Test Results                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Total tests: $test_count"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Read the documentation: AUTO-DEPLOY-README.md"
  echo "2. Check examples: bash AUTO-DEPLOY-EXAMPLES.sh"
  echo "3. Run a test deploy: ./auto-deploy.sh --platform=docker"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
