# Text Marker - Chrome Extension

A Chrome extension that highlights and marks text patterns on web pages with customizable badges and tooltips.

## Features

- **Text Pattern Detection**: Automatically detects and highlights text patterns on any webpage
- **Customizable Groups**: Organize text patterns into groups with custom icons and colors
- **Category Management**: Assign text patterns to multiple categories within groups
- **Interactive Badges**: Click badges to see detailed tooltips with category information
- **URL Filtering**: Control which websites the extension runs on (whitelist/blacklist modes)
- **Flexible Configuration**: Easy-to-use popup interface for managing all settings

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right corner)
3. Click "Load unpacked"
4. Select the `text-marker-extension` folder
5. The extension will now be active

## Usage

Once installed, the extension will automatically detect and mark configured text patterns on any webpage.

### Configuration Panel

Click the extension icon to open the configuration panel where you can:

#### Manage Groups

- **Add Group**: Create new text pattern groups with custom icons and colors
- **Edit Group**: Modify existing group properties
- **Delete Group**: Remove groups you no longer need

#### Manage Categories

- **Add Category**: Create categories within groups
- **Add Text Patterns**: Assign text patterns to categories
- **Category URLs**: Optionally add URLs to categories for quick reference

#### URL Filtering

- **Whitelist Mode**: Extension only runs on specified URLs
- **Blacklist Mode**: Extension runs everywhere except specified URLs
- **Pattern Matching**: Use wildcards for flexible URL matching

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

### Pre-commit Check

```bash
npm run precommit
```

## Architecture

- **Content Script**: Detects symbols and renders badges on web pages
- **Background Script**: Manages storage and configuration
- **Popup**: User interface for configuration
- **Symbol Detector**: Core logic for finding symbols in DOM
- **Badge Renderer**: Creates and manages badge UI elements

## License

ISC
