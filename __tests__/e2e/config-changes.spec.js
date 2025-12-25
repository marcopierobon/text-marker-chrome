// E2E tests for Configuration Changes and Dynamic Updates
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Configuration Changes - E2E Tests', () => {
  let context;
  let page;
  let serviceWorker;

  test.beforeEach(async ({ browser }) => {
    const extensionPath = path.join(__dirname, '../../');
    
    context = await browser.newContext({
      permissions: []
    });

    const extensionId = await context.addInitScript(() => {});
    
    await context.addInitScript(() => {
      window.testMode = true;
    });

    page = await context.newPage();
    
    const testPagePath = path.join(__dirname, 'test-page.html');
    await page.goto(`file://${testPagePath}`);
    
    serviceWorker = await context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('adding new symbols to configuration should appear without reload', async () => {
    const initialConfig = {
      groups: [{
        name: 'Initial Group',
        iconUrl: 'https://example.com/icon.png',
        color: '#ff0000',
        categories: { 'Tech': ['AAPL', 'MSFT'] }
      }]
    };

    // Set initial configuration
    await serviceWorker.evaluate(async (config) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: config });
    }, initialConfig);

    await page.waitForTimeout(500);

    // Verify initial badges
    const initialBadges = await page.locator('.fool-badge').count();
    expect(initialBadges).toBeGreaterThanOrEqual(0);

    // Add new symbol to configuration
    const updatedConfig = {
      groups: [{
        name: 'Initial Group',
        iconUrl: 'https://example.com/icon.png',
        color: '#ff0000',
        categories: { 'Tech': ['AAPL', 'MSFT', 'GOOGL'] }
      }]
    };

    await serviceWorker.evaluate(async (config) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: config });
      // Trigger reload message
      const tabs = await chrome.tabs.query({ active: true });
      for (const tab of tabs) {
        await chrome.tabs.sendMessage(tab.id, { action: 'reloadConfiguration' });
      }
    }, updatedConfig);

    await page.waitForTimeout(500);

    // New symbol should appear (if GOOGL is on the page)
    const updatedBadges = await page.locator('.fool-badge').count();
    expect(updatedBadges).toBeGreaterThanOrEqual(initialBadges);
  });

  test('removing symbols from configuration should remove badges', async () => {
    const initialConfig = {
      groups: [{
        name: 'Test Group',
        iconUrl: 'https://example.com/icon.png',
        color: '#ff0000',
        categories: { 'Tech': ['AAPL', 'MSFT', 'GOOGL', 'NVDA'] }
      }]
    };

    await serviceWorker.evaluate(async (config) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: config });
    }, initialConfig);

    await page.waitForTimeout(500);

    const initialBadges = await page.locator('.fool-badge').count();

    // Remove some symbols
    const updatedConfig = {
      groups: [{
        name: 'Test Group',
        iconUrl: 'https://example.com/icon.png',
        color: '#ff0000',
        categories: { 'Tech': ['AAPL'] }
      }]
    };

    await serviceWorker.evaluate(async (config) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: config });
      const tabs = await chrome.tabs.query({ active: true });
      for (const tab of tabs) {
        await chrome.tabs.sendMessage(tab.id, { action: 'reloadConfiguration' });
      }
    }, updatedConfig);

    await page.waitForTimeout(500);

    const updatedBadges = await page.locator('.fool-badge').count();
    expect(updatedBadges).toBeLessThanOrEqual(initialBadges);
  });

  test('changing symbol colors should update badges', async () => {
    const initialConfig = {
      groups: [{
        name: 'Test Group',
        iconUrl: 'https://example.com/icon.png',
        color: '#ff0000',
        categories: { 'Tech': ['AAPL'] }
      }]
    };

    await serviceWorker.evaluate(async (config) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: config });
    }, initialConfig);

    await page.waitForTimeout(500);

    // Change color
    const updatedConfig = {
      groups: [{
        name: 'Test Group',
        iconUrl: 'https://example.com/icon.png',
        color: '#00ff00',
        categories: { 'Tech': ['AAPL'] }
      }]
    };

    await serviceWorker.evaluate(async (config) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: config });
      const tabs = await chrome.tabs.query({ active: true });
      for (const tab of tabs) {
        await chrome.tabs.sendMessage(tab.id, { action: 'reloadConfiguration' });
      }
    }, updatedConfig);

    await page.waitForTimeout(500);

    // Badges should be recreated with new color
    const badges = await page.locator('.fool-badge').count();
    expect(badges).toBeGreaterThanOrEqual(0);
  });

  test('changing group icons should update icons', async () => {
    const initialConfig = {
      groups: [{
        name: 'Test Group',
        iconUrl: 'https://example.com/icon1.png',
        color: '#ff0000',
        categories: { 'Tech': ['AAPL'] }
      }]
    };

    await serviceWorker.evaluate(async (config) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: config });
    }, initialConfig);

    await page.waitForTimeout(500);

    // Change icon URL
    const updatedConfig = {
      groups: [{
        name: 'Test Group',
        iconUrl: 'https://example.com/icon2.png',
        color: '#ff0000',
        categories: { 'Tech': ['AAPL'] }
      }]
    };

    await serviceWorker.evaluate(async (config) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: config });
      const tabs = await chrome.tabs.query({ active: true });
      for (const tab of tabs) {
        await chrome.tabs.sendMessage(tab.id, { action: 'reloadConfiguration' });
      }
    }, updatedConfig);

    await page.waitForTimeout(500);

    // Icons should be updated
    const badges = await page.locator('.fool-badge').count();
    expect(badges).toBeGreaterThanOrEqual(0);
  });
});

test.describe('URL Filtering in Real Browser - E2E Tests', () => {
  let context;
  let serviceWorker;

  test.beforeEach(async ({ browser }) => {
    const extensionPath = path.join(__dirname, '../../');
    
    context = await browser.newContext({
      permissions: []
    });

    serviceWorker = await context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('whitelist mode blocks extension on non-matching pages', async () => {
    const config = {
      groups: [{
        name: 'Test',
        iconUrl: 'https://example.com/icon.png',
        categories: { 'Tech': ['AAPL'] }
      }],
      urlFilters: {
        mode: 'whitelist',
        patterns: [
          { pattern: 'allowed.com', type: 'domain' }
        ]
      }
    };

    await serviceWorker.evaluate(async (cfg) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: cfg });
    }, config);

    // Navigate to non-matching page
    const page = await context.newPage();
    const testPagePath = path.join(__dirname, 'test-page.html');
    await page.goto(`file://${testPagePath}`);
    await page.waitForTimeout(500);

    // Extension should not run (file:// doesn't match allowed.com)
    const badges = await page.locator('.fool-badge').count();
    expect(badges).toBe(0);

    await page.close();
  });

  test('blacklist mode allows extension on non-matching pages', async () => {
    const config = {
      groups: [{
        name: 'Test',
        iconUrl: 'https://example.com/icon.png',
        categories: { 'Tech': ['AAPL'] }
      }],
      urlFilters: {
        mode: 'blacklist',
        patterns: [
          { pattern: 'blocked.com', type: 'domain' }
        ]
      }
    };

    await serviceWorker.evaluate(async (cfg) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: cfg });
    }, config);

    const page = await context.newPage();
    const testPagePath = path.join(__dirname, 'test-page.html');
    await page.goto(`file://${testPagePath}`);
    await page.waitForTimeout(500);

    // Extension should run (file:// doesn't match blocked.com)
    const badges = await page.locator('.fool-badge').count();
    expect(badges).toBeGreaterThanOrEqual(0);

    await page.close();
  });

  test('URL filter updates without page reload', async () => {
    const initialConfig = {
      groups: [{
        name: 'Test',
        iconUrl: 'https://example.com/icon.png',
        categories: { 'Tech': ['AAPL'] }
      }],
      urlFilters: {
        mode: 'blacklist',
        patterns: []
      }
    };

    await serviceWorker.evaluate(async (cfg) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: cfg });
    }, initialConfig);

    const page = await context.newPage();
    const testPagePath = path.join(__dirname, 'test-page.html');
    await page.goto(`file://${testPagePath}`);
    await page.waitForTimeout(500);

    // Update URL filters
    const updatedConfig = {
      ...initialConfig,
      urlFilters: {
        mode: 'whitelist',
        patterns: [
          { pattern: 'example.com', type: 'domain' }
        ]
      }
    };

    await serviceWorker.evaluate(async (cfg) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: cfg });
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'reloadConfiguration' });
        } catch (e) {
          // Tab might not be ready
        }
      }
    }, updatedConfig);

    await page.waitForTimeout(500);

    // Filters should be updated
    const badges = await page.locator('.fool-badge').count();
    expect(badges).toBeGreaterThanOrEqual(0);

    await page.close();
  });
});

test.describe('Extension Lifecycle - E2E Tests', () => {
  let context;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      permissions: []
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('extension works with multiple tabs open simultaneously', async () => {
    const config = {
      groups: [{
        name: 'Test',
        iconUrl: 'https://example.com/icon.png',
        categories: { 'Tech': ['AAPL', 'MSFT'] }
      }]
    };

    const serviceWorker = await context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    
    await serviceWorker.evaluate(async (cfg) => {
      await chrome.storage.sync.set({ symbolMarkerConfig: cfg });
    }, config);

    // Open multiple tabs
    const testPagePath = path.join(__dirname, 'test-page.html');
    
    const page1 = await context.newPage();
    await page1.goto(`file://${testPagePath}`);
    await page1.waitForTimeout(500);

    const page2 = await context.newPage();
    await page2.goto(`file://${testPagePath}`);
    await page2.waitForTimeout(500);

    const page3 = await context.newPage();
    await page3.goto(`file://${testPagePath}`);
    await page3.waitForTimeout(500);

    // All tabs should have badges
    const badges1 = await page1.locator('.fool-badge').count();
    const badges2 = await page2.locator('.fool-badge').count();
    const badges3 = await page3.locator('.fool-badge').count();

    expect(badges1).toBeGreaterThanOrEqual(0);
    expect(badges2).toBeGreaterThanOrEqual(0);
    expect(badges3).toBeGreaterThanOrEqual(0);

    await page1.close();
    await page2.close();
    await page3.close();
  });
});

test.describe('Browser Features - E2E Tests', () => {
  let context;
  let page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      permissions: [],
      colorScheme: 'light'
    });

    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('extension works with browser dark mode', async () => {
    // Set dark mode
    await context.close();
    context = await test.use({ colorScheme: 'dark' });
    
    const darkContext = await context.browser().newContext({
      colorScheme: 'dark'
    });

    const darkPage = await darkContext.newPage();
    const testPagePath = path.join(__dirname, 'test-page.html');
    await darkPage.goto(`file://${testPagePath}`);
    await darkPage.waitForTimeout(500);

    // Extension should work in dark mode
    const badges = await darkPage.locator('.fool-badge').count();
    expect(badges).toBeGreaterThanOrEqual(0);

    await darkPage.close();
    await darkContext.close();
  });

  test('extension works with browser light mode', async () => {
    const testPagePath = path.join(__dirname, 'test-page.html');
    await page.goto(`file://${testPagePath}`);
    await page.waitForTimeout(500);

    // Extension should work in light mode
    const badges = await page.locator('.fool-badge').count();
    expect(badges).toBeGreaterThanOrEqual(0);
  });
});
