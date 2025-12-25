// Unit tests for StorageService
import { jest, beforeEach, describe, test, expect } from "@jest/globals";
import { StorageService } from "../../../shared/storage-service";
import { setupChromeMock } from "../../helpers/chrome-mock";

// Setup Chrome storage API mock
setupChromeMock();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("StorageService", () => {
  describe("load", () => {
    test("loads from sync storage first", async () => {
      const mockData = { key: "testKey", value: "testValue" };
      (chrome.storage.sync.get as any).mockResolvedValue({
        testKey: mockData,
      } as any);

      const result = await StorageService.load("testKey");

      expect(chrome.storage.sync.get).toHaveBeenCalledWith(["testKey"] as any);
      expect(chrome.storage.local.get).not.toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    test("falls back to local storage if not in sync", async () => {
      const mockData = { key: "testKey", value: "testValue" };
      (chrome.storage.sync.get as any).mockResolvedValue({} as any);
      (chrome.storage.local.get as any).mockResolvedValue({
        testKey: mockData,
      } as any);

      const result = await StorageService.load("testKey");

      expect(chrome.storage.sync.get).toHaveBeenCalledWith(["testKey"] as any);
      expect(chrome.storage.local.get).toHaveBeenCalledWith(["testKey"] as any);
      expect(result).toEqual(mockData);
    });

    test("returns null if not found in either storage", async () => {
      (chrome.storage.sync.get as any).mockResolvedValue({} as any);
      (chrome.storage.local.get as any).mockResolvedValue({} as any);

      const result = await StorageService.load("testKey");

      expect(result).toBeNull();
    });

    test("throws error on storage failure", async () => {
      (chrome.storage.sync.get as any).mockRejectedValue(
        new Error("Storage error") as any,
      );

      await expect(StorageService.load("testKey")).rejects.toThrow(
        "Storage error",
      );
    });
  });

  describe("save", () => {
    test("saves to sync storage for small data", async () => {
      const smallData = { test: "data" };
      (chrome.storage.sync.set as any).mockResolvedValue(undefined as any);

      const result = await StorageService.save("testKey", smallData);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        testKey: smallData,
      });
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("saves to local storage for large data", async () => {
      // Create data larger than 90KB
      const largeData = { data: "x".repeat(100000) };
      (chrome.storage.local.set as any).mockResolvedValue(undefined as any);
      (chrome.storage.sync.remove as any).mockResolvedValue(undefined as any);

      const result = await StorageService.save("testKey", largeData);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        testKey: largeData,
      });
      expect(chrome.storage.sync.remove).toHaveBeenCalledWith([
        "testKey",
      ] as any);
      expect(result).toBe(true);
    });

    test("falls back to local storage on sync failure", async () => {
      const data = { test: "data" };
      (chrome.storage.sync.set as any).mockRejectedValue(
        new Error("Quota exceeded") as any,
      );
      (chrome.storage.local.set as any).mockResolvedValue(undefined as any);

      const result = await StorageService.save("testKey", data);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ testKey: data });
      expect(result).toBe(true);
    });

    test("throws error if both storages fail", async () => {
      const data = { test: "data" };
      (chrome.storage.sync.set as any).mockRejectedValue(
        new Error("Sync error") as any,
      );
      (chrome.storage.local.set as any).mockRejectedValue(
        new Error("Local error") as any,
      );

      await expect(StorageService.save("testKey", data)).rejects.toThrow(
        "Local error",
      );
    });
  });

  describe("remove", () => {
    test("removes from both storages", async () => {
      (chrome.storage.sync.remove as any).mockResolvedValue(undefined as any);
      (chrome.storage.local.remove as any).mockResolvedValue(undefined as any);

      const result = await StorageService.remove("testKey");

      expect(chrome.storage.sync.remove).toHaveBeenCalledWith([
        "testKey",
      ] as any);
      expect(chrome.storage.local.remove).toHaveBeenCalledWith([
        "testKey",
      ] as any);
      expect(result).toBe(true);
    });

    test("throws error on removal failure", async () => {
      (chrome.storage.sync.remove as any).mockRejectedValue(
        new Error("Remove error") as any,
      );

      await expect(StorageService.remove("testKey")).rejects.toThrow(
        "Remove error",
      );
    });
  });

  describe("clear", () => {
    test("clears both storages", async () => {
      (chrome.storage.sync.clear as any).mockResolvedValue(undefined as any);
      (chrome.storage.local.clear as any).mockResolvedValue(undefined as any);

      const result = await StorageService.clear();

      expect(chrome.storage.sync.clear).toHaveBeenCalled();
      expect(chrome.storage.local.clear).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("throws error on clear failure", async () => {
      (chrome.storage.sync.clear as any).mockRejectedValue(
        new Error("Clear error") as any,
      );

      await expect(StorageService.clear()).rejects.toThrow("Clear error");
    });
  });
});
