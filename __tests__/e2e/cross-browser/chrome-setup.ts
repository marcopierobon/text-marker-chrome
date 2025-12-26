/**
 * Chrome-specific E2E test setup
 * Handles Chrome extension loading configuration
 */

/**
 * Setup Chrome extension for E2E testing
 * Chrome has a simpler setup compared to Firefox - just needs the extension path
 * and command-line arguments for loading the extension
 *
 * @param extensionPath - Path to the built Chrome extension directory
 * @returns Configuration object with extension path and Chrome arguments
 */
export async function setupChromeExtension(extensionPath: string): Promise<{
  extensionPath: string;
  args: string[];
  cleanup?: () => void;
}> {
  // Chrome extension loading is straightforward - just need the path and args
  const args = [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
    "--no-sandbox",
    "--disable-setuid-sandbox",
  ];

  return {
    extensionPath,
    args,
    // No cleanup needed for Chrome (unlike Firefox which creates temp files)
    cleanup: undefined,
  };
}
