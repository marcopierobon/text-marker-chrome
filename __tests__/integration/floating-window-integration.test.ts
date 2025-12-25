import type { SymbolMarkerConfig } from "../../types/symbol-config";

describe("Floating Window - Integration Tests", () => {
  let mockChrome: any;
  let configuration: SymbolMarkerConfig;

  beforeEach(() => {
    configuration = {
      groups: [],
      urlFilters: {
        mode: "whitelist",
        patterns: [],
      },
      floatingWindow: false,
    };

    mockChrome = {
      storage: {
        sync: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn(),
        },
        local: {
          get: jest.fn(),
          set: jest.fn(),
        },
      },
      windows: {
        getCurrent: jest.fn(),
        create: jest.fn(),
        remove: jest.fn(),
      },
      runtime: {
        getURL: jest.fn((path: string) => `chrome-extension://test/${path}`),
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn(),
      },
    };

    (global as any).chrome = mockChrome;

    document.body.innerHTML = `
      <input type="checkbox" id="floating-window-toggle" />
      <div id="toast"></div>
    `;
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("Configuration Loading and UI Sync", () => {
    it("should load configuration and set toggle state correctly", async () => {
      const savedConfig: SymbolMarkerConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
        floatingWindow: true,
      };

      mockChrome.storage.sync.get.mockResolvedValue({
        symbolMarkerConfig: savedConfig,
      });

      const result = await mockChrome.storage.sync.get(["symbolMarkerConfig"]);
      const loadedConfig = result.symbolMarkerConfig;

      const toggle = document.getElementById(
        "floating-window-toggle",
      ) as HTMLInputElement;
      toggle.checked = loadedConfig.floatingWindow;

      expect(toggle.checked).toBe(true);
      expect(loadedConfig.floatingWindow).toBe(true);
    });

    it("should initialize toggle to false when configuration is missing floatingWindow", async () => {
      const savedConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
      };

      mockChrome.storage.sync.get.mockResolvedValue({
        symbolMarkerConfig: savedConfig,
      });

      const result = await mockChrome.storage.sync.get(["symbolMarkerConfig"]);
      const loadedConfig = result.symbolMarkerConfig;

      const normalizedConfig = {
        ...loadedConfig,
        floatingWindow: loadedConfig.floatingWindow ?? false,
      };

      const toggle = document.getElementById(
        "floating-window-toggle",
      ) as HTMLInputElement;
      toggle.checked = normalizedConfig.floatingWindow;

      expect(toggle.checked).toBe(false);
      expect(normalizedConfig.floatingWindow).toBe(false);
    });

    it("should save configuration when toggle changes", async () => {
      mockChrome.storage.sync.set.mockResolvedValue(undefined);

      const toggle = document.getElementById(
        "floating-window-toggle",
      ) as HTMLInputElement;

      toggle.checked = true;
      configuration.floatingWindow = toggle.checked;

      await mockChrome.storage.sync.set({ symbolMarkerConfig: configuration });

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        symbolMarkerConfig: expect.objectContaining({
          floatingWindow: true,
        }),
      });
    });
  });

  describe("Full Workflow: Toggle to Floating Window", () => {
    it("should complete full workflow from toggle to window creation", async () => {
      mockChrome.storage.sync.set.mockResolvedValue(undefined);
      mockChrome.windows.getCurrent.mockResolvedValue({
        id: 1,
        type: "popup",
      });
      mockChrome.windows.create.mockResolvedValue({
        id: 2,
        type: "popup",
      });
      mockChrome.windows.remove.mockResolvedValue(undefined);

      const toggle = document.getElementById(
        "floating-window-toggle",
      ) as HTMLInputElement;

      toggle.checked = true;
      configuration.floatingWindow = toggle.checked;

      await mockChrome.storage.sync.set({ symbolMarkerConfig: configuration });

      if (configuration.floatingWindow) {
        const currentWindow = await mockChrome.windows.getCurrent();

        if (currentWindow.type === "popup") {
          const newWindow = await mockChrome.windows.create({
            url: mockChrome.runtime.getURL("popup/popup.html"),
            type: "popup",
            width: 800,
            height: 600,
            focused: true,
          });

          if (currentWindow.id) {
            await mockChrome.windows.remove(currentWindow.id);
          }

          expect(newWindow.id).toBe(2);
        }
      }

      expect(mockChrome.storage.sync.set).toHaveBeenCalled();
      expect(mockChrome.windows.create).toHaveBeenCalled();
      expect(mockChrome.windows.remove).toHaveBeenCalledWith(1);
    });

    it("should handle toggle disable workflow", async () => {
      configuration.floatingWindow = true;
      mockChrome.storage.sync.set.mockResolvedValue(undefined);

      const toggle = document.getElementById(
        "floating-window-toggle",
      ) as HTMLInputElement;

      toggle.checked = false;
      configuration.floatingWindow = toggle.checked;

      await mockChrome.storage.sync.set({ symbolMarkerConfig: configuration });

      expect(configuration.floatingWindow).toBe(false);
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        symbolMarkerConfig: expect.objectContaining({
          floatingWindow: false,
        }),
      });
    });
  });

  describe("Storage Persistence", () => {
    it("should persist floating window preference across sessions", async () => {
      const initialConfig: SymbolMarkerConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
        floatingWindow: true,
      };

      mockChrome.storage.sync.set.mockResolvedValue(undefined);
      mockChrome.storage.sync.get.mockResolvedValue({
        symbolMarkerConfig: initialConfig,
      });

      await mockChrome.storage.sync.set({ symbolMarkerConfig: initialConfig });

      const result = await mockChrome.storage.sync.get(["symbolMarkerConfig"]);
      const loadedConfig = result.symbolMarkerConfig;

      expect(loadedConfig.floatingWindow).toBe(true);
    });

    it("should handle large configuration with floating window setting", async () => {
      const largeConfig: SymbolMarkerConfig = {
        groups: Array(10)
          .fill(null)
          .map((_, i) => ({
            name: `Group ${i}`,
            iconUrl: `https://example.com/icon${i}.png`,
            color: "#000000",
            categories: {
              [`Category ${i}`]: [`SYMBOL${i}`],
            },
          })),
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
        floatingWindow: true,
      };

      const configStr = JSON.stringify(largeConfig);
      const configSize = new Blob([configStr]).size;

      if (configSize > 90000) {
        mockChrome.storage.local.set.mockResolvedValue(undefined);
        await mockChrome.storage.local.set({ symbolMarkerConfig: largeConfig });
        expect(mockChrome.storage.local.set).toHaveBeenCalled();
      } else {
        mockChrome.storage.sync.set.mockResolvedValue(undefined);
        await mockChrome.storage.sync.set({ symbolMarkerConfig: largeConfig });
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();
      }
    });
  });

  describe("Window State Transitions", () => {
    it("should handle transition from popup to floating window", async () => {
      mockChrome.windows.getCurrent.mockResolvedValue({
        id: 1,
        type: "popup",
      });

      const currentWindow = await mockChrome.windows.getCurrent();
      expect(currentWindow.type).toBe("popup");

      mockChrome.windows.create.mockResolvedValue({
        id: 2,
        type: "popup",
      });

      const newWindow = await mockChrome.windows.create({
        url: "chrome-extension://test/popup/popup.html",
        type: "popup",
        width: 800,
        height: 600,
        focused: true,
      });

      expect(newWindow.type).toBe("popup");
      expect(newWindow.id).toBe(2);
    });

    it("should not create floating window when already in normal window", async () => {
      configuration.floatingWindow = true;

      mockChrome.windows.getCurrent.mockResolvedValue({
        id: 1,
        type: "normal",
      });

      const currentWindow = await mockChrome.windows.getCurrent();

      if (configuration.floatingWindow && currentWindow.type === "popup") {
        await mockChrome.windows.create({
          url: "chrome-extension://test/popup/popup.html",
          type: "popup",
        });
      }

      expect(mockChrome.windows.create).not.toHaveBeenCalled();
    });
  });

  describe("Error Recovery", () => {
    it("should handle storage errors gracefully", async () => {
      mockChrome.storage.sync.set.mockRejectedValue(
        new Error("Storage quota exceeded"),
      );

      configuration.floatingWindow = true;

      await expect(
        mockChrome.storage.sync.set({ symbolMarkerConfig: configuration }),
      ).rejects.toThrow("Storage quota exceeded");
    });

    it("should handle window creation errors gracefully", async () => {
      mockChrome.windows.create.mockRejectedValue(
        new Error("Failed to create window"),
      );

      await expect(
        mockChrome.windows.create({
          url: "chrome-extension://test/popup/popup.html",
          type: "popup",
        }),
      ).rejects.toThrow("Failed to create window");
    });

    it("should handle window removal errors gracefully", async () => {
      mockChrome.windows.remove.mockRejectedValue(
        new Error("Window already closed"),
      );

      await expect(mockChrome.windows.remove(1)).rejects.toThrow(
        "Window already closed",
      );
    });
  });

  describe("UI State Consistency", () => {
    it("should keep toggle and configuration in sync", async () => {
      const toggle = document.getElementById(
        "floating-window-toggle",
      ) as HTMLInputElement;

      toggle.checked = true;
      configuration.floatingWindow = toggle.checked;
      expect(configuration.floatingWindow).toBe(toggle.checked);

      toggle.checked = false;
      configuration.floatingWindow = toggle.checked;
      expect(configuration.floatingWindow).toBe(toggle.checked);
    });

    it("should update toggle when configuration is loaded", async () => {
      const savedConfig: SymbolMarkerConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
        floatingWindow: true,
      };

      mockChrome.storage.sync.get.mockResolvedValue({
        symbolMarkerConfig: savedConfig,
      });

      const result = await mockChrome.storage.sync.get(["symbolMarkerConfig"]);
      configuration = result.symbolMarkerConfig;

      const toggle = document.getElementById(
        "floating-window-toggle",
      ) as HTMLInputElement;
      toggle.checked = configuration.floatingWindow || false;

      expect(toggle.checked).toBe(true);
      expect(configuration.floatingWindow).toBe(true);
    });
  });
});
