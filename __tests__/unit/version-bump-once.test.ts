import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

describe("Version Bump Once Per PR", () => {
  const testDir = join(__dirname, "../../temp-version-bump");

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

  describe("Version bump detection", () => {
    it("should detect if version has already been bumped in current PR", () => {
      const detectionScript = `#!/bin/bash
      
# Simulate a scenario where version was already bumped
CURRENT_VERSION="1.0.0"
TARGET_VERSION="1.1.0"

# Check if version files already contain target version
PACKAGE_VERSION="1.1.0"  # Already bumped
MANIFEST_VERSION="1.1.0"  # Already bumped

if [ "\$PACKAGE_VERSION" = "\$TARGET_VERSION" ] && [ "\$MANIFEST_VERSION" = "\$TARGET_VERSION" ]; then
  echo "version_already_bumped=true"
  echo "Version \$TARGET_VERSION already applied"
else
  echo "version_already_bumped=false"
  echo "Version bump needed"
fi
`;

      const scriptPath = join(testDir, "version-detection.sh");
      writeFileSync(scriptPath, detectionScript);
      execSync(`chmod +x ${scriptPath}`);

      const result = execSync(scriptPath, {
        shell: "/bin/bash",
        encoding: "utf8",
      });
      expect(result.toString()).toContain("version_already_bumped=true");
      expect(result.toString()).toContain("Version 1.1.0 already applied");
    });

    it("should proceed with version bump when version files have old version", () => {
      const detectionScript = `#!/bin/bash
      
# Simulate a scenario where version needs to be bumped
CURRENT_VERSION="1.0.0"
TARGET_VERSION="1.1.0"

# Check if version files already contain target version
PACKAGE_VERSION="1.0.0"  # Not bumped yet
MANIFEST_VERSION="1.0.0"  # Not bumped yet

if [ "\$PACKAGE_VERSION" = "\$TARGET_VERSION" ] && [ "\$MANIFEST_VERSION" = "\$TARGET_VERSION" ]; then
  echo "version_already_bumped=true"
  echo "Version \$TARGET_VERSION already applied"
else
  echo "version_already_bumped=false"
  echo "Version bump needed"
fi
`;

      const scriptPath = join(testDir, "version-detection.sh");
      writeFileSync(scriptPath, detectionScript);
      execSync(`chmod +x ${scriptPath}`);

      const result = execSync(scriptPath, {
        shell: "/bin/bash",
        encoding: "utf8",
      });
      expect(result.toString()).toContain("version_already_bumped=false");
      expect(result.toString()).toContain("Version bump needed");
    });

    it("should skip version bump if any version file already has target version", () => {
      const detectionScript = `#!/bin/bash
      
# Simulate partial version bump (some files updated, some not)
CURRENT_VERSION="1.0.0"
TARGET_VERSION="1.1.0"

# Check if version files already contain target version
PACKAGE_VERSION="1.1.0"  # Already bumped
MANIFEST_VERSION="1.0.0"  # Not bumped yet

if [ "\$PACKAGE_VERSION" = "\$TARGET_VERSION" ] && [ "\$MANIFEST_VERSION" = "\$TARGET_VERSION" ]; then
  echo "version_already_bumped=true"
  echo "Version \$TARGET_VERSION already applied"
else
  echo "version_already_bumped=false"
  echo "Version bump needed"
fi
`;

      const scriptPath = join(testDir, "version-detection.sh");
      writeFileSync(scriptPath, detectionScript);
      execSync(`chmod +x ${scriptPath}`);

      const result = execSync(scriptPath, {
        shell: "/bin/bash",
        encoding: "utf8",
      });
      expect(result.toString()).toContain("version_already_bumped=false");
      expect(result.toString()).toContain("Version bump needed");
    });
  });

  describe("GitHub Actions workflow integration", () => {
    it("should skip version bump step if version already applied", () => {
      const workflowScript = `#!/bin/bash
      
# Simulate GitHub Actions workflow check
NEW_VERSION="1.1.0"

# Read current versions from files
PACKAGE_VERSION="1.1.0"
MANIFEST_VERSION="1.1.0"
FIREFOX_VERSION="1.1.0"

echo "Checking if version \$NEW_VERSION already applied..."

if [ "\$PACKAGE_VERSION" = "\$NEW_VERSION" ] && [ "\$MANIFEST_VERSION" = "\$NEW_VERSION" ] && [ "\$FIREFOX_VERSION" = "\$NEW_VERSION" ]; then
  echo "✅ Version \$NEW_VERSION already applied, skipping bump"
  echo "skip_version_bump=true"
  exit 0
else
  echo "🔄 Version bump needed"
  echo "skip_version_bump=false"
fi
`;

      const scriptPath = join(testDir, "workflow-check.sh");
      writeFileSync(scriptPath, workflowScript);
      execSync(`chmod +x ${scriptPath}`);

      const result = execSync(scriptPath, {
        shell: "/bin/bash",
        encoding: "utf8",
      });
      expect(result.toString()).toContain("skip_version_bump=true");
      expect(result.toString()).toContain("already applied, skipping bump");
    });

    it("should proceed with version bump if versions are different", () => {
      const workflowScript = `#!/bin/bash
      
# Simulate GitHub Actions workflow check
NEW_VERSION="1.1.0"

# Read current versions from files
PACKAGE_VERSION="1.0.0"
MANIFEST_VERSION="1.0.0"
FIREFOX_VERSION="1.0.0"

echo "Checking if version \$NEW_VERSION already applied..."

if [ "\$PACKAGE_VERSION" = "\$NEW_VERSION" ] && [ "\$MANIFEST_VERSION" = "\$NEW_VERSION" ] && [ "\$FIREFOX_VERSION" = "\$NEW_VERSION" ]; then
  echo "✅ Version \$NEW_VERSION already applied, skipping bump"
  echo "skip_version_bump=true"
  exit 0
else
  echo "🔄 Version bump needed"
  echo "skip_version_bump=false"
fi
`;

      const scriptPath = join(testDir, "workflow-check.sh");
      writeFileSync(scriptPath, workflowScript);
      execSync(`chmod +x ${scriptPath}`);

      const result = execSync(scriptPath, {
        shell: "/bin/bash",
        encoding: "utf8",
      });
      expect(result.toString()).toContain("skip_version_bump=false");
      expect(result.toString()).toContain("Version bump needed");
    });
  });
});
