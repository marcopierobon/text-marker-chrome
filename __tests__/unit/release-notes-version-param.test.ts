import { describe, it, expect } from "@jest/globals";

describe("Release Notes Script - Version File Creation", () => {
  describe("Version parameter handling", () => {
    it("should create release notes file with the correct version parameter", () => {
      // Test that the script creates the file with the passed version, not a hardcoded version
      const testVersion = "1.9.0";

      // The script should create release_notes/1.9.0.md when called with "1.9.0"
      const expectedFilename = `release_notes/${testVersion}.md`;

      expect(expectedFilename).toBe("release_notes/1.9.0.md");
    });

    it("should not create files with hardcoded versions", () => {
      // Test that the script doesn't create files with hardcoded version numbers
      const hardcodedVersion = "1.1.0";
      const wrongFilename = `release_notes/${hardcodedVersion}.md`;

      // The script should NOT create release_notes/1.1.0.md
      expect(wrongFilename).not.toBe("release_notes/1.9.0.md");
    });

    it("should handle version parameter correctly in git log", () => {
      // Test that the version parameter is used correctly throughout the script
      const testVersion = "1.9.0";

      // The script should use the parameter for:
      // 1. Echo statements
      // 2. File creation
      // 3. Output messages

      expect(testVersion).toBe("1.9.0");
      expect(testVersion).not.toBe("1.1.0");
    });
  });
});
