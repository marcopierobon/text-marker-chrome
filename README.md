# Motley Fool Symbol Marker - Chrome Extension

This Chrome extension displays the Motley Fool icon with category labels next to tracked stock symbols on Alpaca Markets and eToro.

## Features

The extension tracks symbols across 5 Motley Fool categories:

- **STOCK ADVISOR** - Core stock recommendations
- **MONEYBALL** - Data-driven picks
- **FOUNDATIONAL** - Long-term foundation stocks
- **TOP ANALYST** - Analyst favorites
- **TOP QUANT** - Quantitative analysis picks

Each symbol displays:

- 16x16 Motley Fool icon
- Single category: Shows label directly (e.g., "STOCK ADVISOR")
- Multiple categories: Shows clickable "+N" button that expands to show all labels separated by "|"

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right corner)
3. Click "Load unpacked"
4. Select the `motley-fool-extension` folder
5. The extension will now be active

## Usage

Once installed, visit:

- https://app.alpaca.markets/
- https://www.etoro.com/

The extension automatically displays badges next to any tracked symbols. For example:

- **Single category**: RACE → 🎯 **STOCK ADVISOR**
- **Multiple categories**: NVDA → 🎯 **+3** (click to expand to "STOCK ADVISOR | MONEYBALL | TOP QUANT")
- **Multiple categories**: TSLA → 🎯 **+4** (click to expand to "STOCK ADVISOR | FOUNDATIONAL | TOP ANALYST | TOP QUANT")

Click the "+N" button to toggle between compact and expanded view.

## Configuration Panel

Click the extension icon to open the configuration panel where you can:

### Manage Groups

- **Add Group**: Create new symbol groups with custom icons and colors
- **Edit Group**: Modify group name, icon URL, or badge color
- **Delete Group**: Remove groups you no longer need

### Manage Categories

- **Add Category**: Create new categories within a group
- **Edit Category**: Modify category name or symbol list
- **Delete Category**: Remove categories

### Import/Export

- **Export**: Download your configuration as JSON
- **Import**: Upload a previously saved configuration
- **Reset**: Restore default configuration

All changes are saved to Chrome sync storage and apply immediately across all open tabs.

## Why Chrome Extension Instead of Tampermonkey?

These sites use Content Security Policy (CSP) which blocks Tampermonkey from injecting scripts. Chrome extensions run in a different context and can bypass these restrictions.

## Symbol Lists Structure

The extension maintains two sets of symbol lists:

### FULL Lists

- `FULL_FOOL_SYMBOL_LISTS` - Complete Motley Fool recommendations
- `FULL_SIMPLYWALLST_LISTS` - Complete Simply Wall St picks
- `FULL_ZACKS_LISTS` - Complete Zacks recommendations

These contain all symbols from each service but are **not used** by the extension.

### IN_USE Lists (Active)

- `IN_USE_FOOL_SYMBOL_LISTS` - Filtered Motley Fool symbols
- `IN_USE_SIMPLYWALLST_LISTS` - Filtered Simply Wall St symbols
- `IN_USE_ZACKS_LISTS` - Filtered Zacks symbols

These contain **only symbols available on eToro** and are actively used by the extension.

## Customization

To modify tracked symbols, edit `content.js` and update the `IN_USE_*` objects:

```javascript
const IN_USE_FOOL_SYMBOL_LISTS = {
    'STOCK ADVISOR': ["AAPL", "ABNB", "ADBE", ...],
    'MONEYBALL': ["AAPL", "ADBE", "AMD", ...],
    // ... etc
};
```

The extension uses the IN_USE lists to build the symbol-to-category lookup maps.

## Debugging

Open Chrome DevTools (F12) and check the console for:

- `🎯 Motley Fool Symbol Marker: Extension loaded!`
- `Tracking X unique symbols across 5 categories`
- `✓ Added badge for NVDA (STOCK ADVISOR, TOP QUANT) after <element>`
