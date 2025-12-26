// Unit tests for StorageService
import {
  jest,
  beforeEach,
  describe,
  test,
  expect,
  afterEach,
} from "@jest/globals";
import { StorageService } from "../../../shared/storage-service";
import type { BrowserAPI } from "../../../shared/browser-api";

// Create mock storage API
const createMockStorage = () =>
  ({
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
  }) as any as BrowserAPI["storage"];

describe("StorageService", () => {
  let mockStorage: any;

  beforeEach(() => {
    mockStorage = createMockStorage() as any;
    StorageService.setStorageAPI(mockStorage);
  });

  afterEach(() => {
    StorageService.resetStorageAPI();
    jest.clearAllMocks();
  });

  describe("load", () => {
    test("loads from sync storage first", async () => {
      const mockData = { key: "testKey", value: "testValue" };
      mockStorage.sync.get.mockResolvedValue({
        testKey: mockData,
      } as any);

      const result = await StorageService.load("testKey");

      expect(mockStorage.sync.get).toHaveBeenCalledWith(["testKey"]);
      expect(mockStorage.local.get).not.toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    test("falls back to local storage if not in sync", async () => {
      const mockData = { key: "testKey", value: "testValue" };
      mockStorage.sync.get.mockResolvedValue({} as any);
      mockStorage.local.get.mockResolvedValue({
        testKey: mockData,
      } as any);

      const result = await StorageService.load("testKey");

      expect(mockStorage.sync.get).toHaveBeenCalledWith(["testKey"]);
      expect(mockStorage.local.get).toHaveBeenCalledWith(["testKey"]);
      expect(result).toEqual(mockData);
    });

    test("returns null if not found in either storage", async () => {
      mockStorage.sync.get.mockResolvedValue({} as any);
      mockStorage.local.get.mockResolvedValue({} as any);

      const result = await StorageService.load("testKey");

      expect(result).toBeNull();
    });

    test("throws error on storage failure", async () => {
      mockStorage.sync.get.mockRejectedValue(new Error("Storage error"));

      await expect(StorageService.load("testKey")).rejects.toThrow(
        "Storage error",
      );
    });
  });

  describe("save", () => {
    test("saves to sync storage for small data", async () => {
      const smallData = { test: "data" };
      mockStorage.sync.set.mockResolvedValue(undefined as any);

      const result = await StorageService.save("testKey", smallData);

      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        testKey: smallData,
      });
      expect(mockStorage.local.set).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("saves to local storage for large data", async () => {
      // Create data larger than 90KB
      const largeData = { data: "x".repeat(100000) };
      mockStorage.local.set.mockResolvedValue(undefined as any);
      mockStorage.sync.remove.mockResolvedValue(undefined as any);

      const result = await StorageService.save("testKey", largeData);

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        testKey: largeData,
      });
      expect(mockStorage.sync.remove).toHaveBeenCalledWith(["testKey"]);
      expect(result).toBe(true);
    });

    test("falls back to local storage on sync failure", async () => {
      const data = { test: "data" };
      mockStorage.sync.set.mockRejectedValue(new Error("Quota exceeded"));
      mockStorage.local.set.mockResolvedValue(undefined as any);

      const result = await StorageService.save("testKey", data);

      expect(mockStorage.local.set).toHaveBeenCalledWith({ testKey: data });
      expect(result).toBe(true);
    });

    test("throws error if both storages fail", async () => {
      const data = { test: "data" };
      mockStorage.sync.set.mockRejectedValue(new Error("Sync error"));
      mockStorage.local.set.mockRejectedValue(new Error("Local error"));

      await expect(StorageService.save("testKey", data)).rejects.toThrow(
        "Local error",
      );
    });
  });

  describe("remove", () => {
    test("removes from both storages", async () => {
      mockStorage.sync.remove.mockResolvedValue(undefined as any);
      mockStorage.local.remove.mockResolvedValue(undefined as any);

      const result = await StorageService.remove("testKey");

      expect(mockStorage.sync.remove).toHaveBeenCalledWith(["testKey"]);
      expect(mockStorage.local.remove).toHaveBeenCalledWith(["testKey"]);
      expect(result).toBe(true);
    });

    test("throws error on removal failure", async () => {
      mockStorage.sync.remove.mockRejectedValue(new Error("Remove error"));

      await expect(StorageService.remove("testKey")).rejects.toThrow(
        "Remove error",
      );
    });
  });

  describe("clear", () => {
    test("clears both storages", async () => {
      mockStorage.sync.clear.mockResolvedValue(undefined as any);
      mockStorage.local.clear.mockResolvedValue(undefined as any);

      const result = await StorageService.clear();

      expect(mockStorage.sync.clear).toHaveBeenCalled();
      expect(mockStorage.local.clear).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("throws error on clear failure", async () => {
      mockStorage.sync.clear.mockRejectedValue(new Error("Clear error"));

      await expect(StorageService.clear()).rejects.toThrow("Clear error");
    });
  });
});
