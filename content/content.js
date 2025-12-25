// Content Script - Main Orchestrator
// Coordinates symbol detection, badge rendering, and configuration management

import { SymbolDetector } from './symbol-detector.js';
import { BadgeRenderer } from './badge-renderer.js';
import { StorageService } from '../shared/storage-service.js';
import { CHECK_INTERVAL, DEBOUNCE_DELAY } from '../shared/constants.js';
import { debounce } from '../utils/debounce.js';
import { createLogger } from '../shared/logger.js';

const log = createLogger('ContentScript');

class ContentScript {
    constructor() {
        this.detector = new SymbolDetector();
        this.renderer = new BadgeRenderer();
        this.configuration = { groups: [], urlFilters: { mode: 'whitelist', patterns: [] } };
    }

    /**
     * Initialize the content script
     */
    async initialize() {
        log.info('🎯 Symbol Marker: Initializing...');
        log.info('📍 Current URL:', window.location.href);
        
        try {
            // Load configuration
            await this.loadConfiguration();
            
            // Verify configuration is loaded
            if (!this.configuration || !this.configuration.groups || this.configuration.groups.length === 0) {
                log.error('❌ Failed to load configuration');
                return;
            }
            
            // Check if extension should run on this URL
            if (!this.shouldRunOnCurrentURL()) {
                log.info('⏭️ Extension disabled for this URL (filtered out)');
                return;
            }
            
            log.info('✅ Configuration loaded successfully');
            
            // Build symbol patterns
            this.detector.buildSymbolMaps(this.configuration.groups);
            this.detector.buildRegexPatterns();
            
            // Initial symbol marking
            this.markSymbols();
            
            // Set up observers
            this.setupPeriodicCheck();
            this.setupMutationObserver();
            this.setupMessageListener();
            
            log.info('✅ Symbol Marker: Active and monitoring');
        } catch (error) {
            log.error('❌ Error initializing Symbol Marker:', error);
        }
    }

    /**
     * Load configuration from storage
     */
    async loadConfiguration() {
        try {
            const config = await StorageService.load('symbolMarkerConfig');
            
            if (config) {
                this.configuration = config;
                log.info('✅ Configuration loaded from storage');
            } else {
                log.error('⚠️ No configuration found');
            }
            
            return true;
        } catch (error) {
            log.error('❌ Error loading configuration:', error);
            return false;
        }
    }

    /**
     * Mark symbols in the DOM
     */
    markSymbols() {
        if (!this.configuration || !this.configuration.groups || this.configuration.groups.length === 0) {
            log.info('⏳ Configuration not loaded yet, skipping markSymbols...');
            return;
        }
        
        log.info('Running markSymbols...');
        let markedCount = 0;
        
        // Find all symbols in DOM
        const symbolToNodes = this.detector.findSymbolsInDOM();
        
        // Process each symbol's text nodes
        symbolToNodes.forEach((textNodes, symbol) => {
            textNodes.forEach(textNode => {
                const parent = textNode.parentElement;
                if (!parent) return;
                
                // Skip if already marked
                if (this.renderer.isMarked(parent)) return;
                
                // Skip certain tags
                const tagName = parent.tagName.toLowerCase();
                if (['script', 'style', 'noscript', 'svg', 'head', 'title'].includes(tagName)) {
                    return;
                }
                
                // Skip if parent is our badge or tooltip
                if (parent.classList.contains('fool-badge') || 
                    parent.classList.contains('symbol-tooltip')) {
                    return;
                }
                
                // Check if badge already exists right next to this element
                if (parent.nextElementSibling?.classList.contains('fool-badge')) return;
                
                // Only mark if this is a leaf element or has minimal children
                const childElementCount = parent.querySelectorAll('*').length;
                if (childElementCount > 3) return;
                
                // Get groups for this symbol
                const groups = this.detector.getGroupsForSymbol(symbol);
                if (groups.length === 0) return;
                
                // Create and attach badge
                const badge = this.renderer.createBadge(symbol, groups);
                const success = this.renderer.attachBadge(parent, badge);
                
                if (success) {
                    markedCount++;
                    const groupNames = groups.map(g => g.groupName).join(', ');
                    log.info(`✓ Added badge for ${symbol} (${groupNames}) after <${tagName}>`, parent);
                }
            });
        });
        
        log.info(`Marked ${markedCount} new symbols`);
    }

    /**
     * Set up periodic checking for dynamically loaded content
     */
    setupPeriodicCheck() {
        setInterval(() => this.markSymbols(), CHECK_INTERVAL);
    }

    /**
     * Set up MutationObserver for DOM changes
     */
    setupMutationObserver() {
        const debouncedMarkSymbols = debounce(() => this.markSymbols(), DEBOUNCE_DELAY);
        
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    // Only check if added nodes contain text (potential symbols)
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.TEXT_NODE || 
                            (node.nodeType === Node.ELEMENT_NODE && node.textContent.trim())) {
                            shouldCheck = true;
                            break;
                        }
                    }
                }
            });
            
            if (shouldCheck) {
                debouncedMarkSymbols();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Set up message listener for configuration reload
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'reloadConfiguration') {
                log.info('🔄 Reloading configuration...');
                log.info(`📊 Current badges on page: ${this.renderer.getBadgeCount()}`);
                
                this.reload()
                    .then(() => {
                        const newBadgeCount = this.renderer.getBadgeCount();
                        log.info(`✅ Configuration reloaded. New badges: ${newBadgeCount}`);
                        sendResponse({ success: true, badgeCount: newBadgeCount });
                    })
                    .catch(error => {
                        log.error('❌ Error reloading configuration:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                
                return true; // Keep message channel open for async response
            }
        });
    }

    /**
     * Reload configuration and re-mark symbols
     */
    async reload() {
        // Load new configuration
        await this.loadConfiguration();
        
        log.info(`📊 New configuration has ${this.configuration.groups?.length || 0} groups`);
        
        // Rebuild patterns
        this.detector.buildSymbolMaps(this.configuration.groups);
        this.detector.buildRegexPatterns();
        
        // Clear existing badges
        this.renderer.clearBadges();
        
        // Reset marked elements tracking
        this.renderer.resetMarkedElements();
        
        // Re-mark symbols
        this.markSymbols();
    }

    /**
     * Check if extension should run on current URL
     * @returns {boolean}
     */
    shouldRunOnCurrentURL() {
        if (!this.configuration.urlFilters || 
            !this.configuration.urlFilters.patterns || 
            this.configuration.urlFilters.patterns.length === 0) {
            return true; // No filters, run everywhere
        }
        
        const currentURL = window.location.href;
        const currentDomain = window.location.hostname;
        const mode = this.configuration.urlFilters.mode;
        
        const matches = this.configuration.urlFilters.patterns.some(({ pattern, type }) => {
            try {
                if (type === 'regex') {
                    const regexStr = pattern.slice(1, -1); // Remove / /
                    const regex = new RegExp(regexStr);
                    return regex.test(currentURL);
                } else if (type === 'wildcard') {
                    const regexStr = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
                    const regex = new RegExp(`^${regexStr}$`);
                    return regex.test(currentDomain) || regex.test(currentURL);
                } else if (type === 'domain') {
                    return currentDomain === pattern || currentDomain.endsWith('.' + pattern);
                } else {
                    return currentURL === pattern;
                }
            } catch (e) {
                log.error('Error matching pattern:', pattern, e);
                return false;
            }
        });
        
        // Whitelist mode: run only if matches
        // Blacklist mode: run only if doesn't match
        return mode === 'whitelist' ? matches : !matches;
    }
}

// Initialize when DOM is ready
const contentScript = new ContentScript();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => contentScript.initialize());
} else {
    contentScript.initialize();
}
