// Unit tests for constants
import { describe, test, expect } from '@jest/globals';
import {
  ICON_SIZE,
  CHECK_INTERVAL,
  DEBOUNCE_DELAY,
  DEBUG_MODE,
  STORAGE_SIZE_LIMIT,
  TRUSTED_IMAGE_DOMAINS,
  VALID_IMAGE_EXTENSIONS
} from '../../shared/constants.js';

describe('constants', () => {
  describe('numeric constants', () => {
    test('ICON_SIZE is a positive number', () => {
      expect(typeof ICON_SIZE).toBe('number');
      expect(ICON_SIZE).toBeGreaterThan(0);
      expect(ICON_SIZE).toBe(16);
    });

    test('CHECK_INTERVAL is a positive number', () => {
      expect(typeof CHECK_INTERVAL).toBe('number');
      expect(CHECK_INTERVAL).toBeGreaterThan(0);
      expect(CHECK_INTERVAL).toBe(2000);
    });

    test('DEBOUNCE_DELAY is a positive number', () => {
      expect(typeof DEBOUNCE_DELAY).toBe('number');
      expect(DEBOUNCE_DELAY).toBeGreaterThan(0);
      expect(DEBOUNCE_DELAY).toBe(300);
    });

    test('STORAGE_SIZE_LIMIT is a positive number', () => {
      expect(typeof STORAGE_SIZE_LIMIT).toBe('number');
      expect(STORAGE_SIZE_LIMIT).toBeGreaterThan(0);
      expect(STORAGE_SIZE_LIMIT).toBe(90000);
    });
  });

  describe('boolean constants', () => {
    test('DEBUG_MODE is a boolean', () => {
      expect(typeof DEBUG_MODE).toBe('boolean');
    });
  });

  describe('array constants', () => {
    test('TRUSTED_IMAGE_DOMAINS is an array', () => {
      expect(Array.isArray(TRUSTED_IMAGE_DOMAINS)).toBe(true);
      expect(TRUSTED_IMAGE_DOMAINS.length).toBeGreaterThan(0);
    });

    test('TRUSTED_IMAGE_DOMAINS contains expected domains', () => {
      expect(TRUSTED_IMAGE_DOMAINS).toContain('googleusercontent.com');
      expect(TRUSTED_IMAGE_DOMAINS).toContain('githubusercontent.com');
      expect(TRUSTED_IMAGE_DOMAINS).toContain('cloudflare.com');
    });

    test('VALID_IMAGE_EXTENSIONS is an array', () => {
      expect(Array.isArray(VALID_IMAGE_EXTENSIONS)).toBe(true);
      expect(VALID_IMAGE_EXTENSIONS.length).toBeGreaterThan(0);
    });

    test('VALID_IMAGE_EXTENSIONS contains expected extensions', () => {
      expect(VALID_IMAGE_EXTENSIONS).toContain('.png');
      expect(VALID_IMAGE_EXTENSIONS).toContain('.jpg');
      expect(VALID_IMAGE_EXTENSIONS).toContain('.jpeg');
      expect(VALID_IMAGE_EXTENSIONS).toContain('.svg');
      expect(VALID_IMAGE_EXTENSIONS).toContain('.webp');
      expect(VALID_IMAGE_EXTENSIONS).toContain('.ico');
    });

    test('all extensions start with a dot', () => {
      VALID_IMAGE_EXTENSIONS.forEach(ext => {
        expect(ext.startsWith('.')).toBe(true);
      });
    });
  });

  describe('constant immutability', () => {
    test('constants are exported correctly', () => {
      expect(ICON_SIZE).toBeDefined();
      expect(CHECK_INTERVAL).toBeDefined();
      expect(DEBOUNCE_DELAY).toBeDefined();
      expect(DEBUG_MODE).toBeDefined();
      expect(STORAGE_SIZE_LIMIT).toBeDefined();
      expect(TRUSTED_IMAGE_DOMAINS).toBeDefined();
      expect(VALID_IMAGE_EXTENSIONS).toBeDefined();
    });
  });

  describe('reasonable value ranges', () => {
    test('ICON_SIZE is reasonable for UI', () => {
      expect(ICON_SIZE).toBeGreaterThanOrEqual(12);
      expect(ICON_SIZE).toBeLessThanOrEqual(64);
    });

    test('CHECK_INTERVAL is reasonable for polling', () => {
      expect(CHECK_INTERVAL).toBeGreaterThanOrEqual(1000); // At least 1 second
      expect(CHECK_INTERVAL).toBeLessThanOrEqual(10000); // At most 10 seconds
    });

    test('DEBOUNCE_DELAY is reasonable for UI responsiveness', () => {
      expect(DEBOUNCE_DELAY).toBeGreaterThanOrEqual(100); // At least 100ms
      expect(DEBOUNCE_DELAY).toBeLessThanOrEqual(1000); // At most 1 second
    });

    test('STORAGE_SIZE_LIMIT is below Chrome sync limit', () => {
      expect(STORAGE_SIZE_LIMIT).toBeLessThan(100000); // Chrome sync limit is ~100KB
    });
  });
});
