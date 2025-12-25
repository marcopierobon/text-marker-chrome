#!/bin/bash

# Script to test CI pipeline locally before pushing
# This simulates what GitHub Actions will run

set -e

echo "🧪 Testing CI Pipeline Locally"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Run the same checks as PR validation
print_step "Running PR Validation Checks..."
echo ""

# 1. Code formatting
print_step "1. Checking code formatting..."
if npx prettier --check "**/*.{ts,js,json,md}" 2>&1; then
    print_success "Code formatting passed"
else
    print_error "Code formatting failed"
    echo -e "${YELLOW}Run: npx prettier --write \"**/*.{ts,js,json,md}\" to fix${NC}"
    exit 1
fi
echo ""

# 2. Security audit
print_step "2. Running security audit..."
AUDIT_OUTPUT=$(npm audit --json 2>&1)
CRITICAL=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.critical // 0' 2>/dev/null || echo "0")
HIGH=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.high // 0' 2>/dev/null || echo "0")

if [ "$CRITICAL" != "0" ] || [ "$HIGH" != "0" ]; then
    print_error "Security audit failed - Found $CRITICAL critical and $HIGH high vulnerabilities"
    npm audit --audit-level=high
    exit 1
else
    print_success "Security audit passed"
fi
echo ""

# 3. Linting
print_step "3. Running linting..."
if npm run lint 2>&1; then
    print_success "Linting passed"
else
    print_error "Linting failed"
    exit 1
fi
echo ""

# 4. Type checking
print_step "4. Running type checking..."
if npm run type-check 2>&1; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    exit 1
fi
echo ""

# 5. Build
print_step "5. Building extension..."
if npm run build 2>&1; then
    print_success "Build passed"
else
    print_error "Build failed"
    exit 1
fi
echo ""

# 6. Unit tests
print_step "6. Running unit tests..."
if npm test -- __tests__/unit 2>&1; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi
echo ""

# 7. Integration tests
print_step "7. Running integration tests..."
if npm test -- __tests__/integration 2>&1; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi
echo ""

# 8. E2E tests
print_step "8. Running E2E tests..."
if npm run test:e2e 2>&1; then
    print_success "E2E tests passed"
else
    print_error "E2E tests failed"
    exit 1
fi
echo ""

# 9. Coverage
print_step "9. Running coverage tests..."
if npm run test:coverage -- --coverage --coverageReporters=json-summary 2>&1 > /dev/null; then
    COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
    print_success "Coverage tests passed - Coverage: $COVERAGE%"
else
    print_error "Coverage tests failed"
    exit 1
fi
echo ""

echo ""
echo -e "${GREEN}✅ All CI checks passed locally!${NC}"
echo ""
echo "Your code is ready to push. The CI pipeline should pass."
echo ""
echo "Next steps:"
echo "  1. git add ."
echo "  2. git commit -m \"your message\""
echo "  3. git push"
echo ""
