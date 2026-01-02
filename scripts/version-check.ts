import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface VersionInfo {
  package: string | null;
  manifest: string | null;
  firefox: string | null;
}

/**
 * Get current versions from all version files
 */
export function getCurrentVersions(
  baseDir: string = process.cwd(),
): VersionInfo {
  const versions: VersionInfo = {
    package: null,
    manifest: null,
    firefox: null,
  };

  try {
    const packageJsonPath = join(baseDir, "package.json");
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      versions.package = packageJson.version;
    }
  } catch (error) {
    console.warn("Failed to read package.json version:", error);
  }

  try {
    const manifestPath = join(baseDir, "manifest.json");
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      versions.manifest = manifest.version;
    }
  } catch (error) {
    console.warn("Failed to read manifest.json version:", error);
  }

  try {
    const firefoxManifestPath = join(baseDir, "manifest.firefox.json");
    if (existsSync(firefoxManifestPath)) {
      const firefoxManifest = JSON.parse(
        readFileSync(firefoxManifestPath, "utf8"),
      );
      versions.firefox = firefoxManifest.version;
    }
  } catch (error) {
    console.warn("Failed to read manifest.firefox.json version:", error);
  }

  return versions;
}

/**
 * Check if the target version has already been applied to all version files
 */
export function checkVersionAlreadyBumped(
  targetVersion: string,
  baseDir: string = process.cwd(),
): boolean {
  const versions = getCurrentVersions(baseDir);

  // All version files must contain the target version
  return (
    versions.package === targetVersion &&
    versions.manifest === targetVersion &&
    versions.firefox === targetVersion
  );
}
