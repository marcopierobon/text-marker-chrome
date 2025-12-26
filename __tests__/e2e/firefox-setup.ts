/**
 * Firefox E2E Test Setup
 * Creates policies.json for loading extension in Firefox via Playwright
 */

import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the extension ID from manifest.json
 */
export function getFirefoxExtensionId(): string {
  const manifestPath = path.join(__dirname, "../../dist/firefox/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  const extensionId = manifest.browser_specific_settings?.gecko?.id;

  if (!extensionId) {
    throw new Error(
      "Firefox extension ID not found in manifest.json. " +
        "Ensure browser_specific_settings.gecko.id is set in manifest.firefox.json",
    );
  }

  return extensionId;
}

/**
 * Create a .xpi file from the Firefox extension directory
 */
export function createXpiFile(): string {
  const distDir = path.join(__dirname, "../../dist/firefox");
  const xpiPath = path.join(os.tmpdir(), "text-marker-extension.xpi");

  // Remove existing XPI if it exists
  if (fs.existsSync(xpiPath)) {
    fs.unlinkSync(xpiPath);
  }

  // Create XPI (which is just a ZIP file with .xpi extension)
  try {
    execSync(`cd "${distDir}" && zip -r "${xpiPath}" .`, { stdio: "pipe" });
  } catch (error) {
    throw new Error(`Failed to create XPI file: ${error}`);
  }

  if (!fs.existsSync(xpiPath)) {
    throw new Error("XPI file was not created");
  }

  return xpiPath;
}

/**
 * Create Firefox policies.json file for extension installation
 */
export function createFirefoxPolicies(): string {
  const extensionId = getFirefoxExtensionId();
  const xpiPath = createXpiFile();
  const policiesPath = path.join(os.tmpdir(), "firefox-policies.json");

  const policies = {
    policies: {
      ExtensionSettings: {
        [extensionId]: {
          installation_mode: "force_installed",
          install_url: `file://${xpiPath}`,
        },
      },
    },
  };

  fs.writeFileSync(policiesPath, JSON.stringify(policies, null, 2));

  console.log("✅ Created Firefox policies.json:", policiesPath);
  console.log("📦 Extension ID:", extensionId);
  console.log("📁 XPI file:", xpiPath);

  return policiesPath;
}

/**
 * Clean up temporary files
 */
export function cleanupFirefoxFiles(): void {
  const xpiPath = path.join(os.tmpdir(), "text-marker-extension.xpi");
  const policiesPath = path.join(os.tmpdir(), "firefox-policies.json");

  if (fs.existsSync(xpiPath)) {
    fs.unlinkSync(xpiPath);
  }

  if (fs.existsSync(policiesPath)) {
    fs.unlinkSync(policiesPath);
  }
}
