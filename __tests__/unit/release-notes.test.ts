import { execSync } from "child_process";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

describe("Release Notes Generation", () => {
  const testDir = join(__dirname, "../../temp-release-notes");
  const testVersion = "1.0.1";

  beforeEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      execSync(`rm -rf ${testDir}`);
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      execSync(`rm -rf ${testDir}`);
    }
  });

  describe("Here-document syntax", () => {
    it("should properly generate release notes with valid here-document syntax", () => {
      const script = `
NEW_VERSION="${testVersion}"
echo "Extracting commits for version \$NEW_VERSION"

# Mock commits for testing
COMMITS="feat: add new feature
fix: resolve bug
docs: update README"

if [ -z "\$COMMITS" ]; then
  echo "No new commits found"
  echo "release_notes=No changes in this release"
else
  echo "Found commits:"
  echo "\$COMMITS"
  
  # Create release notes directory
  mkdir -p ${testDir}/release_notes
  
  # Generate release notes content
  cat > "${testDir}/release_notes/\${NEW_VERSION}.md" << EOF
# Release v\${NEW_VERSION}

## 📝 Changes

\$COMMITS

---

*This release was automatically generated from PR #5*
EOF
  
  echo "✅ Created release_notes/\${NEW_VERSION}.md"
fi
`;

      // This should pass - valid here-document syntax
      expect(() => {
        execSync(script, { shell: "/bin/bash" });
      }).not.toThrow();

      const releaseNotesPath = join(
        testDir,
        "release_notes",
        `${testVersion}.md`,
      );
      expect(existsSync(releaseNotesPath)).toBe(true);

      const content = readFileSync(releaseNotesPath, "utf8");
      expect(content).toContain(`# Release v${testVersion}`);
      expect(content).toContain("## 📝 Changes");
      expect(content).toContain("feat: add new feature");
      expect(content).toContain(
        "*This release was automatically generated from PR #5*",
      );
    });

    it("should fail with invalid here-document syntax", () => {
      const invalidScript = `
NEW_VERSION="${testVersion}"
echo "Extracting commits for version \$NEW_VERSION"

COMMITS="feat: add new feature"

# Invalid here-document - missing proper EOF
cat > "${testDir}/release_notes/\${NEW_VERSION}.md" << EOF
# Release v\${NEW_VERSION}

## 📝 Changes

\$COMMITS

---

*This release was automatically generated from PR #5*
EOF  # This should be on its own line
`;

      // This should fail due to invalid here-document syntax
      expect(() => {
        execSync(invalidScript, { shell: "/bin/bash" });
      }).toThrow();
    });
  });

  describe("Release notes content generation", () => {
    it("should create release notes with proper format when commits exist", () => {
      const script = `
NEW_VERSION="${testVersion}"
COMMITS="feat: add new feature
fix: resolve bug"

mkdir -p ${testDir}/release_notes

cat > "${testDir}/release_notes/\${NEW_VERSION}.md" << EOF
# Release v\${NEW_VERSION}

## 📝 Changes

\${COMMITS}

---

*This release was automatically generated*
EOF
`;

      execSync(script, { shell: "/bin/bash" });

      const releaseNotesPath = join(
        testDir,
        "release_notes",
        `${testVersion}.md`,
      );
      const content = readFileSync(releaseNotesPath, "utf8");

      expect(content).toContain(`# Release v${testVersion}`);
      expect(content).toContain("## 📝 Changes");
      expect(content).toContain("feat: add new feature");
      expect(content).toContain("fix: resolve bug");
      expect(content).toContain("*This release was automatically generated*");
    });

    it("should handle empty commits gracefully", () => {
      const script = `
NEW_VERSION="${testVersion}"
COMMITS=""

if [ -z "\$COMMITS" ]; then
  echo "No new commits found"
  echo "release_notes=No changes in this release"
else
  mkdir -p ${testDir}/release_notes
  cat > "${testDir}/release_notes/\${NEW_VERSION}.md" << EOF
# Release v\${NEW_VERSION}
EOF
fi
`;

      const result = execSync(script, { shell: "/bin/bash", encoding: "utf8" });
      expect(result.toString()).toContain("No new commits found");

      const releaseNotesPath = join(
        testDir,
        "release_notes",
        `${testVersion}.md`,
      );
      expect(existsSync(releaseNotesPath)).toBe(false);
    });
  });
});
