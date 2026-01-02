#!/bin/bash
NEW_VERSION="$1"
echo "Extracting commits for version $NEW_VERSION"

# Get commits that are in current branch but not in master
COMMITS=$(git log origin/master..HEAD --oneline --no-merges | sed 's/^[a-f0-9]\+ //')

if [ -z "$COMMITS" ]; then
  echo "No new commits found"
  echo "release_notes=No changes in this release"
else
  echo "Found commits:"
  echo "$COMMITS"
  
  # Set output for comment (simulating GitHub Actions)
  RELEASE_NOTES_CONTENT="## 📝 Changes

$(echo "$COMMITS" | sed 's/^/- /')"
  
  echo "release_notes=$RELEASE_NOTES_CONTENT"
fi
