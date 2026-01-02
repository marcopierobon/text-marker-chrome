// Type definitions for storage service

export interface StorageData {
  symbolMarkerConfig?: unknown;
  [key: string]: unknown;
}

export interface ChromeStorageResult {
  symbolMarkerConfig?: unknown;
  [key: string]: unknown;
}

export type StorageArea = "sync" | "local";
