/**
 * Mock tabs helper for integration tests using dependency injection
 */
import { jest } from "@jest/globals";
import type { BrowserAPI } from "../../shared/browser-api";

/**
 * Lightweight mock tabs matching BrowserAPI["tabs"] shape.
 */
export const createMockTabs = (): BrowserAPI["tabs"] =>
  ({
    query: jest.fn(),
    sendMessage: jest.fn(),
    update: jest.fn(),
  }) as unknown as BrowserAPI["tabs"];
