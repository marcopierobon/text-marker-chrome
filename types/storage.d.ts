// Type definitions for storage service

export interface StorageData {
  [key: string]: unknown;
}

export interface ChromeStorageResult {
  [key: string]: unknown;
}

export type StorageArea = "sync" | "local";
