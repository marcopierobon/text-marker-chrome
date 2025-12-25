# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline ensures code quality, maintains test coverage, and automates releases.

## Pipeline Architecture

```
┌─────────────────┐
│   Pull Request  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     PR Validation Workflow          │
│  ✓ Formatting                       │
│  ✓ Security Audit                   │
│  ✓ Linting                          │
│  ✓ Type Checking                    │
│  ✓ Build                            │
│  ✓ Unit Tests                       │
│  ✓ Integration Tests                │
│  ✓ E2E Tests                        │
│  ✓ Coverage Comparison              │
│  ✓ Mutation Testing (when enabled)  │
└────────┬────────────────────────────┘
         │
         ▼
    ┌────────┐
    │ Merge  │
    └───┬────┘
        │
        ▼
┌─────────────────────────────────────┐
│      Master Build Workflow          │
│  ✓ All PR Checks                    │
│  ✓ Auto-increment Version           │
│  ✓ Update package.json/manifest     │
│  ✓ Create Git Tag                   │
│  ✓ Build Distribution               │
│  ✓ Create GitHub Release            │
│  ✓ Upload Artifacts                 │
│  ✓ Establish Coverage Baseline      │
└─────────────────────────────────────┘
```

## Workflows

### 1. PR Validation (`pr-validation.yml`)

**Trigger:** Pull request to `master`

**Purpose:** Validate code quality and prevent regressions

**Steps:**
1. **Code Formatting** - Prettier check
2. **Security Audit** - npm audit for vulnerabilities
3. **Linting** - ESLint validation
4. **Type Checking** - TypeScript compilation check
5. **Build** - Rollup bundling
6. **Unit Tests** - Jest unit tests
7. **Integration Tests** - Jest integration tests
8. **E2E Tests** - Playwright end-to-end tests
9. **Coverage Analysis** - Compare against master baseline
10. **PR Comment** - Post coverage report

**Coverage Protection:**
- Downloads latest master coverage baseline
- Compares PR coverage percentage
- **Blocks merge if coverage decreases**
- Posts detailed coverage report as PR comment

**Example Coverage Comment:**
```markdown
## 📊 Test Coverage Report

- **PR Coverage:** 95.2%
- **Master Coverage:** 94.8%
- **Change:** ✅ +0.4%
```

---

### 2. Master Build (`master-build.yml`)

**Trigger:** Push to `master`

**Purpose:** Create releases and establish baselines

**Steps:**
1. **Full Validation** - All PR checks
2. **Version Bump** - Auto-increment patch version
3. **Update Files** - package.json, manifest.json
4. **Rebuild** - With new version
5. **Create ZIP** - Distribution archive
6. **Create Tag** - Git tag (e.g., v1.0.1)
7. **Create Release** - GitHub release with artifacts
8. **Upload Artifacts** - Dist folder, coverage baseline
9. **Commit Version** - Push version bump to master

**Version Management:**
```
Current: 1.0.0
   ↓
Auto-increment patch
   ↓
New: 1.0.1
   ↓
Update package.json & manifest.json
   ↓
Create tag: v1.0.1
   ↓
Create GitHub Release
```

**Release Artifacts:**
- `text-marker-extension-{version}.zip` - Ready-to-install extension
- `dist/` folder - Uncompressed extension files
- Coverage report - For baseline tracking
- Release notes - Auto-generated

---

### 3. Mutation Testing (`mutation-testing.yml`)

**Trigger:** Pull request to `master` and push to `master`

**Status:** ⚠️ Currently disabled (compatibility issues)

**Purpose:** Ensure test quality through mutation testing

**When Enabled:**
- Runs Stryker mutation tests
- Compares mutation score against master
- **Blocks merge if mutation score decreases**
- Posts mutation report as PR comment

---

## Quality Gates

### Coverage Gate

**Rule:** PR coverage must be ≥ master coverage

**Implementation:**
```bash
if (PR_COVERAGE < MASTER_COVERAGE); then
  echo "❌ Coverage decreased"
  exit 1
fi
```

**Bypass:** Not allowed - must improve coverage

---

### Mutation Score Gate

**Rule:** PR mutation score must be ≥ master mutation score

**Status:** Disabled until compatibility issues resolved

**Implementation:**
```bash
if (PR_MUTATION_SCORE < MASTER_MUTATION_SCORE); then
  echo "❌ Mutation score decreased"
  exit 1
fi
```

---

## Baseline Tracking

### Coverage Baseline

**Establishment:**
1. Master build runs full test suite
2. Coverage summary saved as artifact
3. Artifact retained for 90 days

**Usage:**
1. PR validation downloads latest baseline
2. Compares PR coverage against baseline
3. Fails if coverage decreased

**Storage:**
- Artifact name: `coverage-baseline`
- File: `master-coverage-summary.json`
- Retention: 90 days

---

### Mutation Baseline

**Establishment:**
1. Master build runs mutation tests
2. Mutation score saved as artifact
3. Artifact retained for 90 days

**Usage:**
1. PR validation downloads latest baseline
2. Compares PR mutation score against baseline
3. Fails if score decreased

**Storage:**
- Artifact name: `mutation-baseline`
- File: `master-mutation-score.json`
- Retention: 90 days

---

## Version Management

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

**Auto-increment Rules:**
- Every master build increments **PATCH** version
- Manual bumps for **MINOR** and **MAJOR**

**Examples:**
```
1.0.0 → 1.0.1  (auto)
1.0.1 → 1.0.2  (auto)
1.0.2 → 1.1.0  (manual - new feature)
1.1.0 → 2.0.0  (manual - breaking change)
```

### Version Update Process

1. **Get Latest Tag**
   ```bash
   git describe --tags --abbrev=0
   ```

2. **Increment Patch**
   ```bash
   PATCH=$((PATCH + 1))
   NEW_VERSION="$MAJOR.$MINOR.$PATCH"
   ```

3. **Update Files**
   - `package.json` → version field
   - `manifest.json` → version field

4. **Create Tag**
   ```bash
   git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
   ```

5. **Commit & Push**
   ```bash
   git commit -m "chore: bump version to $NEW_VERSION [skip ci]"
   git push origin master
   git push origin "v$NEW_VERSION"
   ```

**Note:** `[skip ci]` prevents infinite loop

---

## Artifacts

### Artifact Retention Policy

| Artifact | Retention | Size | Purpose |
|----------|-----------|------|---------|
| PR Coverage | 30 days | ~1 MB | PR validation |
| Coverage Baseline | 90 days | ~100 KB | Master baseline |
| Extension Dist | 90 days | ~500 KB | Release files |
| Mutation Baseline | 90 days | ~10 KB | Mutation tracking |

### Accessing Artifacts

**Via GitHub UI:**
1. Go to Actions tab
2. Select workflow run
3. Scroll to "Artifacts" section
4. Download artifact

**Via GitHub CLI:**
```bash
# List artifacts
gh run list --workflow "Master Build"

# Download artifact
gh run download <run-id> -n coverage-baseline
```

---

## Local Testing

### Pre-commit Checks

Run all checks locally before pushing:

```bash
./pre-commit-check.sh
```

### CI Simulation

Simulate the full CI pipeline locally:

```bash
npm run ci:test
```

This runs the same checks as GitHub Actions.

---

## Branch Protection

### Required Settings

Configure these rules for `master` branch:

1. **Require pull request before merging**
   - ✅ Enabled
   - Require approvals: 1 (recommended)

2. **Require status checks to pass**
   - ✅ Enabled
   - Required checks:
     - `validate` (PR Validation)
     - `mutation-test` (when enabled)

3. **Require branches to be up to date**
   - ✅ Enabled

4. **Do not allow bypassing**
   - ✅ Enabled

### Setup Instructions

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `master`
4. Enable required settings above
5. Save changes

---

## Troubleshooting

### Coverage Decreased

**Problem:** PR blocked due to coverage decrease

**Solution:**
```bash
# 1. Run coverage locally
npm run test:coverage

# 2. Check coverage report
open coverage/lcov-report/index.html

# 3. Identify uncovered lines
# 4. Add tests to cover them
# 5. Verify coverage improved
npm run test:coverage
```

---

### Build Fails on Master

**Problem:** Master build fails after merge

**Causes:**
- Merge conflicts
- Environment differences
- Flaky tests

**Solution:**
```bash
# 1. Pull latest master
git pull origin master

# 2. Run full checks locally
./pre-commit-check.sh

# 3. Fix any issues
# 4. Push fix
git push origin master
```

---

### Version Tag Conflict

**Problem:** Tag already exists

**Solution:**
```bash
# Delete local tag
git tag -d v1.0.1

# Delete remote tag
git push origin :refs/tags/v1.0.1

# Re-run workflow or create new tag
```

---

### Artifact Not Found

**Problem:** PR validation can't find baseline

**Cause:** No master build has run yet

**Solution:**
- First master build establishes baseline
- Subsequent PRs will use this baseline
- If baseline is missing, comparison is skipped

---

## Best Practices

### For Developers

1. ✅ **Run pre-commit checks** before pushing
2. ✅ **Write tests** for new features
3. ✅ **Maintain coverage** - don't decrease it
4. ✅ **Review PR comments** - check coverage reports
5. ✅ **Keep PRs small** - easier to review and test

### For Maintainers

1. ✅ **Monitor workflow runs** - check for failures
2. ✅ **Review coverage trends** - ensure quality
3. ✅ **Update dependencies** - security patches
4. ✅ **Manage artifacts** - clean up old ones
5. ✅ **Document changes** - update CI/CD docs

---

## Metrics & Monitoring

### Key Metrics

Track these metrics over time:

- **Coverage Percentage** - Should trend upward
- **Mutation Score** - Should stay high (>80%)
- **Build Time** - Should stay reasonable (<10 min)
- **Test Count** - Should increase with features
- **Failure Rate** - Should stay low (<5%)

### Viewing Metrics

**Coverage Trend:**
```bash
# Download coverage from multiple runs
gh run list --workflow "Master Build" --limit 10

# Extract coverage percentages
# Plot trend over time
```

**Build Time Trend:**
- Check workflow run durations in Actions tab
- Identify slow steps
- Optimize if needed

---

## Future Enhancements

### Planned

- [ ] Re-enable mutation testing
- [ ] Add performance benchmarks
- [ ] Track bundle size
- [ ] Automated dependency updates
- [ ] Code quality metrics (SonarQube)
- [ ] Automated Chrome Web Store publishing

### Under Consideration

- [ ] Slack/Discord notifications
- [ ] Custom coverage thresholds per file
- [ ] Visual regression testing
- [ ] Accessibility testing
- [ ] Security scanning (Snyk/Dependabot)

---

## Support

For issues with the CI/CD pipeline:

1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Run checks locally to reproduce
4. Open an issue with details

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Jest Coverage](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [Stryker Mutator](https://stryker-mutator.io/)
- [Playwright Testing](https://playwright.dev/)
