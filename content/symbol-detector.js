// Symbol Detector - Finds and matches stock symbols in the DOM
// Handles regex pattern building and TreeWalker-based symbol detection

import { createLogger } from '../shared/logger.js';

const log = createLogger('SymbolDetector');

export class SymbolDetector {
    constructor() {
        this.symbolToGroups = new Map();
        this.allSymbolsRegex = null;
        this.symbolPatternMap = new Map();
    }

    /**
     * Build symbol lookup maps from configuration
     * @param {Array} groups - Configuration groups
     */
    buildSymbolMaps(groups) {
        this.symbolToGroups.clear();
        
        groups.forEach(group => {
            Object.entries(group.categories).forEach(([categoryName, categoryData]) => {
                // Handle both array format and object format {symbols: [], url: ''}
                const symbolsList = Array.isArray(categoryData) ? categoryData : (categoryData.symbols || []);
                const categoryUrl = (typeof categoryData === 'object' && !Array.isArray(categoryData)) ? categoryData.url : null;
                
                symbolsList.forEach(symbol => {
                    if (!this.symbolToGroups.has(symbol)) {
                        this.symbolToGroups.set(symbol, []);
                    }
                    
                    const groupData = this.symbolToGroups.get(symbol);
                    let existingGroup = groupData.find(g => g.groupName === group.name);
                    
                    if (!existingGroup) {
                        existingGroup = {
                            groupName: group.name,
                            groupIcon: group.iconUrl,
                            groupColor: group.color,
                            groupUrl: group.url,
                            categories: []
                        };
                        groupData.push(existingGroup);
                    }
                    
                    // Store category with URL if available
                    const categoryEntry = categoryUrl ? { name: categoryName, url: categoryUrl } : categoryName;
                    
                    const existingCategory = existingGroup.categories.find(c => 
                        (typeof c === 'string' ? c : c.name) === categoryName
                    );
                    if (!existingCategory) {
                        existingGroup.categories.push(categoryEntry);
                    }
                });
            });
        });
        
        log.info(`📊 Tracking ${this.symbolToGroups.size} unique symbols across ${groups.length} groups`);
    }

    /**
     * Build optimized regex patterns for all symbols
     */
    buildRegexPatterns() {
        const allSymbols = Array.from(this.symbolToGroups.keys());
        if (allSymbols.length === 0) return;
        
        // Escape special regex characters and sort by length (longest first)
        const escapedSymbols = allSymbols
            .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .sort((a, b) => b.length - a.length);
        
        // Create a single regex that matches any symbol
        this.allSymbolsRegex = new RegExp(`\\b(${escapedSymbols.join('|')})\\b`, 'g');
        
        // Map each symbol to its pattern for quick lookup
        this.symbolPatternMap.clear();
        allSymbols.forEach(symbol => {
            this.symbolPatternMap.set(
                symbol, 
                new RegExp(`\\b${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
            );
        });
        
        log.info(`✅ Built regex patterns for ${allSymbols.length} symbols`);
    }

    /**
     * Find all symbols in the DOM
     * @returns {Map} - Map of symbol -> array of text nodes
     */
    findSymbolsInDOM() {
        if (!this.allSymbolsRegex) {
            log.warn('Regex patterns not built yet');
            return new Map();
        }

        // Optimized: Use TreeWalker once to find all potential text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Quick filter: skip our own elements
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    
                    const tagName = parent.tagName.toLowerCase();
                    if (['script', 'style', 'noscript', 'svg'].includes(tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    if (parent.classList.contains('fool-badge') || 
                        parent.classList.contains('symbol-tooltip')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    const text = node.textContent.trim();
                    const textLength = text.length;
                    
                    // Quick length check: symbols are typically 1-8 chars
                    if (textLength < 1 || textLength > 8) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Quick regex test against all symbols
                    if (this.allSymbolsRegex && this.allSymbolsRegex.test(text)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    
                    return NodeFilter.FILTER_REJECT;
                }
            },
            false
        );
        
        // Collect matching text nodes grouped by symbol
        const symbolToNodes = new Map();
        let node;
        while (node = walker.nextNode()) {
            const text = node.textContent.trim();
            
            // Find which symbol(s) match this text
            for (const [symbol, pattern] of this.symbolPatternMap) {
                if (pattern.test(text)) {
                    if (!symbolToNodes.has(symbol)) {
                        symbolToNodes.set(symbol, []);
                    }
                    symbolToNodes.get(symbol).push(node);
                }
            }
        }
        
        if (symbolToNodes.size > 0) {
            log.info(`Found ${symbolToNodes.size} symbols in DOM`);
        }
        
        return symbolToNodes;
    }

    /**
     * Get groups for a specific symbol
     * @param {string} symbol - The symbol to look up
     * @returns {Array} - Array of group objects
     */
    getGroupsForSymbol(symbol) {
        return this.symbolToGroups.get(symbol) || [];
    }

    /**
     * Check if a symbol exists
     * @param {string} symbol - The symbol to check
     * @returns {boolean}
     */
    hasSymbol(symbol) {
        return this.symbolToGroups.has(symbol);
    }

    /**
     * Get all tracked symbols
     * @returns {Array}
     */
    getAllSymbols() {
        return Array.from(this.symbolToGroups.keys());
    }

    /**
     * Reset all data
     */
    reset() {
        this.symbolToGroups.clear();
        this.allSymbolsRegex = null;
        this.symbolPatternMap.clear();
        log.info('Symbol detector reset');
    }
}
