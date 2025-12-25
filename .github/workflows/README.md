# GitHub Actions CI/CD Pipeline

This directory contains the GitHub Actions workflows for automated testing, validation, and releases.

## Workflows

### 1. PR Validation (`pr-validation.yml`)

Runs on every pull request to `master` branch.

**Checks Performed:**
- ✅ Code formatting (Prettier)
- ✅ Security audit (npm audit)
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Build compilation
- ✅ Unit tests
- ✅ Integration tests
- ✅ E2E tests (Playwright)
- ✅ Test coverage comparison

**Coverage Protection:**
- Downloads baseline coverage from latest master build
- Compares PR coverage against master baseline
- **Blocks merge if coverage decreases**
- Posts coverage report as PR comment

**Artifacts:**
- PR coverage report (retained for 30 days)

---

### 2. Master Build (`master-build.yml`)

Runs on every push to `master` branch.

**Full Validation:**
- All checks from PR validation
- Establishes new coverage baseline
- Auto-increments version
- Creates GitHub release
- Generates distribution artifacts

**Version Management:**
- Automatically increments patch version (e.g., 1.0.0 → 1.0.1)
- Updates `package.json` and `manifest.json`
- Creates Git tag (e.g., `v1.0.1`)
- Commits version bump back to master with `[skip ci]`

**Release Artifacts:**
- ZIP file: `text-marker-extension-{version}.zip`
- Dist folder contents
- Coverage report
- Coverage baseline for future PRs

**Artifacts:**
- Extension dist folder (retained for 90 days)
- Coverage baseline (retained for 90 days)
- Coverage report (retained for 90 days)

---

### 3. Mutation Testing (`mutation-testing.yml`)

Runs on pull requests and master pushes.

**Status:** Currently disabled due to compatibility issues with dynamic `jest.config.ts`

**When Enabled:**
- Runs mutation tests on PRs
- Compares mutation score against master baseline
- **Blocks merge if mutation score decreases**
- Posts mutation report as PR comment
- Establishes new baseline on master

**Artifacts:**
- Mutation baseline (retained for 90 days)

---

## Workflow Triggers

| Workflow | Trigger | Branches |
|----------|---------|----------|
| PR Validation | `pull_request` | `master` |
| Master Build | `push` | `master` |
| Mutation Testing | `pull_request`, `push` | `master` |

---

## Branch Protection Rules

To enforce these workflows, configure the following branch protection rules for `master`:

1. **Require status checks to pass before merging**
   - `validate` (from PR Validation)
   - `mutation-test` (from Mutation Testing, when enabled)

2. **Require branches to be up to date before merging**

3. **Do not allow bypassing the above settings**

### Setting Up Branch Protection

1. Go to repository **Settings** → **Branches**
2. Click **Add rule** for `master` branch
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
4. Add required status checks:
   - `validate`
   - `mutation-test` (when mutation testing is re-enabled)

---

## Local Testing

Before pushing, always run the pre-commit checks locally:

```bash
./pre-commit-check.sh
```

This runs the same checks as the CI pipeline.

---

## Coverage Baseline

The coverage baseline is established from the latest successful master build:

1. Master build runs full test suite with coverage
2. Coverage summary is saved as artifact
3. PR validation downloads this baseline
4. PR coverage is compared against baseline
5. PR is blocked if coverage decreases

**Initial Setup:**
- First master build establishes initial baseline
- If no baseline exists, PR validation skips comparison

---

## Version Numbering

Versions follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.0.0)
- Patch version auto-increments on every master build
- Manual version bumps can be done by updating `package.json`

**Examples:**
- `1.0.0` → `1.0.1` (auto-increment)
- `1.0.1` → `1.0.2` (auto-increment)
- `1.0.2` → `1.1.0` (manual minor bump)
- `1.1.0` → `2.0.0` (manual major bump)

---

## Artifacts

All artifacts are stored in GitHub Actions and associated with their workflow runs:

| Artifact | Retention | Workflow |
|----------|-----------|----------|
| PR Coverage Report | 30 days | PR Validation |
| Coverage Baseline | 90 days | Master Build |
| Extension Dist | 90 days | Master Build |
| Mutation Baseline | 90 days | Mutation Testing |

---

## Troubleshooting

### Coverage Comparison Fails

**Problem:** PR validation fails with "Coverage decreased"

**Solution:**
1. Run `npm run test:coverage` locally
2. Check which files have decreased coverage
3. Add tests to improve coverage
4. Ensure coverage meets or exceeds master baseline

### Build Fails on Master

**Problem:** Master build fails after PR merge

**Solution:**
1. Check workflow logs in GitHub Actions
2. Ensure all pre-commit checks passed locally
3. Verify no conflicts with master
4. Check for environment-specific issues

### Version Conflict

**Problem:** Version tag already exists

**Solution:**
1. Delete the conflicting tag: `git tag -d v1.0.1`
2. Push deletion: `git push origin :refs/tags/v1.0.1`
3. Re-run the workflow

### Mutation Testing Disabled

**Problem:** Mutation testing is currently disabled

**Reason:** Compatibility issue with dynamic `jest.config.ts` in Stryker's sandbox

**Solution:**
1. Fix jest.config.ts to use static configuration, OR
2. Update Stryker configuration to handle dynamic imports
3. Re-enable mutation testing in workflows

---

## Permissions Required

The workflows require the following GitHub token permissions:

- `contents: write` - For creating releases and pushing version commits
- `issues: write` - For commenting on PRs (default)
- `pull-requests: write` - For PR comments (default)

These are configured in the workflow files and use the default `GITHUB_TOKEN`.

---

## Best Practices

1. **Always run pre-commit checks locally** before pushing
2. **Keep PRs small and focused** for easier review and testing
3. **Write tests for new features** to maintain coverage
4. **Review coverage reports** in PR comments
5. **Monitor workflow runs** in GitHub Actions tab
6. **Keep dependencies updated** to avoid security vulnerabilities

---

## Future Enhancements

- [ ] Re-enable mutation testing when compatibility issues are resolved
- [ ] Add performance benchmarking
- [ ] Add bundle size tracking
- [ ] Add automated dependency updates (Dependabot)
- [ ] Add code quality metrics (SonarQube/CodeClimate)
- [ ] Add automated Chrome Web Store publishing
