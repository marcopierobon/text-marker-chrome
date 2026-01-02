#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

// Get version from command line or package.json
const newVersion = process.argv[2];
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const currentVersion = packageJson.version;

if (!newVersion) {
  console.log("Usage: node scripts/release.js <new-version>");
  console.log(`Current version: ${currentVersion}`);
  console.log("Example: node scripts/release.js 1.0.1");
  process.exit(1);
}

// Validate version format (semantic versioning)
const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;
if (!versionRegex.test(newVersion)) {
  console.error(
    "Invalid version format. Use semantic versioning (e.g., 1.0.0, 1.0.1-beta)",
  );
  process.exit(1);
}

console.log(`Updating version from ${currentVersion} to ${newVersion}...`);

// Update package.json
packageJson.version = newVersion;
writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
console.log("✅ Updated package.json");

// Update Chrome manifest
const chromeManifest = JSON.parse(readFileSync("manifest.json", "utf8"));
chromeManifest.version = newVersion;
writeFileSync("manifest.json", JSON.stringify(chromeManifest, null, 2));
console.log("✅ Updated Chrome manifest.json");

// Update Firefox manifest
const firefoxManifest = JSON.parse(
  readFileSync("manifest.firefox.json", "utf8"),
);
firefoxManifest.version = newVersion;
writeFileSync(
  "manifest.firefox.json",
  JSON.stringify(firefoxManifest, null, 2),
);
console.log("✅ Updated Firefox manifest.firefox.json");

// Run tests
console.log("🧪 Running tests...");
try {
  execSync("npm test", { stdio: "inherit" });
  console.log("✅ All tests passed");
} catch (error) {
  console.error("❌ Tests failed. Aborting release.");
  process.exit(1);
}

// Run build
console.log("🔨 Building extension...");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Build successful");
} catch (error) {
  console.error("❌ Build failed. Aborting release.");
  process.exit(1);
}

// Git operations
console.log("📝 Committing changes...");
try {
  execSync(`git add package.json manifest.json manifest.firefox.json`, {
    stdio: "inherit",
  });
  execSync(`git commit -S -m "chore: bump version to ${newVersion}"`, {
    stdio: "inherit",
  });
  console.log("✅ Changes committed");
} catch (error) {
  console.error("❌ Git commit failed. Aborting release.");
  process.exit(1);
}

// Create and push tag
console.log(`🏷️  Creating tag v${newVersion}...`);
try {
  execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, {
    stdio: "inherit",
  });
  console.log("✅ Tag created");
} catch (error) {
  console.error("❌ Tag creation failed. Aborting release.");
  process.exit(1);
}

console.log(`\n🎉 Release v${newVersion} ready!`);
console.log("\nNext steps:");
console.log(`1. Push changes: git push origin main`);
console.log(`2. Push tag: git push origin v${newVersion}`);
console.log("3. GitHub Actions will automatically publish to Chrome Web Store");
console.log("\n📦 The Chrome Web Store publishing workflow will:");
console.log("   - Build the extension");
console.log("   - Create ZIP file");
console.log("   - Publish to Chrome Web Store");
console.log("   - Create GitHub release");
console.log("   - Upload ZIP as release asset");
