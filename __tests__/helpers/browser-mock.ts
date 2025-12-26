/**
 * Browser API mock helper for testing both Chrome and Firefox
 */

export type BrowserType = "chrome" | "firefox";

export function setupBrowserMock(browserType: BrowserType = "chrome") {
  const mockStorage = {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  };

  const mockRuntime = {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
    getManifest: jest.fn(() => ({ version: "1.0.0" })),
    getURL: jest.fn(
      (path: string) => `${browserType}-extension://test/${path}`,
    ),
  };

  const mockTabs = {
    query: jest.fn(),
    sendMessage: jest.fn(),
    update: jest.fn(),
  };

  const mockWindows = {
    getCurrent: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    getURL: jest.fn(
      (path: string) => `${browserType}-extension://test/${path}`,
    ),
  };

  const mockPermissions = {
    contains: jest.fn(),
    request: jest.fn(),
    remove: jest.fn(),
  };

  const mockScripting = {
    executeScript: jest.fn(),
  };

  const mockAction = {
    onClicked: {
      addListener: jest.fn(),
    },
  };

  const mockAPI = {
    storage: mockStorage,
    runtime: mockRuntime,
    tabs: mockTabs,
    windows: mockWindows,
    permissions: mockPermissions,
    scripting: mockScripting,
    action: mockAction,
  };

  if (browserType === "firefox") {
    // Firefox uses 'browser' namespace
    (global as any).browser = mockAPI;
    // Also set chrome for compatibility
    (global as any).chrome = mockAPI;
  } else {
    // Chrome uses 'chrome' namespace
    (global as any).chrome = mockAPI;
  }

  return mockAPI;
}

export function cleanupBrowserMock() {
  delete (global as any).chrome;
  delete (global as any).browser;
}
