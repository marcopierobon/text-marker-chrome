// Chrome storage service wrapper

import { STORAGE_SIZE_LIMIT } from "./constants";
import { createLogger } from "./logger";
import type { StorageData, ChromeStorageResult } from "../types/storage";
import type { SymbolMarkerConfig } from "../types/symbol-config";
import { storage as defaultStorage, type BrowserAPI } from "./browser-api";

const log = createLogger("StorageService");

export class StorageService {
  private static _storage: BrowserAPI["storage"] | null = null;

  /**
   * Get the storage API (uses injected API if set, otherwise defaults to polyfill)
   */
  private static get storage(): BrowserAPI["storage"] {
    return this._storage || defaultStorage;
  }

  /**
   * Set the storage API for dependency injection (primarily for testing)
   */
  static setStorageAPI(api: BrowserAPI["storage"]) {
    this._storage = api;
  }

  /**
   * Reset to default storage API
   */
  static resetStorageAPI() {
    this._storage = null;
  }

  /**
   * Load configuration from storage (tries sync first, then local)
   * @returns The stored configuration or null if not found
   */
  static async loadConfiguration(): Promise<SymbolMarkerConfig | null> {
    return this.load<SymbolMarkerConfig>("symbolMarkerConfig");
  }

  /**
   * Save configuration to storage (uses sync if small enough, otherwise local)
   * @param configuration - The configuration to save
   * @returns Success status
   */
  static async saveConfiguration(
    configuration: SymbolMarkerConfig,
  ): Promise<boolean> {
    return this.save("symbolMarkerConfig", configuration);
  }

  /**
   * Load data from Chrome storage (tries sync first, then local)
   * @param key - The key to load
   * @returns The stored data or null if not found
   */
  static async load<T = unknown>(key: string): Promise<T | null> {
    try {
      // Try sync storage first
      let result: ChromeStorageResult = await this.storage.sync.get([key]);

      if (result[key]) {
        log.info("Loaded from sync storage");
        return result[key] as T;
      }

      // Fallback to local storage
      result = await this.storage.local.get([key]);

      if (result[key]) {
        log.info("Loaded from local storage");
        return result[key] as T;
      }

      return null;
    } catch (error) {
      log.error("Error loading from storage:", error);
      throw error;
    }
  }

  /**
   * Save data to Chrome storage (uses sync if small enough, otherwise local)
   * @param key - The key to save under
   * @param data - The data to save
   * @returns Success status
   */
  static async save(key: string, data: unknown): Promise<boolean> {
    try {
      const storageData: StorageData = { [key]: data };
      const dataSize = JSON.stringify(storageData).length;

      if (dataSize > STORAGE_SIZE_LIMIT) {
        log.warn(
          `Data size (${dataSize}) exceeds sync storage limit, using local storage`,
        );
        await this.storage.local.set(storageData);
        await this.storage.sync.remove([key]);
        log.info("Saved to local storage");
        return true;
      } else {
        try {
          await this.storage.sync.set(storageData);
          log.info("Saved to sync storage");
          return true;
        } catch (syncError) {
          log.error("Error saving to sync storage:", syncError);
          // Fallback to local storage
          await this.storage.local.set(storageData);
          log.info("Saved to local storage (fallback)");
          return true;
        }
      }
    } catch (error) {
      log.error("Error saving to local storage:", error);
      throw error;
    }
  }

  /**
   * Remove data from Chrome storage (removes from both sync and local)
   * @param key - The key to remove
   * @returns Success status
   */
  static async remove(key: string): Promise<boolean> {
    try {
      await this.storage.sync.remove([key]);
      await this.storage.local.remove([key]);
      log.info(`Removed ${key} from storage`);
      return true;
    } catch (error) {
      log.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all data from Chrome storage (clears both sync and local)
   * @returns Success status
   */
  static async clear(): Promise<boolean> {
    try {
      await this.storage.sync.clear();
      await this.storage.local.clear();
      log.info("Cleared all storage");
      return true;
    } catch (error) {
      log.error("Error clearing storage:", error);
      throw error;
    }
  }
}
