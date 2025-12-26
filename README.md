# Text Marker - Chrome Extension

A powerful Chrome extension that detects and highlights custom text patterns on web pages with visual badges and interactive tooltips.

---

<details><summary><h2>📖 Overview</h2></summary>

### What This Extension Does

Text Marker is a versatile Chrome extension that helps you visually identify and organize important text patterns across any website. Whether you're tracking product names, technical terms, project codes, or any other text patterns, this extension makes them instantly recognizable with customizable visual badges.

### Key Capabilities

- **Pattern Detection**: Automatically scans web pages for your configured text patterns
- **Visual Markers**: Displays color-coded badges next to detected patterns
- **Organization**: Group related patterns together with custom icons and colors
- **Categorization**: Assign patterns to multiple categories for better organization
- **Smart Filtering**: Control which websites the extension runs on
- **Interactive Tooltips**: Hover over badges to see detailed information

### Why Use This Extension?

- **Improve Productivity**: Quickly spot important information while browsing
- **Stay Organized**: Keep track of multiple text patterns across different contexts
- **Reduce Cognitive Load**: Let visual cues do the work instead of manually searching
- **Customize Your Experience**: Tailor the extension to your specific needs
- **Privacy-Focused**: All data stored locally, no external servers

### Use Cases

- **Research**: Track technical terms, concepts, or keywords across documentation
- **Project Management**: Identify project codes, ticket numbers, or team names
- **Content Creation**: Monitor brand names, product references, or competitors
- **Learning**: Highlight vocabulary, formulas, or important concepts while studying
- **Data Analysis**: Mark data points, metrics, or identifiers across dashboards

</details>

---

<details>
<summary><h2>🚀 Usage</h2></summary>

### Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **"Load unpacked"**
5. Select the `dist` folder from this project
6. The extension icon will appear in your toolbar

### Getting Started

#### 1. Configure Your First Group

1. Click the extension icon in your toolbar
2. Go to the **Groups** tab
3. Click **"Add Group"**
4. Fill in:
   - **Group Name**: e.g., "Important Terms"
   - **Icon URL**: Link to an icon image (or leave blank for default)
   - **Color**: Choose a color for this group's badges
5. Click **"Save"**

#### 2. Add Text Patterns

1. Click on your newly created group
2. Click **"Add Category"**
3. Enter a category name (e.g., "Technical Terms")
4. Add text patterns you want to detect (one per line)
5. Optionally add a URL for quick reference
6. Click **"Save"**

#### 3. Activate on Websites

**Option A: Automatic Mode (Recommended)**

1. Go to **Settings** tab
2. Click **"Enable Automatic Mode"**
3. Grant permission when prompted
4. Extension runs automatically on all websites

**Option B: Manual Mode**

1. Navigate to any website
2. Click the extension icon
3. Extension activates on that page only

### Managing Your Configuration

#### Edit Groups

- Click the ✏️ icon on any group card
- Modify name, icon, or color
- Click **"Save"** to apply changes

#### Delete Groups

- Click the 🗑️ icon on any group card
- Confirm deletion

#### URL Filtering

Control where the extension runs:

1. Go to **URL Filters** tab
2. Choose mode:
   - **Whitelist**: Only runs on specified URLs
   - **Blacklist**: Runs everywhere except specified URLs
3. Add URL patterns:
   - `example.com` - Exact domain
   - `*.example.com` - All subdomains
   - `/https:\/\/.*\.example\.com/` - Regex pattern

#### Import/Export Configuration

**Export**:

1. Go to **Settings** tab
2. Click **"Export Configuration"**
3. Save the JSON file

**Import**:

1. Go to **Settings** tab
2. Click **"Import Configuration"**
3. Select your JSON file
4. Configuration is restored

### Tips & Tricks

- **Use Colors Wisely**: Assign similar colors to related groups
- **Organize by Context**: Create separate groups for different projects or topics
- **Leverage Categories**: Use categories to sub-divide patterns within a group
- **Test Patterns**: Add patterns gradually and test on target websites
- **Backup Regularly**: Export your configuration periodically

</details>

---

<details>
<summary><h2>🏗️ Code Walkthrough</h2></summary>

### Architecture Overview

The extension follows a modular architecture with clear separation of concerns:

```
text-marker-extension/
├── content/          # Runs on web pages
├── popup/            # Configuration UI
├── background.ts     # Service worker
├── shared/           # Shared utilities
├── types/            # TypeScript definitions
└── utils/            # Helper functions
```

### Core Components

#### 1. **Content Script** (`content/content.ts`)

The orchestrator that runs on web pages.

**Responsibilities**:

- Initializes symbol detection and badge rendering
- Loads configuration from storage
- Manages DOM observation for dynamic content
- Handles configuration updates
- Implements URL filtering logic

**Key Methods**:

- `loadConfiguration()`: Fetches user settings
- `scanAndMark()`: Triggers symbol detection
- `shouldRunOnCurrentUrl()`: Checks URL filters

#### 2. **Symbol Detector** (`content/symbol-detector.ts`)

Finds text patterns in the DOM.

**Responsibilities**:

- Builds regex patterns from configuration
- Traverses DOM to find text nodes
- Identifies pattern matches
- Returns match locations and metadata

**Key Methods**:

- `buildRegexPatterns()`: Compiles patterns into regex
- `detectSymbols()`: Scans DOM for matches
- `findTextNodes()`: Locates text content in DOM

#### 3. **Badge Renderer** (`content/badge-renderer.ts`)

Creates visual badges and tooltips.

**Responsibilities**:

- Generates badge HTML elements
- Applies styling and colors
- Creates interactive tooltips
- Manages badge lifecycle
- Handles color contrast for readability

**Key Methods**:

- `createBadge()`: Generates badge container
- `createTooltip()`: Builds tooltip with categories
- `attachBadge()`: Inserts badge into DOM
- `getContrastingBackground()`: Ensures text readability

#### 4. **Popup Interface** (`popup/popup.ts`)

Configuration management UI.

**Responsibilities**:

- Renders group and category management
- Handles user input and validation
- Manages import/export functionality
- Controls permission requests
- Implements URL filter configuration

**Key Methods**:

- `renderGroups()`: Displays configured groups
- `saveConfiguration()`: Persists settings
- `requestHostPermissions()`: Manages automatic mode

#### 5. **Background Service Worker** (`background.ts`)

Manages extension lifecycle and permissions.

**Responsibilities**:

- Handles extension installation/updates
- Manages message passing between components
- Injects content scripts (manual mode)
- Monitors permission changes

**Key Methods**:

- `chrome.action.onClicked`: Handles icon clicks
- `chrome.runtime.onMessage`: Processes messages
- `hasHostPermissions()`: Checks permission status

### Data Flow

1. **Configuration Storage**:

   ```
   User Input → Popup → Chrome Storage → Content Script
   ```

2. **Pattern Detection**:

   ```
   Page Load → Content Script → Symbol Detector → Badge Renderer → DOM
   ```

3. **Permission Management**:
   ```
   User Action → Popup → Background Worker → Chrome Permissions API
   ```

### Key Technologies

- **TypeScript**: Type-safe development
- **Rollup**: Module bundling
- **Jest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **Chrome Extension APIs**: Storage, scripting, permissions

### Testing Strategy

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test full user workflows in browser
- **Coverage**: Maintain >95% code coverage

</details>

---

<details>
<summary><h2>🤝 How to Contribute</h2></summary>

We welcome contributions from the community! Here's how you can help improve Text Marker.

### Getting Started

1. **Fork the Repository**

   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/text-marker-chrome.git
   cd text-marker-chrome
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

1. **Make Your Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic

2. **Build the Extension**

   ```bash
   npm run build
   ```

3. **Test Your Changes**

   ```bash
   # Run all tests
   npm test

   # Run E2E tests
   npm run test:e2e

   # Check code formatting
   npm run format:check
   ```

4. **Run Pre-commit Checks**
   ```bash
   ./pre-commit-check.sh
   ```
   This runs:
   - Code formatting (Prettier)
   - Type checking (TypeScript)
   - Unit tests (Jest)
   - Integration tests
   - E2E tests (Playwright)
   - Coverage checks

### Contribution Guidelines

#### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for public APIs

#### Testing Requirements

- Write unit tests for new functions
- Add integration tests for component interactions
- Include E2E tests for user-facing features
- Maintain or improve code coverage

#### Commit Messages

Use clear, descriptive commit messages:

```
feat: Add support for regex patterns in URL filters
fix: Resolve badge positioning issue on dynamic content
docs: Update README with new configuration options
test: Add E2E tests for permission flow
```

### Types of Contributions

#### 🐛 Bug Fixes

- Check existing issues first
- Include steps to reproduce
- Add tests that verify the fix

#### ✨ New Features

- Open an issue to discuss first
- Ensure it aligns with project goals
- Include documentation and tests

#### 📚 Documentation

- Fix typos or unclear explanations
- Add examples and use cases
- Improve code comments

#### 🧪 Tests

- Increase test coverage
- Add edge case tests
- Improve test reliability

#### 🎨 UI/UX Improvements

- Enhance visual design
- Improve user experience
- Ensure accessibility

### Pull Request Process

1. **Update Documentation**
   - Update README if needed
   - Add inline code comments
   - Update CHANGELOG

2. **Ensure Tests Pass**

   ```bash
   ./pre-commit-check.sh
   ```

3. **Submit Pull Request**
   - Provide clear description
   - Reference related issues
   - Include screenshots for UI changes

4. **Code Review**
   - Address reviewer feedback
   - Make requested changes
   - Keep discussion professional

5. **Merge**
   - Maintainer will merge when approved
   - Delete your branch after merge

### Development Tips

- **Hot Reload**: Use `npm run watch` for automatic rebuilds
- **Debug Mode**: Enable DEBUG_MODE in `shared/constants.ts` for verbose logging
- **Browser DevTools**: Use Chrome DevTools to debug content scripts
- **Test in Isolation**: Load unpacked extension in a separate Chrome profile

### Need Help?

- 💬 Open an issue for questions
- 📧 Contact maintainers
- 📖 Read existing code and tests
- 🔍 Search closed issues for similar problems

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow project guidelines

</details>

---

<details>
<summary><h2>❓ FAQs</h2></summary>

<details>
<summary><strong>How do I install the extension?</strong></summary>

1. Download or clone this repository
2. Run `npm install` and `npm run build`
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (top right toggle)
5. Click "Load unpacked" and select the `dist` folder
6. The extension icon will appear in your toolbar

</details>

<details>
<summary><strong>What's the difference between Automatic and Manual mode?</strong></summary>

**Automatic Mode**:

- Extension runs automatically on all websites
- Requires granting optional host permissions
- Badges appear immediately on page load
- Best for frequent use across many sites

**Manual Mode**:

- Click extension icon on each page to activate
- No additional permissions required
- More privacy-conscious
- Best for occasional use or specific sites

You can switch between modes in the Settings tab.

</details>

<details>
<summary><strong>Why aren't my patterns being detected?</strong></summary>

Check these common issues:

1. **Case Sensitivity**: Patterns are case-sensitive by default
2. **Exact Match**: Pattern must match exactly (including spaces)
3. **URL Filters**: Check if the current site is filtered out
4. **Mode**: Ensure extension is activated (check icon color)
5. **Dynamic Content**: Some sites load content after page load - try refreshing

**Debug Steps**:

- Open browser console (F12)
- Look for `[ContentScript]` log messages
- Verify your pattern appears in the page source (Ctrl+U)

</details>

<details>
<summary><strong>Can I use regular expressions for patterns?</strong></summary>

Currently, patterns are matched as literal strings, not regex. However, you can:

1. Add multiple variations of a pattern
2. Use URL filters with regex patterns
3. Request regex support as a feature

Regex support for text patterns is on the roadmap!

</details>

<details>
<summary><strong>How do I backup my configuration?</strong></summary>

1. Click the extension icon
2. Go to **Settings** tab
3. Click **"Export Configuration"**
4. Save the JSON file to a safe location

To restore:

1. Go to **Settings** tab
2. Click **"Import Configuration"**
3. Select your saved JSON file

</details>

<details>
<summary><strong>Does this extension collect any data?</strong></summary>

**No.** Text Marker:

- Stores all data locally in Chrome's storage
- Makes no network requests
- Sends no analytics or telemetry
- Does not track your browsing
- Does not access or modify data on websites (only reads text for pattern matching)

Your privacy is paramount.

</details>

<details>
<summary><strong>Why do I need to grant permissions?</strong></summary>

The extension requests these permissions:

- **storage**: Save your configuration locally
- **activeTab**: Access the current page when you click the icon
- **scripting**: Inject the pattern detection code
- **system.display**: Calculate window size for floating window feature
- **optional_host_permissions**: (Optional) Run automatically on all sites

All permissions are used solely for extension functionality.

</details>

<details>
<summary><strong>Can I use this extension on mobile?</strong></summary>

Currently, Text Marker only works on desktop Chrome. Mobile Chrome doesn't support extensions in the same way.

However, you can use it on:

- Chrome (desktop)
- Edge (desktop)
- Brave (desktop)
- Any Chromium-based browser with extension support

</details>

<details>
<summary><strong>How do I report a bug?</strong></summary>

1. Go to the [GitHub Issues page](https://github.com/marcopierobon/text-marker-chrome/issues)
2. Click "New Issue"
3. Provide:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser version
   - Extension version
   - Screenshots if applicable

</details>

<details>
<summary><strong>Can I contribute to this project?</strong></summary>

Absolutely! We welcome contributions:

1. Read the **How to Contribute** section above
2. Fork the repository
3. Make your changes
4. Submit a pull request

All skill levels welcome - from fixing typos to adding features!

</details>

<details>
<summary><strong>How do I uninstall the extension?</strong></summary>

1. Go to `chrome://extensions/`
2. Find "Text Marker"
3. Click **"Remove"**
4. Confirm removal

Your configuration will be deleted. Export it first if you want to keep it.

</details>

<details>
<summary><strong>Why are some badges not showing the right colors?</strong></summary>

The extension automatically adjusts badge backgrounds for readability:

- Dark text colors get white backgrounds
- Light text colors get black backgrounds

This ensures text is always readable. If you want different behavior, this can be customized in the code.

</details>

<details>
<summary><strong>Can I use custom icons for groups?</strong></summary>

Yes! When creating or editing a group:

1. Enter a URL to any image in the "Icon URL" field
2. Recommended: Use square images (PNG or SVG)
3. The icon will appear next to detected patterns

If no URL is provided, a default colored circle with the group's first letter is used.

</details>

<details>
<summary><strong>What happens if two groups have the same pattern?</strong></summary>

If a pattern appears in multiple groups:

- All matching groups will be displayed
- Each group shows its own icon and color
- The tooltip shows all categories from all groups
- Badges are displayed side-by-side

This allows flexible organization of overlapping patterns.

</details>

<details>
<summary><strong>How do I update the extension?</strong></summary>

For development versions:

1. Pull latest changes from GitHub
2. Run `npm install` (if dependencies changed)
3. Run `npm run build`
4. Go to `chrome://extensions/`
5. Click the refresh icon on the extension card

For Chrome Web Store versions (when available):

- Updates happen automatically

</details>

<details>
<summary><strong>How do I build the extension for Chrome vs Firefox?</strong></summary>

The extension supports both Chrome and Firefox with different build processes:

**Chrome/Chromium Build**:

```bash
# Standard build for Chrome
npm run build:chrome

# Output: dist/ folder
# Load: chrome://extensions/ → "Load unpacked" → select dist/
```

**Firefox Build**:

```bash
# Firefox-specific build
npm run build:firefox

# Output: dist-firefox/ folder  
# Load: about:debugging → "This Firefox" → "Load Temporary Add-on" → select dist-firefox/manifest.firefox.json
```

**Key Differences**:

- **Manifest**: Chrome uses `manifest.json`, Firefox uses `manifest.firefox.json`
- **Permissions**: Firefox requires different permission declarations
- **APIs**: Some Chrome APIs have Firefox equivalents or polyfills
- **Build Output**: Separate directories to avoid conflicts

**Development Tip**: Use `npm run watch` for Chrome development during active coding.

</details>

<details>
<summary><strong>How do E2E tests differ between Chrome and Firefox?</strong></summary>

The E2E test suite uses a unified abstraction layer but handles browser differences internally:

**Test Structure**:

```bash
# Run tests for both browsers
npm run test:e2e

# Chrome only
npx playwright test __tests__/e2e/ --project=chromium

# Firefox only  
npx playwright test __tests__/e2e/ --project=firefox
```

**Key Differences in Testing**:

**Chrome/Chromium**:
- Uses native extension loading via `--load-extension`
- Service worker accessible for direct communication
- Content script injection happens automatically
- Storage APIs work natively

**Firefox**:
- Uses RDP (Remote Debugging Protocol) for extension loading
- No direct service worker access
- Content script injected manually with mock storage
- Requires preference patching for permissions

**Test Implementation**:

The test framework handles these differences automatically:

```typescript
// Browser-agnostic test code
const testBrowser = await launchTestBrowser(browserType);
const page = await context.newPage();
await setupTestPage(browserType);
// Tests work identically from here
```

**Firefox-Specific Setup**:
- Temporary add-on installation via RDP
- Host permission pre-granting
- Mock storage API injection
- Content script manual loading

**Debugging Firefox Tests**:
- Check RDP connection logs
- Verify preference patching
- Monitor content script injection
- Validate mock storage setup

**Test Coverage**:
Both browsers run the same test suite with 42 tests covering:
- Badge rendering and detection
- Configuration management
- URL filtering
- Extension lifecycle
- Floating window functionality
- Dark mode compatibility

</details>

<details>
<summary><strong>What are the cross-browser compatibility considerations?</strong></summary>

**API Differences**:

**Chrome APIs**:
- `chrome.storage.sync/` - Native cloud storage
- `chrome.scripting.executeScript` - Content script injection
- `chrome.action.onClicked` - Extension icon clicks
- `chrome.windows.create` - Window management

**Firefox APIs**:
- `browser.storage.sync/` - WebExtensions storage
- `browser.tabs.executeScript` - Legacy content script injection
- `browser.action.onClicked` - Same interface, different implementation
- `browser.windows.create` - Same interface, different behavior

**Compatibility Layer**:

The extension includes a compatibility layer (`shared/browser-api.ts`) that:

```typescript
// Unified interface works in both browsers
import { storage, scripting, runtime } from "./shared/browser-api";

// Automatic detection and polyfilling
if (typeof chrome !== 'undefined') {
  // Chrome-specific implementation
} else if (typeof browser !== 'undefined') {
  // Firefox-specific implementation  
}
```

**Manifest Differences**:

**Chrome** (`manifest.json`):
```json
{
  "manifest_version": 3,
  "background": { "service_worker": "background.js" },
  "permissions": ["storage", "scripting", "activeTab"]
}
```

**Firefox** (`manifest.firefox.json`):
```json
{
  "manifest_version": 2,
  "background": { "scripts": ["background.js"] },
  "permissions": ["storage", "<all_urls>", "activeTab"]
}
```

**Testing Strategy**:

- **Unit Tests**: Browser-agnostic, test logic only
- **Integration Tests**: Use mocked APIs, test component interactions
- **E2E Tests**: Browser-specific setup, unified test code

**Known Limitations**:

- Firefox doesn't support Manifest V3 yet
- Some Chrome APIs have no Firefox equivalent
- Storage quota limits differ between browsers
- Extension loading mechanisms are fundamentally different

</details>

</details>

---

## 📄 License

ISC

---

## 🔗 Links

- [GitHub Repository](https://github.com/marcopierobon/text-marker-chrome)
- [Report Issues](https://github.com/marcopierobon/text-marker-chrome/issues)
- [Chrome Web Store](#) _(Coming soon)_

---

**Made with ☕ by [Marco Pierobon](https://buymeacoffee.com/pierobon)**
