/**
 * Mock storage helper for integration tests using dependency injection
 */
import { jest } from "@jest/globals";
import type { BrowserAPI } from "../../shared/browser-api";

/**
 * Lightweight mock storage matching BrowserAPI["storage"] shape.
 * We only mock the methods under test; extra properties are stubbed.
 */
export const createMockStorage = (): BrowserAPI["storage"] =>
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
    // Stub unused properties to satisfy type shape
    managed: {} as any,
    session: {} as any,
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
  }) as unknown as BrowserAPI["storage"];
