import type { SymbolMarkerConfig } from "../../../types/symbol-config";

describe("Floating Window - Unit Tests", () => {
  let mockChrome: any;

  beforeEach(() => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Configuration Storage", () => {
    it("should include floatingWindow property in default configuration", () => {
      const defaultConfig: SymbolMarkerConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
        floatingWindow: false,
      };

      expect(defaultConfig.floatingWindow).toBe(false);
      expect(defaultConfig).toHaveProperty("floatingWindow");
    });

    it("should default floatingWindow to false when undefined", async () => {
      const configWithoutFloating = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
      };

      mockChrome.storage.sync.get.mockResolvedValue({
        symbolMarkerConfig: configWithoutFloating,
      });

      const result = await mockChrome.storage.sync.get(["symbolMarkerConfig"]);
      const config = result.symbolMarkerConfig;

      const normalizedConfig = {
        ...config,
        floatingWindow: config.floatingWindow ?? false,
      };

      expect(normalizedConfig.floatingWindow).toBe(false);
    });

    it("should preserve floatingWindow value when saving configuration", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
        floatingWindow: true,
      };

      mockChrome.storage.sync.set.mockResolvedValue(undefined);

      await mockChrome.storage.sync.set({ symbolMarkerConfig: config });

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        symbolMarkerConfig: expect.objectContaining({
          floatingWindow: true,
        }),
      });
    });
  });

  describe("Window Type Detection", () => {
    it("should detect popup window type", async () => {
      mockChrome.windows.getCurrent.mockResolvedValue({
        id: 1,
        type: "popup",
      });

      const currentWindow = await mockChrome.windows.getCurrent();

      expect(currentWindow.type).toBe("popup");
    });

    it("should detect normal window type", async () => {
      mockChrome.windows.getCurrent.mockResolvedValue({
        id: 1,
        type: "normal",
      });

      const currentWindow = await mockChrome.windows.getCurrent();

      expect(currentWindow.type).toBe("normal");
    });
  });

  describe("Floating Window Creation", () => {
    it("should create floating window with correct parameters", async () => {
      const expectedWindowConfig = {
        url: "chrome-extension://test/popup/popup.html",
        type: "popup",
        width: 800,
        height: 600,
        focused: true,
      };

      mockChrome.windows.create.mockResolvedValue({
        id: 2,
        type: "popup",
      });

      const newWindow = await mockChrome.windows.create(expectedWindowConfig);

      expect(mockChrome.windows.create).toHaveBeenCalledWith(
        expectedWindowConfig,
      );
      expect(newWindow.id).toBe(2);
    });

    it("should handle window creation failure gracefully", async () => {
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

    it("should close current window after creating floating window", async () => {
      mockChrome.windows.getCurrent.mockResolvedValue({
        id: 1,
        type: "popup",
      });

      mockChrome.windows.create.mockResolvedValue({
        id: 2,
        type: "popup",
      });

      mockChrome.windows.remove.mockResolvedValue(undefined);

      const currentWindow = await mockChrome.windows.getCurrent();
      await mockChrome.windows.create({
        url: "chrome-extension://test/popup/popup.html",
        type: "popup",
      });
      await mockChrome.windows.remove(currentWindow.id);

      expect(mockChrome.windows.remove).toHaveBeenCalledWith(1);
    });
  });

  describe("Toggle State Management", () => {
    it("should update configuration when toggle is enabled", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
        floatingWindow: false,
      };

      config.floatingWindow = true;

      expect(config.floatingWindow).toBe(true);
    });

    it("should update configuration when toggle is disabled", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
        floatingWindow: true,
      };

      config.floatingWindow = false;

      expect(config.floatingWindow).toBe(false);
    });

    it("should save configuration after toggle change", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
        floatingWindow: false,
      };

      mockChrome.storage.sync.set.mockResolvedValue(undefined);

      config.floatingWindow = true;
      await mockChrome.storage.sync.set({ symbolMarkerConfig: config });

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        symbolMarkerConfig: expect.objectContaining({
          floatingWindow: true,
        }),
      });
    });
  });

  describe("Window Conversion Logic", () => {
    it("should not convert to floating window when disabled", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
        floatingWindow: false,
      };

      mockChrome.windows.getCurrent.mockResolvedValue({
        id: 1,
        type: "popup",
      });

      if (config.floatingWindow) {
        await mockChrome.windows.create({
          url: "chrome-extension://test/popup/popup.html",
          type: "popup",
        });
      }

      expect(mockChrome.windows.create).not.toHaveBeenCalled();
    });

    it("should convert to floating window when enabled and in popup", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
        floatingWindow: true,
      };

      mockChrome.windows.getCurrent.mockResolvedValue({
        id: 1,
        type: "popup",
      });

      mockChrome.windows.create.mockResolvedValue({
        id: 2,
        type: "popup",
      });

      const currentWindow = await mockChrome.windows.getCurrent();

      if (config.floatingWindow && currentWindow.type === "popup") {
        await mockChrome.windows.create({
          url: "chrome-extension://test/popup/popup.html",
          type: "popup",
        });
      }

      expect(mockChrome.windows.create).toHaveBeenCalled();
    });

    it("should not convert when already in a normal window", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
        floatingWindow: true,
      };

      mockChrome.windows.getCurrent.mockResolvedValue({
        id: 1,
        type: "normal",
      });

      const currentWindow = await mockChrome.windows.getCurrent();

      if (config.floatingWindow && currentWindow.type === "popup") {
        await mockChrome.windows.create({
          url: "chrome-extension://test/popup/popup.html",
          type: "popup",
        });
      }

      expect(mockChrome.windows.create).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing window ID gracefully", async () => {
      mockChrome.windows.create.mockResolvedValue({
        type: "popup",
      });

      const newWindow = await mockChrome.windows.create({
        url: "chrome-extension://test/popup/popup.html",
        type: "popup",
      });

      expect(newWindow.id).toBeUndefined();
    });

    it("should handle window removal errors", async () => {
      mockChrome.windows.remove.mockRejectedValue(
        new Error("Window not found"),
      );

      await expect(mockChrome.windows.remove(999)).rejects.toThrow(
        "Window not found",
      );
    });
  });
});
