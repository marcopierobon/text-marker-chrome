import { existsSync, writeFileSync } from "fs";
import { join } from "path";

describe("Version Bump Detection Logic", () => {
  const testDir = join(__dirname, "../../temp-version-detection");

  beforeEach(() => {
    // Create test directory and mock version files
    if (!existsSync(testDir)) {
      require("fs").mkdirSync(testDir, { recursive: true });
    }

    // Create mock version files
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({ version: "1.0.0" }),
    );
    writeFileSync(
      join(testDir, "manifest.json"),
      JSON.stringify({ version: "1.0.0" }),
    );
    writeFileSync(
      join(testDir, "manifest.firefox.json"),
      JSON.stringify({ version: "1.0.0" }),
    );
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      require("fs").rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("checkVersionAlreadyBumped", () => {
    it("should return false when target version is different from current versions", () => {
      // This test should FAIL initially because the function doesn't exist yet
      const {
        checkVersionAlreadyBumped,
      } = require("../../scripts/version-check");

      const result = checkVersionAlreadyBumped("1.1.0", testDir);

      expect(result).toBe(false);
    });

    it("should return true when target version matches all current versions", () => {
      // Update all files to target version
      writeFileSync(
        join(testDir, "package.json"),
        JSON.stringify({ version: "1.1.0" }),
      );
      writeFileSync(
        join(testDir, "manifest.json"),
        JSON.stringify({ version: "1.1.0" }),
      );
      writeFileSync(
        join(testDir, "manifest.firefox.json"),
        JSON.stringify({ version: "1.1.0" }),
      );

      // This test should FAIL initially because the function doesn't exist yet
      const {
        checkVersionAlreadyBumped,
      } = require("../../scripts/version-check");

      const result = checkVersionAlreadyBumped("1.1.0", testDir);

      expect(result).toBe(true);
    });

    it("should return false when any version file does not match target version", () => {
      // Update only some files to target version
      writeFileSync(
        join(testDir, "package.json"),
        JSON.stringify({ version: "1.1.0" }),
      );
      writeFileSync(
        join(testDir, "manifest.json"),
        JSON.stringify({ version: "1.1.0" }),
      );
      // manifest.firefox.json remains at 1.0.0

      // This test should FAIL initially because the function doesn't exist yet
      const {
        checkVersionAlreadyBumped,
      } = require("../../scripts/version-check");

      const result = checkVersionAlreadyBumped("1.1.0", testDir);

      expect(result).toBe(false);
    });
  });

  describe("getCurrentVersions", () => {
    it("should return current versions from all version files", () => {
      // This test should FAIL initially because the function doesn't exist yet
      const { getCurrentVersions } = require("../../scripts/version-check");

      const versions = getCurrentVersions(testDir);

      expect(versions).toEqual({
        package: "1.0.0",
        manifest: "1.0.0",
        firefox: "1.0.0",
      });
    });

    it("should handle missing version files gracefully", () => {
      // Remove one version file
      require("fs").rmSync(join(testDir, "manifest.firefox.json"));

      // This test should FAIL initially because the function doesn't exist yet
      const { getCurrentVersions } = require("../../scripts/version-check");

      const versions = getCurrentVersions(testDir);

      expect(versions).toEqual({
        package: "1.0.0",
        manifest: "1.0.0",
        firefox: null,
      });
    });
  });
});
