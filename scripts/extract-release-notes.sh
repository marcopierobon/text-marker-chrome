#!/bin/bash
NEW_VERSION="1.1.0"
echo "Extracting commits for version $NEW_VERSION"

# Mock git log for testing
COMMITS="feat: add new feature
fix: resolve bug"

if [ -z "$COMMITS" ]; then
  echo "No new commits found"
  echo "release_notes=No changes in this release"
else
  echo "Found commits:"
  echo "$COMMITS"
  
  # Create release notes directory
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
  
  # Set output for comment (simulating GitHub Actions)
  RELEASE_NOTES_CONTENT="## 📝 Changes

$(echo "$COMMITS" | sed 's/^/- /')"
  
  echo "release_notes=$RELEASE_NOTES_CONTENT"
fi
