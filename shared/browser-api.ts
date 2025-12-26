/**
 * Browser API Polyfill
 *
 * Provides a unified API that works across Chrome and Firefox.
 * Firefox uses the 'browser' namespace with Promises.
 * Chrome uses the 'chrome' namespace with callbacks (but also supports Promises in MV3).
 *
 * Provides a unified interface for Chrome and Firefox extension APIs
 * Supports dependency injection for testing
 */

// Detect which browser API is available
const getBrowserAPI = () =>
  typeof (globalThis as { browser?: unknown }).browser !== "undefined"
    ? (globalThis as { browser?: unknown }).browser
    : chrome;

const browserAPI = getBrowserAPI();

// Browser API interface for dependency injection
export interface BrowserAPI {
  storage: typeof chrome.storage;
  runtime: typeof chrome.runtime;
  tabs: typeof chrome.tabs;
  windows: typeof chrome.windows;
  permissions: typeof chrome.permissions;
  scripting: typeof chrome.scripting;
  action: typeof chrome.action;
  systemDisplay: {
    getInfo(): Promise<Array<{ workArea: { height: number; width: number } }>>;
  };
  getURL(path: string): string;
}

// Create the browser API implementation
function createBrowserAPI(
  apiGetter: () => unknown = () => getBrowserAPI(),
): BrowserAPI {
  const api = apiGetter() as typeof chrome;
  return {
    get storage() {
      return api.storage;
    },
    get runtime() {
      return api.runtime;
    },
    get tabs() {
      return api.tabs;
    },
    get windows() {
      return api.windows;
    },
    get permissions() {
      return api.permissions;
    },
    get scripting() {
      return api.scripting;
    },
    get action() {
      return api.action;
    },

    // Helper to get extension URLs (works in both browsers)
    getURL(path: string): string {
      return api.runtime.getURL(path);
    },

    // System display is Chrome-only, provide fallback for Firefox
    systemDisplay: {
      getInfo: async (): Promise<
        Array<{ workArea: { height: number; width: number } }>
      > => {
        // Chrome has chrome.system.display
        if (typeof chrome !== "undefined" && chrome.system?.display) {
          return chrome.system.display.getInfo();
        }

        // Firefox fallback: use window.screen
        return [
          {
            workArea: {
              height: window.screen.availHeight,
              width: window.screen.availWidth,
            },
          },
        ];
      },
    },
  };
}

// Default instance using the detected browser API
const defaultAPI = createBrowserAPI();

// Export individual APIs for backward compatibility
export const storage = defaultAPI.storage;
export const runtime = defaultAPI.runtime;
export const tabs = new Proxy(
  {},
  {
    get: (_target, prop) =>
      (
        (getBrowserAPI() as typeof chrome).tabs as Record<
          string | symbol,
          unknown
        >
      )[prop],
  },
) as typeof chrome.tabs;
export const windows = defaultAPI.windows;
export const permissions = defaultAPI.permissions;
export const scripting = defaultAPI.scripting;
export const action = defaultAPI.action;
export const systemDisplay = defaultAPI.systemDisplay;
export const getURL = defaultAPI.getURL;

// Export factory function for dependency injection
export { createBrowserAPI };

export default browserAPI;
