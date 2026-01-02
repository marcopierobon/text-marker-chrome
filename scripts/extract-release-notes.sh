#!/bin/bash

# Extract release notes from PR commits
# Usage: extract-release-notes.sh <version>

set -e  # Exit on any error

NEW_VERSION="$1"
echo "Extracting commits for version $NEW_VERSION"

# Get all commits that are in PR but not in master
COMMITS=$(git log --oneline --no-merges origin/master..HEAD || echo "")

if [ -z "$COMMITS" ]; then
  echo "No new commits found between origin/master and HEAD"
  echo "Checking for any commits in current HEAD..."
  COMMITS=$(git log --oneline --no-merges -n 5 HEAD || echo "No commits found")
  
  if [ "$COMMITS" = "No commits found" ]; then
    echo "No commits found at all"
    COMMITS="No changes in this release"
  fi
fi

echo "Found commits:"
echo "$COMMITS"

# Always create release notes directory and file
mkdir -p release_notes

# Generate release notes content with proper here-document syntax
cat > "release_notes/${NEW_VERSION}.md" << EOF
# Release v${NEW_VERSION}

## 📝 Changes

$COMMITS

---

*This release was automatically generated*
EOF

echo "✅ Created release_notes/${NEW_VERSION}.md"

# Set output for comment (for GitHub Actions)
if [ "$COMMITS" = "No changes in this release" ]; then
  echo "release_notes=No changes in this release"
else
  RELEASE_NOTES_CONTENT="## 📝 Changes

$(echo "$COMMITS" | sed 's/^/- /')"
  
  echo "release_notes=$RELEASE_NOTES_CONTENT"
fi
