// Unit tests for StorageService
import { jest, beforeEach, describe, test, expect } from '@jest/globals';
import { StorageService } from '../../shared/storage-service.js';

// Mock Chrome storage API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  }
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('StorageService', () => {
  describe('load', () => {
    test('loads from sync storage first', async () => {
      const mockData = { key: 'testKey', value: 'testValue' };
      chrome.storage.sync.get.mockResolvedValue({ testKey: mockData });

      const result = await StorageService.load('testKey');

      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['testKey']);
      expect(chrome.storage.local.get).not.toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    test('falls back to local storage if not in sync', async () => {
      const mockData = { key: 'testKey', value: 'testValue' };
      chrome.storage.sync.get.mockResolvedValue({});
      chrome.storage.local.get.mockResolvedValue({ testKey: mockData });

      const result = await StorageService.load('testKey');

      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['testKey']);
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['testKey']);
      expect(result).toEqual(mockData);
    });

    test('returns null if not found in either storage', async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      chrome.storage.local.get.mockResolvedValue({});

      const result = await StorageService.load('testKey');

      expect(result).toBeNull();
    });

    test('throws error on storage failure', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));

      await expect(StorageService.load('testKey')).rejects.toThrow('Storage error');
    });
  });

  describe('save', () => {
    test('saves to sync storage for small data', async () => {
      const smallData = { test: 'data' };
      chrome.storage.sync.set.mockResolvedValue(undefined);

      const result = await StorageService.save('testKey', smallData);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ testKey: smallData });
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('saves to local storage for large data', async () => {
      // Create data larger than 90KB
      const largeData = { data: 'x'.repeat(100000) };
      chrome.storage.local.set.mockResolvedValue(undefined);
      chrome.storage.sync.remove.mockResolvedValue(undefined);

      const result = await StorageService.save('testKey', largeData);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ testKey: largeData });
      expect(chrome.storage.sync.remove).toHaveBeenCalledWith(['testKey']);
      expect(result).toBe(true);
    });

    test('falls back to local storage on sync failure', async () => {
      const data = { test: 'data' };
      chrome.storage.sync.set.mockRejectedValue(new Error('Quota exceeded'));
      chrome.storage.local.set.mockResolvedValue(undefined);

      const result = await StorageService.save('testKey', data);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ testKey: data });
      expect(result).toBe(true);
    });

    test('throws error if both storages fail', async () => {
      const data = { test: 'data' };
      chrome.storage.sync.set.mockRejectedValue(new Error('Sync error'));
      chrome.storage.local.set.mockRejectedValue(new Error('Local error'));

      await expect(StorageService.save('testKey', data)).rejects.toThrow('Local error');
    });
  });

  describe('remove', () => {
    test('removes from both storages', async () => {
      chrome.storage.sync.remove.mockResolvedValue(undefined);
      chrome.storage.local.remove.mockResolvedValue(undefined);

      const result = await StorageService.remove('testKey');

      expect(chrome.storage.sync.remove).toHaveBeenCalledWith(['testKey']);
      expect(chrome.storage.local.remove).toHaveBeenCalledWith(['testKey']);
      expect(result).toBe(true);
    });

    test('throws error on removal failure', async () => {
      chrome.storage.sync.remove.mockRejectedValue(new Error('Remove error'));

      await expect(StorageService.remove('testKey')).rejects.toThrow('Remove error');
    });
  });

  describe('clear', () => {
    test('clears both storages', async () => {
      chrome.storage.sync.clear.mockResolvedValue(undefined);
      chrome.storage.local.clear.mockResolvedValue(undefined);

      const result = await StorageService.clear();

      expect(chrome.storage.sync.clear).toHaveBeenCalled();
      expect(chrome.storage.local.clear).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('throws error on clear failure', async () => {
      chrome.storage.sync.clear.mockRejectedValue(new Error('Clear error'));

      await expect(StorageService.clear()).rejects.toThrow('Clear error');
    });
  });
});
