#!/bin/bash

# Deploy AutomatizaWPP - Test Script
# This script tests the deployment CLI without requiring actual deployment

set -e

echo "================================"
echo "Deploy AutomatizaWPP - Test Suite"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Node.js version
echo -e "${YELLOW}Test 1: Checking Node.js version...${NC}"
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"
if [[ $NODE_VERSION == v18* ]] || [[ $NODE_VERSION == v19* ]] || [[ $NODE_VERSION == v20* ]]; then
  echo -e "${GREEN}✓ Node.js version OK${NC}"
else
  echo -e "${RED}✗ Node.js 18+ required${NC}"
  exit 1
fi
echo ""

# Test 2: Check CLI entry point
echo -e "${YELLOW}Test 2: Checking CLI entry point...${NC}"
if [ -f "./bin/cli.js" ]; then
  echo -e "${GREEN}✓ CLI entry point found${NC}"
else
  echo -e "${RED}✗ CLI entry point not found${NC}"
  exit 1
fi
echo ""

# Test 3: Check required modules
echo -e "${YELLOW}Test 3: Checking required modules...${NC}"
MODULES=("lib/logger.js" "lib/args.js" "lib/deployer.js" "lib/platform-detector.js" "lib/deploy-vercel.js" "lib/deploy-docker.js" "lib/meta-tag-validator.js" "lib/google-search-console.js")
for module in "${MODULES[@]}"; do
  if [ -f "./$module" ]; then
    echo -e "${GREEN}✓ $module found${NC}"
  else
    echo -e "${RED}✗ $module not found${NC}"
    exit 1
  fi
done
echo ""

# Test 4: Check package.json
echo -e "${YELLOW}Test 4: Checking package.json...${NC}"
if [ -f "./package.json" ]; then
  echo -e "${GREEN}✓ package.json found${NC}"
  
  # Check bin entry
  if grep -q '"deploy-automatizawpp"' package.json; then
    echo -e "${GREEN}✓ bin entry configured${NC}"
  else
    echo -e "${RED}✗ bin entry not configured${NC}"
    exit 1
  fi
else
  echo -e "${RED}✗ package.json not found${NC}"
  exit 1
fi
echo ""

# Test 5: Check documentation
echo -e "${YELLOW}Test 5: Checking documentation...${NC}"
DOCS=("README.md" "INSTALL.md" "SETUP.md")
for doc in "${DOCS[@]}"; do
  if [ -f "./$doc" ]; then
    echo -e "${GREEN}✓ $doc found${NC}"
  else
    echo -e "${RED}✗ $doc not found${NC}"
    exit 1
  fi
done
echo ""

# Test 6: Test CLI syntax
echo -e "${YELLOW}Test 6: Testing CLI syntax...${NC}"
if node ./bin/cli.js --help > /dev/null 2>&1; then
  echo -e "${GREEN}✓ CLI help works${NC}"
else
  echo -e "${RED}✗ CLI help failed${NC}"
  exit 1
fi
echo ""

# Test 7: Test CLI version
echo -e "${YELLOW}Test 7: Testing CLI version...${NC}"
if node ./bin/cli.js --version > /dev/null 2>&1; then
  echo -e "${GREEN}✓ CLI version works${NC}"
else
  echo -e "${RED}✗ CLI version failed${NC}"
  exit 1
fi
echo ""

# Test 8: Check for external dependencies
echo -e "${YELLOW}Test 8: Checking for external npm dependencies...${NC}"
if [ -f "./package.json" ]; then
  DEPS=$(grep -c '"dependencies"' package.json || true)
  if [ $DEPS -eq 0 ]; then
    echo -e "${GREEN}✓ No external dependencies (zero-dependency package)${NC}"
  else
    DEPCOUNT=$(grep -A 5 '"dependencies"' package.json | grep -c '"' || true)
    if [ $DEPCOUNT -le 2 ]; then
      echo -e "${GREEN}✓ Minimal dependencies${NC}"
    else
      echo -e "${YELLOW}⚠ Package has dependencies (check if acceptable)${NC}"
    fi
  fi
else
  echo -e "${RED}✗ package.json not found${NC}"
  exit 1
fi
echo ""

# Test 9: Syntax check all files
echo -e "${YELLOW}Test 9: Checking JavaScript syntax...${NC}"
SYNTAX_OK=true
for file in bin/cli.js lib/*.js; do
  if node -c "$file" 2>/dev/null; then
    echo -e "${GREEN}✓ $file syntax OK${NC}"
  else
    echo -e "${RED}✗ $file has syntax errors${NC}"
    SYNTAX_OK=false
  fi
done

if [ "$SYNTAX_OK" = false ]; then
  exit 1
fi
echo ""

# Test 10: File permissions
echo -e "${YELLOW}Test 10: Checking file permissions...${NC}"
if [ -x "./bin/cli.js" ]; then
  echo -e "${GREEN}✓ bin/cli.js is executable${NC}"
else
  echo -e "${YELLOW}⚠ bin/cli.js is not executable (fixing...)${NC}"
  chmod +x ./bin/cli.js
  echo -e "${GREEN}✓ Fixed permissions${NC}"
fi
echo ""

# Test 11: Simulate basic deployment flow
echo -e "${YELLOW}Test 11: Testing deployment flow (dry-run)...${NC}"
export DEBUG=true
export NODE_ENV=test

# Create a mock deployment
if node -e "
import { PlatformDetector } from './lib/platform-detector.js';
const { Logger } = await import('./lib/logger.js');
const logger = new Logger(true);
const detector = new PlatformDetector(logger);
const platform = await detector.detect();
console.log('Platform detected:', platform.type);
" 2>/dev/null; then
  echo -e "${GREEN}✓ Module imports work${NC}"
else
  echo -e "${RED}✗ Module import failed${NC}"
  exit 1
fi
echo ""

# Final summary
echo "================================"
echo -e "${GREEN}All tests passed!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Install globally: npm install -g deploy-automatizawpp"
echo "2. Setup environment variables (see INSTALL.md)"
echo "3. Run deployment: deploy-automatizawpp --verbose"
echo ""
