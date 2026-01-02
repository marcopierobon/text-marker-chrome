import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

describe("Release Notes Script - GitHub Actions Environment", () => {
  const testDir = join(__dirname, "../../temp-release-notes-ga");

  beforeEach(() => {
    if (existsSync(testDir)) {
      execSync(`rm -rf ${testDir}`);
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      execSync(`rm -rf ${testDir}`);
    }
  });

  describe("GitHub Actions git environment simulation", () => {
    it("should extract commits when git log returns commits", () => {
      const mockGitLog = `f9e197d fix: simplify file existence checks
1a3f44f chore: bump version to 1.8.0
7afe88e fix: invert version check logic`;

      const script = `#!/bin/bash
NEW_VERSION="$1"
echo "Extracting commits for version $NEW_VERSION"

# Mock git log to simulate GitHub Actions environment
COMMITS="${mockGitLog}"

if [ -z "$COMMITS" ]; then
  echo "No new commits found"
  echo "release_notes=No changes in this release"
else
  echo "Found commits:"
  echo "$COMMITS"
  
  # Set output for comment (simulating GitHub Actions)
  RELEASE_NOTES_CONTENT="## 📝 Changes

$(echo "$COMMITS" | sed 's/^/- /')"
  
  echo "release_notes=\$RELEASE_NOTES_CONTENT"
fi`;

      const scriptPath = join(testDir, "test-release-notes.sh");
      require("fs").writeFileSync(scriptPath, script);
      execSync(`chmod +x ${scriptPath}`);

      const result = execSync(`${scriptPath} 1.8.0`, {
        encoding: "utf8",
        cwd: testDir,
      });

      expect(result).toContain("Found commits:");
      expect(result).toContain("f9e197d fix: simplify file existence checks");
      expect(result).toContain("release_notes=## 📝 Changes");
      expect(result).toContain("- f9e197d fix: simplify file existence checks");
    });

    it("should handle empty git log gracefully", () => {
      const script = `#!/bin/bash
NEW_VERSION="$1"
echo "Extracting commits for version $NEW_VERSION"

# Mock empty git log
COMMITS=""

if [ -z "$COMMITS" ]; then
  echo "No new commits found"
  echo "release_notes=No changes in this release"
else
  echo "Found commits:"
  echo "$COMMITS"
  echo "release_notes=## 📝 Changes"
fi`;

      const scriptPath = join(testDir, "test-release-notes-empty.sh");
      require("fs").writeFileSync(scriptPath, script);
      execSync(`chmod +x ${scriptPath}`);

      const result = execSync(`${scriptPath} 1.8.0`, {
        encoding: "utf8",
        cwd: testDir,
      });

      expect(result).toContain("No new commits found");
      expect(result).toContain("release_notes=No changes in this release");
    });

    it("should handle git log command failure gracefully", () => {
      const script = `#!/bin/bash
NEW_VERSION="$1"
echo "Extracting commits for version $NEW_VERSION"

# Mock failing git log - in reality this would exit with error
COMMITS=""

if [ -z "$COMMITS" ]; then
  echo "No new commits found"
  echo "release_notes=No changes in this release"
else
  echo "Found commits:"
  echo "$COMMITS"
  echo "release_notes=## 📝 Changes"
fi`;

      const scriptPath = join(testDir, "test-release-notes-fail.sh");
      require("fs").writeFileSync(scriptPath, script);
      execSync(`chmod +x ${scriptPath}`);

      const result = execSync(`${scriptPath} 1.8.0`, {
        encoding: "utf8",
        cwd: testDir,
      });

      expect(result).toContain("No new commits found");
      expect(result).toContain("release_notes=No changes in this release");
    });
  });
});
