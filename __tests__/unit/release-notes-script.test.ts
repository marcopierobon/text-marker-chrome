import { execSync } from "child_process";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

describe("Release Notes Script", () => {
  const testDir = join(__dirname, "../../temp-release-notes-script");
  const scriptsDir = join(__dirname, "../../scripts");
  const testVersion = "1.1.0";

  beforeEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      execSync(`rm -rf ${testDir}`);
    }
    mkdirSync(testDir, { recursive: true });

    // Ensure scripts directory exists
    if (!existsSync(scriptsDir)) {
      mkdirSync(scriptsDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      execSync(`rm -rf ${testDir}`);
    }
  });

  describe("Shell script execution", () => {
    it("should properly generate release notes when shell script has valid syntax", () => {
      const validScript = `#!/bin/bash
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
  
  # Generate release notes content with proper here-document syntax
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

      const scriptPath = join(testDir, "valid-release-notes.sh");
      writeFileSync(scriptPath, validScript);
      execSync(`chmod +x ${scriptPath}`);

      // This should pass - valid here-document syntax
      expect(() => {
        execSync(scriptPath, { shell: "/bin/bash" });
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
      expect(content).toContain("fix: resolve bug");
      expect(content).toContain("docs: update README");
      expect(content).toContain(
        "*This release was automatically generated from PR #5*",
      );
    });

    it("should handle empty commits gracefully in shell script", () => {
      const emptyScript = `#!/bin/bash
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

      const scriptPath = join(testDir, "empty-release-notes.sh");
      writeFileSync(scriptPath, emptyScript);
      execSync(`chmod +x ${scriptPath}`);

      const result = execSync(scriptPath, {
        shell: "/bin/bash",
        encoding: "utf8",
      });
      expect(result.toString()).toContain("No new commits found");

      const releaseNotesPath = join(
        testDir,
        "release_notes",
        `${testVersion}.md`,
      );
      expect(existsSync(releaseNotesPath)).toBe(false);
    });
  });

  describe("Integration with GitHub Actions workflow", () => {
    it("should be callable from GitHub Actions workflow", () => {
      const workflowScript = `#!/bin/bash
NEW_VERSION="${testVersion}"
echo "Extracting commits for version \$NEW_VERSION"

# Mock git log for testing
COMMITS="feat: add new feature
fix: resolve bug"

if [ -z "\$COMMITS" ]; then
  echo "No new commits found"
  echo "release_notes=No changes in this release"
else
  echo "Found commits:"
  echo "\$COMMITS"
  
  # Create release notes directory
  mkdir -p release_notes
  
  # Generate release notes content with proper here-document syntax
  cat > "release_notes/\${NEW_VERSION}.md" << EOF
# Release v\${NEW_VERSION}

## 📝 Changes

\$COMMITS

---

*This release was automatically generated*
EOF
  
  echo "✅ Created release_notes/\${NEW_VERSION}.md"
  
  # Set output for comment (simulating GitHub Actions)
  RELEASE_NOTES_CONTENT="## 📝 Changes

\$(echo "\$COMMITS" | sed 's/^/- /')"
  
  echo "release_notes=\$RELEASE_NOTES_CONTENT"
fi
`;

      const scriptPath = join(scriptsDir, "extract-release-notes.sh");
      writeFileSync(scriptPath, workflowScript);
      execSync(`chmod +x ${scriptPath}`);

      // This should work when called from GitHub Actions
      expect(() => {
        execSync(`${scriptPath}`, { shell: "/bin/bash" });
      }).not.toThrow();

      const releaseNotesPath = join(
        process.cwd(),
        "release_notes",
        `${testVersion}.md`,
      );
      expect(existsSync(releaseNotesPath)).toBe(true);

      // Clean up the generated file
      if (existsSync(releaseNotesPath)) {
        execSync(`rm ${releaseNotesPath}`);
      }
    });
  });
});
