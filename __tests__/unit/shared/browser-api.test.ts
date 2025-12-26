// Unit tests for browser-api polyfill
// Tests that the polyfill correctly abstracts Chrome and Firefox API differences
import {
  jest,
  beforeEach,
  describe,
  test,
  expect,
  afterEach,
} from "@jest/globals";

describe("Browser API Polyfill", () => {
  // Test with both Chrome and Firefox
  describe("Chrome browser", () => {
    beforeEach(() => {
      // Setup Chrome API
      (global as any).chrome = {
        storage: {
          sync: { get: jest.fn(), set: jest.fn() },
          local: { get: jest.fn(), set: jest.fn() },
        },
        runtime: {
          sendMessage: jest.fn(),
          getURL: jest.fn((path: string) => `chrome-extension://test/${path}`),
        },
        tabs: { query: jest.fn(), sendMessage: jest.fn() },
        windows: { getCurrent: jest.fn(), create: jest.fn() },
      };
      delete (global as any).browser;

      // Clear module cache to reload polyfill
      jest.resetModules();
    });

    afterEach(() => {
      delete (global as any).chrome;
      jest.resetModules();
    });

    test("exports chrome.storage as storage", async () => {
      const { storage } = await import("../../../shared/browser-api");
      expect(storage).toBe((global as any).chrome.storage);
    });

    test("exports chrome.runtime as runtime", async () => {
      const { runtime } = await import("../../../shared/browser-api");
      expect(runtime).toBe((global as any).chrome.runtime);
    });

    test("exports chrome.tabs as tabs", async () => {
      const { tabs } = await import("../../../shared/browser-api");
      expect(tabs.query).toBe((global as any).chrome.tabs.query);
      expect(tabs.sendMessage).toBe((global as any).chrome.tabs.sendMessage);
    });

    test("getURL helper uses chrome.runtime.getURL", async () => {
      const { getURL } = await import("../../../shared/browser-api");
      const result = getURL("popup/popup.html");
      expect(result).toBe("chrome-extension://test/popup/popup.html");
    });

    test("exports chrome.windows as windows", async () => {
      const { windows } = await import("../../../shared/browser-api");
      expect(windows).toBe((global as any).chrome.windows);
    });

    test("exports chrome.permissions as permissions", async () => {
      (global as any).chrome.permissions = { request: jest.fn() };
      jest.resetModules();
      const { permissions } = await import("../../../shared/browser-api");
      expect(permissions).toBe((global as any).chrome.permissions);
    });

    test("exports chrome.scripting as scripting", async () => {
      (global as any).chrome.scripting = { executeScript: jest.fn() };
      jest.resetModules();
      const { scripting } = await import("../../../shared/browser-api");
      expect(scripting).toBe((global as any).chrome.scripting);
    });

    test("exports chrome.action as action", async () => {
      (global as any).chrome.action = { setBadgeText: jest.fn() };
      jest.resetModules();
      const { action } = await import("../../../shared/browser-api");
      expect(action).toBe((global as any).chrome.action);
    });
  });

  describe("Firefox browser", () => {
    beforeEach(() => {
      // Setup Firefox API (browser namespace)
      (global as any).browser = {
        storage: {
          sync: { get: jest.fn(), set: jest.fn() },
          local: { get: jest.fn(), set: jest.fn() },
        },
        runtime: {
          sendMessage: jest.fn(),
          getURL: jest.fn((path: string) => `moz-extension://test/${path}`),
        },
        tabs: { query: jest.fn(), sendMessage: jest.fn() },
        windows: { getCurrent: jest.fn(), create: jest.fn() },
      };
      delete (global as any).chrome;

      // Clear module cache to reload polyfill
      jest.resetModules();
    });

    afterEach(() => {
      delete (global as any).browser;
      jest.resetModules();
    });

    test("exports browser.storage as storage", async () => {
      const { storage } = await import("../../../shared/browser-api");
      expect(storage).toBe((global as any).browser.storage);
    });

    test("exports browser.runtime as runtime", async () => {
      const { runtime } = await import("../../../shared/browser-api");
      expect(runtime).toBe((global as any).browser.runtime);
    });

    test("exports browser.tabs as tabs", async () => {
      const { tabs } = await import("../../../shared/browser-api");
      expect(tabs.query).toBe((global as any).browser.tabs.query);
      expect(tabs.sendMessage).toBe((global as any).browser.tabs.sendMessage);
    });

    test("getURL helper uses browser.runtime.getURL", async () => {
      const { getURL } = await import("../../../shared/browser-api");
      const result = getURL("popup/popup.html");
      expect(result).toBe("moz-extension://test/popup/popup.html");
    });

    test("exports browser.windows as windows", async () => {
      const { windows } = await import("../../../shared/browser-api");
      expect(windows).toBe((global as any).browser.windows);
    });

    test("exports browser.permissions as permissions", async () => {
      (global as any).browser.permissions = { request: jest.fn() };
      jest.resetModules();
      const { permissions } = await import("../../../shared/browser-api");
      expect(permissions).toBe((global as any).browser.permissions);
    });

    test("exports browser.scripting as scripting", async () => {
      (global as any).browser.scripting = { executeScript: jest.fn() };
      jest.resetModules();
      const { scripting } = await import("../../../shared/browser-api");
      expect(scripting).toBe((global as any).browser.scripting);
    });

    test("exports browser.action as action", async () => {
      (global as any).browser.action = { setBadgeText: jest.fn() };
      jest.resetModules();
      const { action } = await import("../../../shared/browser-api");
      expect(action).toBe((global as any).browser.action);
    });
  });

  describe("systemDisplay fallback", () => {
    describe("Chrome with system.display", () => {
      beforeEach(() => {
        (global as any).chrome = {
          system: {
            display: {
              getInfo: (jest.fn() as jest.Mock<any>).mockResolvedValue([
                { workArea: { height: 1080, width: 1920 } },
              ]),
            },
          },
        };
        delete (global as any).browser;
        jest.resetModules();
      });

      afterEach(() => {
        delete (global as any).chrome;
        jest.resetModules();
      });

      test("uses chrome.system.display.getInfo", async () => {
        const { systemDisplay } = await import("../../../shared/browser-api");
        const result = await systemDisplay.getInfo();

        expect(result).toEqual([{ workArea: { height: 1080, width: 1920 } }]);
        expect(
          (global as any).chrome.system.display.getInfo,
        ).toHaveBeenCalled();
      });
    });

    describe("Firefox without system.display", () => {
      beforeEach(() => {
        (global as any).browser = {};
        delete (global as any).chrome;
        jest.resetModules();
      });

      afterEach(() => {
        delete (global as any).browser;
        jest.resetModules();
      });

      test("falls back to window.screen (returns 0 in test environment)", async () => {
        const { systemDisplay } = await import("../../../shared/browser-api");
        const result = await systemDisplay.getInfo();

        // In Node.js test environment, window.screen returns 0
        // In real Firefox, this would return actual screen dimensions
        expect(result).toEqual([{ workArea: { height: 0, width: 0 } }]);
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty("workArea");
      });
    });
  });
});
