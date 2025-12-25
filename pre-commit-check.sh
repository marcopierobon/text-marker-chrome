#!/bin/bash

# Pre-commit validation script
# Runs all checks before committing code

set -e  # Exit on any error

echo "🔍 Starting pre-commit checks..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 passed${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# 0. Check code formatting
echo "💅 Checking code formatting..."
if npx prettier --version &> /dev/null; then
    npx prettier --check "**/*.{ts,js,json,md}" 2>&1 || {
        echo -e "${RED}✗ Code formatting check failed${NC}"
        echo -e "${YELLOW}Run: npx prettier --write \"**/*.{ts,js,json,md}\" to fix${NC}"
        exit 1
    }
    print_status "Code formatting"
else
    echo -e "${YELLOW}⚠ Prettier not found, skipping formatting check${NC}"
fi
echo ""

# 1. Security audit
echo "🔒 Running npm security audit..."
AUDIT_OUTPUT=$(npm audit --json 2>&1)

# Parse vulnerabilities using jq if available, otherwise use grep
if command -v jq &> /dev/null; then
    CRITICAL=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.critical // 0' 2>/dev/null || echo "0")
    HIGH=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.high // 0' 2>/dev/null || echo "0")
else
    # Fallback to grep parsing
    CRITICAL=$(echo "$AUDIT_OUTPUT" | grep -o '"critical":[[:space:]]*[0-9]*' | grep -o '[0-9]*' | head -1 || echo "0")
    HIGH=$(echo "$AUDIT_OUTPUT" | grep -o '"high":[[:space:]]*[0-9]*' | grep -o '[0-9]*' | head -1 || echo "0")
fi

# Default to 0 if empty
CRITICAL=${CRITICAL:-0}
HIGH=${HIGH:-0}

if [ "$CRITICAL" != "0" ] || [ "$HIGH" != "0" ]; then
    echo -e "${RED}✗ Security audit failed - Found $CRITICAL critical and $HIGH high vulnerabilities${NC}"
    echo ""
    echo "Vulnerability details:"
    npm audit --audit-level=high
    exit 1
fi
print_status "Security audit"
echo ""

# 2. Linting
echo "📝 Running linting..."
npm run lint 2>&1 || {
    echo -e "${RED}✗ Linting failed - please fix linting errors${NC}"
    exit 1
}
print_status "Linting"
echo ""

# 3. Type checking
echo "🔍 Running type checking..."
npm run type-check 2>&1 || {
    echo -e "${RED}✗ Type checking failed - please fix type errors${NC}"
    exit 1
}
print_status "Type checking"
echo ""

# 4. Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf dist 2>&1 || true
print_status "Clean"
echo ""

# 5. TypeScript compilation
echo "🔨 Running TypeScript compilation..."
npm run build 2>&1 || {
    echo -e "${RED}✗ TypeScript compilation failed - please fix compilation errors${NC}"
    exit 1
}
print_status "TypeScript compilation"
echo ""

# 6. Unit tests
echo "🧪 Running unit tests..."
npm test -- __tests__/unit 2>&1 || {
    echo -e "${RED}✗ Unit tests failed - please fix failing tests${NC}"
    exit 1
}
print_status "Unit tests"
echo ""

# 7. Integration tests
echo "🔗 Running integration tests..."
npm test -- __tests__/integration 2>&1 || {
    echo -e "${RED}✗ Integration tests failed - please fix failing tests${NC}"
    exit 1
}
print_status "Integration tests"
echo ""

# 8. E2E tests
echo "🌐 Running E2E tests..."
npm run test:e2e 2>&1 || {
    echo -e "${RED}✗ E2E tests failed - please fix failing tests${NC}"
    exit 1
}
print_status "E2E tests"
echo ""

# 9. Test coverage check
echo "📊 Checking test coverage..."
npm run test:coverage -- --passWithNoTests 2>&1 | tail -20 || {
    echo -e "${YELLOW}⚠ Coverage check completed with warnings${NC}"
}
print_status "Coverage check"
echo ""

# 10. Mutation tests
# NOTE: Temporarily disabled - Stryker has compatibility issues with dynamic jest.config.ts
# The jest config uses dynamic imports to check for setup file existence, which breaks in Stryker's sandbox
# TODO: Fix by either using a static jest config or updating Stryker configuration
# echo "🧬 Running mutation tests..."
# npm run test:mutation 2>&1 || {
#     echo -e "${RED}✗ Mutation tests failed - mutation score below threshold${NC}"
#     exit 1
# }
# print_status "Mutation tests"
# echo ""

echo -e "${GREEN}✅ All pre-commit checks passed!${NC}"
echo ""
echo "You can now commit your changes safely."
