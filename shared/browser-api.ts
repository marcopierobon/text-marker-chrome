/**
 * Browser API Polyfill
 * 
 * Provides a unified API that works across Chrome and Firefox.
 * Firefox uses the 'browser' namespace with Promises.
 * Chrome uses the 'chrome' namespace with callbacks (but also supports Promises in MV3).
 * 
 * This polyfill ensures we can use the same code for both browsers.
 */

// Detect which browser API is available
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Export all the APIs we use
export const storage = browserAPI.storage;
export const runtime = browserAPI.runtime;
export const tabs = browserAPI.tabs;
export const permissions = browserAPI.permissions;
export const scripting = browserAPI.scripting;
export const windows = browserAPI.windows;
export const action = browserAPI.action;

// Helper to get extension URL (works for both Chrome and Firefox)
export const getURL = (path: string): string => {
  return browserAPI.runtime.getURL(path);
};

// System display is Chrome-only, provide fallback for Firefox
export const systemDisplay = {
  getInfo: async (): Promise<Array<{ workArea: { height: number; width: number } }>> => {
    // Chrome has chrome.system.display
    if (typeof chrome !== 'undefined' && chrome.system?.display) {
      return chrome.system.display.getInfo();
    }
    
    // Firefox fallback: use window.screen
    return [{
      workArea: {
        height: window.screen.availHeight,
        width: window.screen.availWidth
      }
    }];
  }
};

export default browserAPI;
