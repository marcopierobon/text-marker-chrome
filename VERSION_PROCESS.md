# Version Management Process

## 🔄 New PR-Based Version Bumping Process

### 📋 Overview
Version bumps now happen during the PR process, not during the release process. Release notes are automatically generated from commits.

### 🚀 Step-by-Step Process

#### 1. Create PR for Changes
```bash
# Make your changes
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

#### 2. Add Version Labels to PR
Add labels to your PR to specify the version bump type:

- **`version-bump`** (required) - Triggers version bumping
- **`patch`** (default) - Bump patch version (1.0.0 → 1.0.1)
- **`minor`** - Bump minor version (1.0.0 → 1.1.0)  
- **`major`** - Bump major version (1.0.0 → 2.0.0)

#### 3. Automatic Version Bump
When you add the `version-bump` label, the PR workflow will:
- Calculate the new version based on labels
- **Extract all commits not in master** for release notes
- **Create `release_notes/VERSION.md`** with commit list
- Update `package.json`, `manifest.json`, and `manifest.firefox.json`
- Run tests to ensure everything works
- **Commit the version changes and release notes to the PR branch**
- **Push changes back to the PR**
- Comment with the new version and commit list

#### 3.1. Release Notes Generation
The workflow automatically:
- Extracts commits using `git log --oneline --no-merges origin/master..HEAD`
- Creates `release_notes/VERSION.md` with formatted commit list
- Includes PR reference in release notes
- **Regenerates release notes** if new commits are pushed to the PR

#### 4. Review and Merge
- Review the PR as normal
- The version files and release notes are already updated
- Merge the PR when ready

#### 5. Automatic Release
After merging to master:
- Master build workflow runs
- **Checks if version changed** (compares package.json vs latest tag)
- **Uses pre-generated release notes** from `release_notes/VERSION.md`
- **Creates Git tag** only if version is different
- **Creates GitHub release** with release notes content
- **Publishes to Chrome Web Store** (part of master CD workflow)

### 🔄 Complete Flow

```
PR with version-bump label → Extract commits → Generate release notes → 
Update version files → Commit to PR → Review & Merge → 
Master build → Tag creation → GitHub release (with release notes) → Chrome Store publish
```

### 🏷️ Label Combinations

| Labels | Result | Example |
|--------|--------|---------|
| `version-bump` | Patch bump | 1.0.0 → 1.0.1 |
| `version-bump` + `patch` | Patch bump | 1.0.0 → 1.0.1 |
| `version-bump` + `minor` | Minor bump | 1.0.0 → 1.1.0 |
| `version-bump` + `major` | Major bump | 1.0.0 → 2.0.0 |

### 📝 Release Notes Format

The generated `release_notes/VERSION.md` contains:

```markdown
# Release v1.1.0

## 📝 Changes

feat: add new feature
fix: resolve bug in popup
docs: update README

---

*This release was automatically generated from PR #123*
```

### 🔄 Dynamic Updates

**When new commits are pushed to an open PR with `version-bump` label:**
- Workflow automatically re-runs
- **Re-extracts all commits** from master
- **Regenerates entire release notes** file
- Updates version files if needed
- Commits new release notes to PR

### 📦 Files Created/Modified

#### During PR Process:
- `package.json` - Version updated
- `manifest.json` - Version updated  
- `manifest.firefox.json` - Version updated
- `release_notes/VERSION.md` - New release notes file

#### During Release:
- Git tag `vVERSION` created
- GitHub release with release notes content
- Chrome Web Store publishing

### 🎯 Benefits

1. **Clear version history** - Each PR shows what type of change it is
2. **No manual version calculations** - Automated based on labels
3. **Automatic release notes** - Generated from actual commits
4. **Dynamic updates** - Release notes update when PR changes
5. **No merge conflicts** - Version updates happen in the PR
6. **Consistent process** - Everyone follows the same workflow

### 🚨 Important Notes

- Always add the `version-bump` label if you want the version updated
- Version bump only happens when PR is labeled (not on every PR)
- Tests must pass for version bump to succeed
- The version bump commits to the PR branch, not directly to master
- Release notes are regenerated when new commits are pushed to the PR
- Release notes are used during GitHub release creation

### 📋 Example PR Timeline

**Initial PR:**
1. Create PR with 3 commits
2. Add labels: `version-bump`, `minor`
3. Workflow runs: Creates release notes with 3 commits
4. Version bumped to 1.1.0

**Additional Commits:**
1. Push 2 more commits to PR
2. Workflow re-runs: Regenerates release notes with all 5 commits
3. Version files updated (if needed)

**Merge:**
1. Merge PR to master
2. Master workflow uses release_notes/1.1.0.md
3. GitHub release created with commit list
4. Chrome Store publishing triggered
