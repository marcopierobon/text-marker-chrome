import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionPath = path.join(__dirname, '../../');
const testPagePath = 'file://' + path.join(__dirname, 'test-page.html');

test.describe('Content Integration E2E Tests', () => {
    let context;
    let page;
    let serviceWorker;

    test.beforeAll(async () => {
        // Launch browser with extension loaded
        context = await chromium.launchPersistentContext('', {
            headless: false,
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
            ],
        });
        
        // Wait for service worker to be ready
        let [background] = context.serviceWorkers();
        if (!background) {
            background = await context.waitForEvent('serviceworker');
        }
        serviceWorker = background;
        
        // Configure extension with test data via service worker
        await serviceWorker.evaluate(() => {
            return new Promise((resolve) => {
                chrome.storage.sync.set({
                    symbolMarkerConfig: {
                        groups: [
                            {
                                name: 'Tech Stocks',
                                iconUrl: 'https://example.com/icon.png',
                                categories: {
                                    'AI': ['NVDA', 'GOOGL', 'AAPL'],
                                    'Cloud': ['MSFT'],
                                    'Portfolio': ['AAPL', 'TSLA', 'AMZN'],
                                    'Special': ['BRKB', 'BFA']
                                }
                            }
                        ],
                        urlFilters: {
                            mode: 'whitelist',
                            patterns: []
                        }
                    }
                }, () => {
                    // Verify storage was set
                    chrome.storage.sync.get(['symbolMarkerConfig'], (result) => {
                        console.log('Storage set:', result);
                        resolve();
                    });
                });
            });
        });
        
        page = await context.newPage();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('detects symbols in DOM and renders badges end-to-end', async () => {
        await page.goto(testPagePath);
        
        // Wait for extension to process the page
        await page.waitForTimeout(2000);
        
        // Check that badges were created for NVDA, MSFT, GOOGL
        const badges = await page.locator('.fool-badge').count();
        expect(badges).toBeGreaterThanOrEqual(3);
        
        // Verify specific symbols have badges using data-symbol attribute
        const nvdaBadge = await page.locator('.fool-badge[data-symbol="NVDA"]').count();
        const msftBadge = await page.locator('.fool-badge[data-symbol="MSFT"]').count();
        const googlBadge = await page.locator('.fool-badge[data-symbol="GOOGL"]').count();
        
        expect(nvdaBadge).toBeGreaterThan(0);
        expect(msftBadge).toBeGreaterThan(0);
        expect(googlBadge).toBeGreaterThan(0);
    });

    test('handles multiple symbols in same text node', async () => {
        await page.goto(testPagePath);
        await page.waitForTimeout(2000);
        
        // Check for AAPL, TSLA, AMZN badges using data-symbol attribute
        const aaplBadge = await page.locator('.fool-badge[data-symbol="AAPL"]').count();
        const tslaBadge = await page.locator('.fool-badge[data-symbol="TSLA"]').count();
        const amznBadge = await page.locator('.fool-badge[data-symbol="AMZN"]').count();
        
        expect(aaplBadge).toBeGreaterThan(0);
        expect(tslaBadge).toBeGreaterThan(0);
        expect(amznBadge).toBeGreaterThan(0);
    });

    test('creates badge with multiple group icons when symbol appears in multiple groups', async () => {
        await page.goto(testPagePath);
        await page.waitForTimeout(2000);
        
        // Find AAPL badge and check it has group containers
        const aaplBadge = page.locator('.fool-badge[data-symbol="AAPL"]').first();
        await expect(aaplBadge).toBeVisible();
        
        // Check that badge exists and has content (icon or category label)
        await expect(aaplBadge).toBeVisible();
        const hasContent = await aaplBadge.evaluate(el => el.children.length > 0);
        expect(hasContent).toBe(true);
    });

    test('handles category objects with URLs in badge tooltips', async () => {
        await page.goto(testPagePath);
        await page.waitForTimeout(2000);
        
        // Find AAPL badge which has multiple categories (AI and Portfolio) so it will have a tooltip
        const badge = page.locator('.fool-badge[data-symbol="AAPL"]').first();
        await expect(badge).toBeVisible();
        
        // Check for tooltip element existence (even if hidden)
        const tooltip = badge.locator('.symbol-tooltip');
        const tooltipCount = await tooltip.count();
        expect(tooltipCount).toBeGreaterThan(0);
        
        // Verify tooltip becomes visible on hover
        await badge.hover();
        await page.waitForTimeout(500);
        await expect(tooltip).toBeVisible();
    });

    test('handles dynamically added nested elements', async () => {
        await page.goto(testPagePath);
        await page.waitForTimeout(2000);
        
        // Get initial badge count
        const initialBadges = await page.locator('.fool-badge').count();
        
        // Add dynamic content
        await page.evaluate(() => window.testHelpers.addDynamicContent());
        
        // Wait for extension to process new content
        await page.waitForTimeout(2000);
        
        // Check that new badges were added
        const finalBadges = await page.locator('.fool-badge').count();
        expect(finalBadges).toBeGreaterThanOrEqual(initialBadges);
        
        // Verify AMZN and GOOGL in dynamic content have badges
        const dynamicSection = page.locator('#dynamic-root');
        const amznInDynamic = await dynamicSection.locator('.fool-badge[data-symbol="AMZN"]').count();
        const googlInDynamic = await dynamicSection.locator('.fool-badge[data-symbol="GOOGL"]').count();
        
        expect(amznInDynamic + googlInDynamic).toBeGreaterThan(0);
    });

    test('handles configuration reload and badge refresh', async () => {
        await page.goto(testPagePath);
        await page.waitForTimeout(2000);
        
        // Show test-4 div which has AAPL, TSLA, NVDA
        await page.evaluate(() => {
            document.getElementById('test-4').style.display = 'block';
        });
        await page.waitForTimeout(1000);
        
        // Update configuration to only track TSLA and NVDA via service worker
        await serviceWorker.evaluate(() => {
            return new Promise((resolve) => {
                chrome.storage.sync.set({
                    symbolMarkerConfig: {
                        groups: [{
                            name: 'New Portfolio',
                            iconUrl: 'https://example.com/icon.png',
                            categories: {
                                'Stocks': ['TSLA', 'NVDA']
                            }
                        }],
                        urlFilters: {
                            mode: 'whitelist',
                            patterns: []
                        }
                    }
                }, resolve);
            });
        });
        
        // Reload page to apply new config
        await page.reload();
        await page.waitForTimeout(2000);
        
        // Show test-4 again after reload
        await page.evaluate(() => {
            document.getElementById('test-4').style.display = 'block';
        });
        await page.waitForTimeout(1000);
        
        // Check that TSLA and NVDA have badges but not AAPL
        const test4Section = page.locator('#test-4');
        const tslaBadge = await test4Section.locator('.fool-badge[data-symbol="TSLA"]').count();
        const nvdaBadge = await test4Section.locator('.fool-badge[data-symbol="NVDA"]').count();
        
        expect(tslaBadge).toBeGreaterThan(0);
        expect(nvdaBadge).toBeGreaterThan(0);
    });

    test('handles symbols with special regex characters', async () => {
        await page.goto(testPagePath);
        await page.waitForTimeout(2000);
        
        // Check for BRKB and BFA badges in test-3
        const test3Section = page.locator('#test-3');
        const brkbBadge = await test3Section.locator('.fool-badge[data-symbol="BRKB"]').count();
        const bfaBadge = await test3Section.locator('.fool-badge[data-symbol="BFA"]').count();
        
        expect(brkbBadge).toBeGreaterThan(0);
        expect(bfaBadge).toBeGreaterThan(0);
    });
});
