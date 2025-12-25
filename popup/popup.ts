// Configuration management for Symbol Marker extension

import type {
  SymbolMarkerConfig,
  SymbolGroup,
  CategoryValue,
} from "../types/symbol-config";

let configuration: SymbolMarkerConfig = {
  groups: [],
  urlFilters: {
    mode: "blacklist",
    patterns: [],
  },
  floatingWindow: false,
};

let currentEditingCategory: string | null = null;
let currentGroupIndex: number = -1;

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Popup initializing...");
  
  // Check what type of window we're in
  const currentWindow = await chrome.windows.getCurrent();
  console.log("🪟 Window type on open:", currentWindow.type);
  
  await loadConfiguration();
  console.log("📋 Configuration loaded:", {
    floatingWindow: configuration.floatingWindow,
    groupCount: configuration.groups.length
  });
  setupEventListeners();
  await checkAndConvertToFloatingWindow();
  console.log("✅ Popup initialization complete");
});

// Load configuration from storage (hybrid approach)
async function loadConfiguration(): Promise<void> {
  try {
    // Try sync storage first
    let result = await chrome.storage.sync.get(["symbolMarkerConfig"]);

    if (result.symbolMarkerConfig) {
      configuration = result.symbolMarkerConfig as SymbolMarkerConfig;
    } else {
      // Fallback to local storage
      result = await chrome.storage.local.get(["symbolMarkerConfig"]);

      if (result.symbolMarkerConfig) {
        configuration = result.symbolMarkerConfig as SymbolMarkerConfig;
      } else {
        // Initialize with default configuration
        configuration = getDefaultConfiguration();
        await saveConfigurationToStorage();
      }
    }

    // Ensure urlFilters exists
    if (!configuration.urlFilters) {
      configuration.urlFilters = { mode: "blacklist", patterns: [] };
    }

    // Ensure floatingWindow has a default value
    if (configuration.floatingWindow === undefined) {
      configuration.floatingWindow = false;
    }

    renderGroups();
    renderURLPatterns();

    // Set filter mode radio button
    const modeRadio = document.querySelector<HTMLInputElement>(
      `input[name="filter-mode"][value="${configuration.urlFilters.mode}"]`,
    );
    if (modeRadio) modeRadio.checked = true;

    // Set floating window toggle
    const floatingToggle = document.getElementById(
      "floating-window-toggle",
    ) as HTMLInputElement;
    if (floatingToggle) {
      floatingToggle.checked = configuration.floatingWindow || false;
    }
  } catch (error) {
    console.error("Error loading configuration:", error);
    showToast("Error loading configuration", "error");
  }
}

// Save configuration to storage (hybrid approach)
async function saveConfigurationToStorage(): Promise<boolean> {
  try {
    const configStr = JSON.stringify(configuration);
    const configSize = new Blob([configStr]).size;

    console.log("💾 Saving configuration, size:", configSize, "bytes");

    // Chrome sync storage limit is ~100KB, use local if larger
    if (configSize > 90000) {
      console.log(
        "Configuration too large for sync storage, using local storage",
      );
      await chrome.storage.local.set({ symbolMarkerConfig: configuration });
      // Clear from sync if it was there
      await chrome.storage.sync.remove(["symbolMarkerConfig"]);
    } else {
      await chrome.storage.sync.set({ symbolMarkerConfig: configuration });
    }

    console.log("✅ Configuration saved to storage");

    // Small delay to ensure storage write completes
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Notify content scripts to reload configuration
    console.log("📢 Notifying tabs to reload configuration");
    chrome.tabs.query({}, (tabs) => {
      console.log(`Found ${tabs.length} tabs to notify`);
      tabs.forEach((tab) => {
        if (tab.id) {
          console.log(`Sending reload message to tab ${tab.id}: ${tab.url}`);
          chrome.tabs
            .sendMessage(tab.id, { action: "reloadConfiguration" })
            .then((response) => {
              console.log(`Tab ${tab.id} responded:`, response);
            })
            .catch((error) => {
              console.log(
                `Tab ${tab.id} error (may not have content script):`,
                error.message,
              );
            });
        }
      });
    });
    return true;
  } catch (error) {
    console.error("Error saving configuration:", error);
    // Fallback to local storage
    try {
      await chrome.storage.local.set({ symbolMarkerConfig: configuration });
      console.log("✅ Configuration saved to local storage (fallback)");
      return true;
    } catch (localError) {
      console.error("Error saving to local storage:", localError);
      return false;
    }
  }
}

// Setup event listeners
function setupEventListeners(): void {
  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      switchTab((btn as HTMLElement).dataset.tab!),
    );
  });

  // Add group button
  document
    .getElementById("add-group-btn")!
    .addEventListener("click", () => openGroupModal());

  // Group modal buttons
  document
    .getElementById("close-modal")!
    .addEventListener("click", () => closeGroupModal());
  document
    .getElementById("cancel-group-btn")!
    .addEventListener("click", () => closeGroupModal());
  document
    .getElementById("save-group-btn")!
    .addEventListener("click", () => saveGroup());

  // Category modal buttons
  document
    .getElementById("close-category-modal")!
    .addEventListener("click", () => closeCategoryModal());
  document
    .getElementById("cancel-category-btn")!
    .addEventListener("click", () => closeCategoryModal());
  document
    .getElementById("save-category-btn")!
    .addEventListener("click", () => saveCategory());

  // Footer buttons
  document
    .getElementById("cancel-btn")!
    .addEventListener("click", () => window.close());

  // Import/Export buttons
  document
    .getElementById("export-btn")!
    .addEventListener("click", () => exportConfiguration());
  document
    .getElementById("import-btn")!
    .addEventListener("click", () =>
      document.getElementById("import-file")!.click(),
    );
  document
    .getElementById("import-file")!
    .addEventListener("change", (e) => importConfiguration(e as Event));
  document
    .getElementById("reset-btn")!
    .addEventListener("click", () => resetToDefault());

  // URL Filter listeners
  setupURLFilterListeners();

  // Floating window toggle
  document
    .getElementById("floating-window-toggle")!
    .addEventListener("change", (e) => handleFloatingWindowToggle(e as Event));

  // Close modals on outside click
  document.getElementById("group-modal")!.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).id === "group-modal") closeGroupModal();
  });
  document.getElementById("category-modal")!.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).id === "category-modal") closeCategoryModal();
  });
}

// Switch tabs
function switchTab(tabName: string): void {
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));

  document.querySelector(`[data-tab="${tabName}"]`)!.classList.add("active");
  document.getElementById(`${tabName}-tab`)!.classList.add("active");
}

// Render groups
function renderGroups(): void {
  const container = document.getElementById("groups-container")!;
  container.innerHTML = "";

  if (configuration.groups.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #999; padding: 2rem;">No groups configured. Click "Add Group" to get started.</p>';
    return;
  }

  configuration.groups.forEach((group, groupIndex) => {
    const groupCard = createGroupCard(group, groupIndex);
    container.appendChild(groupCard);
  });
}

// Create group card element
function createGroupCard(
  group: SymbolGroup,
  groupIndex: number,
): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "group-card";

  const header = document.createElement("div");
  header.className = "group-header";

  const info = document.createElement("div");
  info.className = "group-info";

  // Try to use image, but fallback to emoji if CORS blocks it
  const iconContainer = document.createElement("span");
  iconContainer.style.display = "inline-block";
  iconContainer.style.width = "24px";
  iconContainer.style.height = "24px";
  iconContainer.style.textAlign = "center";

  const icon = document.createElement("img");
  icon.className = "group-icon";
  icon.src = group.iconUrl;
  icon.alt = group.name;
  icon.style.display = "block";
  icon.onerror = () => {
    // Fallback to colored circle with first letter when CORS blocks external images
    iconContainer.innerHTML = "";
    const fallbackIcon = document.createElement("div");
    fallbackIcon.style.width = "24px";
    fallbackIcon.style.height = "24px";
    fallbackIcon.style.borderRadius = "50%";
    fallbackIcon.style.backgroundColor = group.color || "#666";
    fallbackIcon.style.color = "white";
    fallbackIcon.style.display = "flex";
    fallbackIcon.style.alignItems = "center";
    fallbackIcon.style.justifyContent = "center";
    fallbackIcon.style.fontSize = "12px";
    fallbackIcon.style.fontWeight = "bold";
    fallbackIcon.textContent = group.name.charAt(0).toUpperCase();
    iconContainer.appendChild(fallbackIcon);
  };

  iconContainer.appendChild(icon);

  const name = document.createElement("span");
  name.className = "group-name";
  name.textContent = group.name;
  name.style.color = group.color || "#333";

  info.appendChild(iconContainer);
  info.appendChild(name);

  const actions = document.createElement("div");
  actions.className = "group-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.innerHTML = "✏️";
  editBtn.title = "Edit group";
  editBtn.addEventListener("click", () => editGroup(groupIndex));

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "icon-btn";
  deleteBtn.innerHTML = "🗑️";
  deleteBtn.title = "Delete group";
  deleteBtn.addEventListener("click", () => deleteGroup(groupIndex));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  header.appendChild(info);
  header.appendChild(actions);

  const categoriesList = document.createElement("div");
  categoriesList.className = "categories-list";

  Object.entries(group.categories).forEach(([categoryName, categoryData]) => {
    const symbols = Array.isArray(categoryData)
      ? categoryData
      : categoryData.symbols || [];
    const categoryItem = createCategoryItem(categoryName, symbols, groupIndex);
    categoriesList.appendChild(categoryItem);
  });

  const addCategoryBtn = document.createElement("div");
  addCategoryBtn.className = "add-category-btn";
  addCategoryBtn.innerHTML = "+ Add Category";
  addCategoryBtn.addEventListener("click", () => openCategoryModal(groupIndex));

  card.appendChild(header);
  card.appendChild(categoriesList);
  card.appendChild(addCategoryBtn);

  return card;
}

// Create category item element
function createCategoryItem(
  categoryName: string,
  symbols: string[],
  groupIndex: number,
): HTMLDivElement {
  const item = document.createElement("div");
  item.className = "category-item";

  const info = document.createElement("div");
  info.className = "category-info";

  const name = document.createElement("div");
  name.className = "category-name";
  name.textContent = categoryName;

  const symbolsText = document.createElement("div");
  symbolsText.className = "category-symbols";
  symbolsText.textContent = `${symbols.length} symbols: ${symbols.slice(0, 10).join(", ")}${symbols.length > 10 ? "..." : ""}`;

  info.appendChild(name);
  info.appendChild(symbolsText);

  const actions = document.createElement("div");
  actions.className = "category-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.innerHTML = "✏️";
  editBtn.title = "Edit category";
  editBtn.addEventListener("click", () =>
    editCategory(groupIndex, categoryName),
  );

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "icon-btn";
  deleteBtn.innerHTML = "🗑️";
  deleteBtn.title = "Delete category";
  deleteBtn.addEventListener("click", () =>
    deleteCategory(groupIndex, categoryName),
  );

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(info);
  item.appendChild(actions);

  return item;
}

// Group modal functions
function openGroupModal(groupIndex: number = -1): void {
  currentGroupIndex = groupIndex;
  const modal = document.getElementById("group-modal")!;
  const title = document.getElementById("modal-title")!;

  if (groupIndex >= 0) {
    title.textContent = "Edit Group";
    const group = configuration.groups[groupIndex];
    (document.getElementById("group-name") as HTMLInputElement).value =
      group.name;
    (document.getElementById("group-icon") as HTMLInputElement).value =
      group.iconUrl;
    (document.getElementById("group-color") as HTMLInputElement).value =
      group.color || "#c8102e";
    (document.getElementById("group-url") as HTMLInputElement).value =
      group.url || "";
  } else {
    title.textContent = "Add Group";
    (document.getElementById("group-name") as HTMLInputElement).value = "";
    (document.getElementById("group-icon") as HTMLInputElement).value = "";
    (document.getElementById("group-color") as HTMLInputElement).value =
      "#c8102e";
    (document.getElementById("group-url") as HTMLInputElement).value = "";
  }

  modal.classList.add("active");
}

function closeGroupModal(): void {
  document.getElementById("group-modal")!.classList.remove("active");
  currentGroupIndex = -1;
}

async function saveGroup(): Promise<void> {
  const name = (
    document.getElementById("group-name") as HTMLInputElement
  ).value.trim();
  const iconUrl = (
    document.getElementById("group-icon") as HTMLInputElement
  ).value.trim();
  const color = (document.getElementById("group-color") as HTMLInputElement)
    .value;
  const url = (
    document.getElementById("group-url") as HTMLInputElement
  ).value.trim();

  if (!name || !iconUrl) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  const group: SymbolGroup = {
    name,
    iconUrl,
    color,
    url: url || undefined,
    categories:
      currentGroupIndex >= 0
        ? configuration.groups[currentGroupIndex].categories
        : {},
  };

  if (currentGroupIndex >= 0) {
    configuration.groups[currentGroupIndex] = group;
  } else {
    configuration.groups.push(group);
  }

  renderGroups();
  closeGroupModal();

  // Auto-save configuration
  await saveConfigurationToStorage();
  showToast("Group saved successfully", "success");
}

function editGroup(groupIndex: number): void {
  openGroupModal(groupIndex);
}

async function deleteGroup(groupIndex: number): Promise<void> {
  if (
    confirm(
      `Are you sure you want to delete the group "${configuration.groups[groupIndex].name}"?`,
    )
  ) {
    configuration.groups.splice(groupIndex, 1);
    renderGroups();

    // Auto-save configuration
    await saveConfigurationToStorage();
    showToast("Group deleted successfully", "success");
  }
}

// Category modal functions
function openCategoryModal(
  groupIndex: number,
  categoryName: string | null = null,
): void {
  currentGroupIndex = groupIndex;
  currentEditingCategory = categoryName;
  const modal = document.getElementById("category-modal")!;
  const title = document.getElementById("category-modal-title")!;

  if (categoryName) {
    title.textContent = "Edit Category";
    const categoryData =
      configuration.groups[groupIndex].categories[categoryName];
    const symbols = Array.isArray(categoryData)
      ? categoryData
      : categoryData.symbols || [];
    const url =
      typeof categoryData === "object" && !Array.isArray(categoryData)
        ? categoryData.url
        : "";

    (document.getElementById("category-name") as HTMLInputElement).value =
      categoryName;
    (document.getElementById("category-symbols") as HTMLTextAreaElement).value =
      symbols.join(", ");
    (document.getElementById("category-url") as HTMLInputElement).value =
      url || "";
  } else {
    title.textContent = "Add Category";
    (document.getElementById("category-name") as HTMLInputElement).value = "";
    (document.getElementById("category-symbols") as HTMLTextAreaElement).value =
      "";
    (document.getElementById("category-url") as HTMLInputElement).value = "";
  }

  modal.classList.add("active");
}

function closeCategoryModal(): void {
  document.getElementById("category-modal")!.classList.remove("active");
  currentGroupIndex = -1;
  currentEditingCategory = null;
}

async function saveCategory(): Promise<void> {
  const name = (
    document.getElementById("category-name") as HTMLInputElement
  ).value.trim();
  const symbolsText = (
    document.getElementById("category-symbols") as HTMLTextAreaElement
  ).value.trim();
  const url = (
    document.getElementById("category-url") as HTMLInputElement
  ).value.trim();

  if (!name || !symbolsText) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  const symbols = symbolsText
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s);

  if (symbols.length === 0) {
    showToast("Please enter at least one symbol", "error");
    return;
  }

  // If editing, delete the old category name if it changed
  if (currentEditingCategory && currentEditingCategory !== name) {
    delete configuration.groups[currentGroupIndex].categories[
      currentEditingCategory
    ];
  }

  // Store category with URL if provided
  const categoryValue: CategoryValue = url ? { symbols, url } : symbols;
  configuration.groups[currentGroupIndex].categories[name] = categoryValue;

  renderGroups();
  closeCategoryModal();

  // Auto-save configuration
  await saveConfigurationToStorage();
  showToast("Category saved successfully", "success");
}

function editCategory(groupIndex: number, categoryName: string): void {
  openCategoryModal(groupIndex, categoryName);
}

async function deleteCategory(
  groupIndex: number,
  categoryName: string,
): Promise<void> {
  if (
    confirm(`Are you sure you want to delete the category "${categoryName}"?`)
  ) {
    delete configuration.groups[groupIndex].categories[categoryName];
    renderGroups();

    // Auto-save configuration
    await saveConfigurationToStorage();
    showToast("Category deleted successfully", "success");
  }
}

// Export configuration
function exportConfiguration(): void {
  const dataStr = JSON.stringify(configuration, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `symbol-marker-config-${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Configuration exported successfully", "success");
}

// Import configuration
async function importConfiguration(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const imported = JSON.parse(
        e.target?.result as string,
      ) as SymbolMarkerConfig;
      if (!imported.groups || !Array.isArray(imported.groups)) {
        throw new Error("Invalid configuration format");
      }

      // Ensure urlFilters exists in imported config
      if (!imported.urlFilters) {
        imported.urlFilters = { mode: "blacklist", patterns: [] };
      }

      configuration = imported;
      renderGroups();
      renderURLPatterns();

      // Update filter mode radio button
      const modeRadio = document.querySelector<HTMLInputElement>(
        `input[name="filter-mode"][value="${configuration.urlFilters?.mode || "whitelist"}"]`,
      );
      if (modeRadio) modeRadio.checked = true;

      // Save imported configuration to storage
      await saveConfigurationToStorage();

      showToast("Configuration imported and saved successfully", "success");
    } catch (error) {
      showToast(
        "Error importing configuration: " + (error as Error).message,
        "error",
      );
      console.error("Import error:", error);
    }
  };
  reader.readAsText(file);
  (event.target as HTMLInputElement).value = ""; // Reset file input
}

// Reset to default
async function resetToDefault(): Promise<void> {
  if (
    confirm(
      "Are you sure you want to reset to the default configuration? This will overwrite your current settings.",
    )
  ) {
    configuration = getDefaultConfiguration();
    await saveConfigurationToStorage();
    renderGroups();
    renderURLPatterns();

    // Reset filter mode radio button
    const modeRadio = document.querySelector<HTMLInputElement>(
      `input[name="filter-mode"][value="${configuration.urlFilters?.mode || "whitelist"}"]`,
    );
    if (modeRadio) modeRadio.checked = true;

    showToast("Configuration reset to default", "success");
  }
}

// Get default configuration
function getDefaultConfiguration(): SymbolMarkerConfig {
  return {
    groups: [
      {
        name: "Sample Group",
        iconUrl: "https://via.placeholder.com/32/4285f4/ffffff?text=S",
        color: "#4285f4",
        categories: {
          "Category A": ["EXAMPLE1", "EXAMPLE2", "EXAMPLE3"],
          "Category B": ["DEMO1", "DEMO2"],
        },
      },
    ],
    urlFilters: {
      mode: "blacklist",
      patterns: [],
    },
    floatingWindow: false,
  };
}

// Floating Window Functions
async function handleFloatingWindowToggle(event: Event): Promise<void> {
  const checkbox = event.target as HTMLInputElement;
  const isEnabled = checkbox.checked;

  configuration.floatingWindow = isEnabled;
  await saveConfigurationToStorage();

  if (isEnabled) {
    // Try to convert current window to floating window
    const success = await convertToFloatingWindow();
    if (!success) {
      // If conversion failed, show message that it will apply on next open
      showToast(
        "Floating window mode enabled. Will open as floating window next time.",
        "success",
      );
    }
  } else {
    showToast(
      "Floating window mode disabled. Will open normally next time.",
      "success",
    );
  }
}

async function checkAndConvertToFloatingWindow(): Promise<void> {
  // Only convert if floating window is enabled and we're in a popup (not already a normal window)
  if (configuration.floatingWindow) {
    // Check if we're in a popup or already in a normal window
    const currentWindow = await chrome.windows.getCurrent();
    
    console.log("Floating window check:", {
      floatingWindowEnabled: configuration.floatingWindow,
      currentWindowType: currentWindow.type,
      willConvert: currentWindow.type === "popup"
    });

    // If we're in a popup type, convert to persistent floating window
    // If already in a normal window, we're already in floating mode - do nothing
    if (currentWindow.type === "popup") {
      await convertToFloatingWindow();
    }
  }
}

async function convertToFloatingWindow(): Promise<boolean> {
  console.log("🔄 convertToFloatingWindow() called");
  try {
    // Get current window to check its type
    const currentWindow = await chrome.windows.getCurrent();
    console.log("Current window type:", currentWindow.type);

    // CRITICAL: Only proceed if we're in a popup, not a normal browser window
    // This prevents closing the entire browser window with all tabs
    if (currentWindow.type !== "popup") {
      console.log("❌ Not converting - not in a popup window");
      // Can't convert now, but preference is saved for next time
      return false;
    }
    
    console.log("✅ In popup window - proceeding with conversion");

    // Create a persistent floating window (normal type stays open when clicking away)
    const newWindow = await chrome.windows.create({
      url: chrome.runtime.getURL("popup/popup.html"),
      type: "normal", // Normal window type persists and doesn't auto-close
      width: 800,
      height: 600,
      focused: true,
      state: "normal", // Ensure it's not minimized/maximized
    });
    
    if (newWindow) {
      console.log("Created floating window:", {
        windowId: newWindow.id,
        windowType: newWindow.type,
        state: newWindow.state
      });
    }

    // Close the current popup window (safe because we verified it's a popup)
    if (currentWindow.id) {
      await chrome.windows.remove(currentWindow.id);
    }
    
    return true;
  } catch {
    showToast("Error creating floating window", "error");
    return false;
  }
}

// Show toast notification
function showToast(
  message: string,
  type: "success" | "error" = "success",
): void {
  const toast = document.getElementById("toast")!;
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// URL Filtering Functions
function getCurrentTabUrl(callback: (url: string) => void): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      callback(tabs[0].url);
    }
  });
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "";
  }
}

function setupURLFilterListeners(): void {
  // Filter mode radio buttons
  document
    .querySelectorAll<HTMLInputElement>('input[name="filter-mode"]')
    .forEach((radio) => {
      radio.addEventListener("change", async (e) => {
        if (!configuration.urlFilters) {
          configuration.urlFilters = { mode: "blacklist", patterns: [] };
        }
        configuration.urlFilters.mode = (e.target as HTMLInputElement).value as
          | "whitelist"
          | "blacklist";
        renderURLPatterns();

        // Auto-save configuration
        await saveConfigurationToStorage();
        showToast(
          `Filter mode changed to ${(e.target as HTMLInputElement).value}`,
          "success",
        );
      });
    });

  // Quick add buttons
  document
    .getElementById("add-current-domain")!
    .addEventListener("click", () => {
      getCurrentTabUrl((url) => {
        const domain = extractDomain(url);
        if (domain) {
          (
            document.getElementById("url-pattern-input") as HTMLInputElement
          ).value = domain;
          document.getElementById("pattern-preview")!.textContent =
            `Will match: ${domain}`;
        }
      });
    });

  document
    .getElementById("add-domain-subdomains")!
    .addEventListener("click", () => {
      getCurrentTabUrl((url) => {
        const domain = extractDomain(url);
        if (domain) {
          // Extract base domain (remove subdomains like www, mail, etc)
          const parts = domain.split(".");
          let baseDomain = domain;
          if (parts.length > 2) {
            // Keep only last 2 parts (e.g., example.com from www.example.com)
            baseDomain = parts.slice(-2).join(".");
          }
          const pattern = `*.${baseDomain}`;
          (
            document.getElementById("url-pattern-input") as HTMLInputElement
          ).value = pattern;
          document.getElementById("pattern-preview")!.textContent =
            `Will match: ${baseDomain} and all subdomains (e.g., www.${baseDomain}, mail.${baseDomain})`;
        }
      });
    });

  document.getElementById("add-exact-url")!.addEventListener("click", () => {
    getCurrentTabUrl((url) => {
      (document.getElementById("url-pattern-input") as HTMLInputElement).value =
        url;
      document.getElementById("pattern-preview")!.textContent =
        `Will match: ${url} (exact URL only)`;
    });
  });

  // Add pattern button
  document
    .getElementById("add-pattern-btn")!
    .addEventListener("click", addURLPattern);

  // Enter key in input
  document
    .getElementById("url-pattern-input")!
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addURLPattern();
      }
    });
}

async function addURLPattern(): Promise<void> {
  const input = document.getElementById(
    "url-pattern-input",
  ) as HTMLInputElement;
  const pattern = input.value.trim();

  if (!pattern) {
    showToast("Please enter a URL pattern", "error");
    return;
  }

  // Determine pattern type
  let type: "domain" | "regex" | "exact" | "wildcard" = "exact";
  if (pattern.startsWith("/") && pattern.endsWith("/")) {
    type = "regex";
  } else if (pattern.includes("*")) {
    type = "wildcard";
  } else if (pattern.includes(".") && !pattern.includes("/")) {
    type = "domain";
  }

  // Ensure urlFilters exists
  if (!configuration.urlFilters) {
    configuration.urlFilters = { mode: "blacklist", patterns: [] };
  }

  // Check for duplicates
  const exists = configuration.urlFilters.patterns.some(
    (p) => p.pattern === pattern,
  );
  if (exists) {
    showToast("Pattern already exists", "error");
    return;
  }

  configuration.urlFilters.patterns.push({ pattern, type });
  input.value = "";
  document.getElementById("pattern-preview")!.textContent = "";
  renderURLPatterns();

  // Auto-save configuration
  await saveConfigurationToStorage();
  showToast("Pattern added successfully", "success");
}

async function removeURLPattern(index: number): Promise<void> {
  if (!configuration.urlFilters) return;
  configuration.urlFilters.patterns.splice(index, 1);
  renderURLPatterns();

  // Auto-save configuration
  await saveConfigurationToStorage();
  showToast("Pattern removed", "success");
}

function renderURLPatterns(): void {
  const container = document.getElementById("url-patterns-list")!;

  if (
    !configuration.urlFilters ||
    !configuration.urlFilters.patterns ||
    configuration.urlFilters.patterns.length === 0
  ) {
    container.innerHTML =
      '<p class="help-text">No patterns added yet. Add patterns to control where the extension runs.</p>';
    return;
  }

  // Clear container
  container.innerHTML = "";

  // Create pattern items with proper event listeners (no inline handlers)
  configuration.urlFilters.patterns.forEach((item, index) => {
    const patternItem = document.createElement("div");
    patternItem.className = "pattern-item";

    const patternInfo = document.createElement("div");
    patternInfo.style.display = "flex";
    patternInfo.style.alignItems = "center";
    patternInfo.style.flex = "1";

    const patternText = document.createElement("span");
    patternText.className = "pattern-text";
    patternText.textContent = item.pattern;

    const patternType = document.createElement("span");
    patternType.className = "pattern-type";
    patternType.textContent = item.type;

    patternInfo.appendChild(patternText);
    patternInfo.appendChild(patternType);

    const patternActions = document.createElement("div");
    patternActions.className = "pattern-actions";

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn-icon";
    removeBtn.textContent = "🗑️";
    removeBtn.title = "Remove";
    removeBtn.addEventListener("click", () => removeURLPattern(index));

    patternActions.appendChild(removeBtn);

    patternItem.appendChild(patternInfo);
    patternItem.appendChild(patternActions);

    container.appendChild(patternItem);
  });
}
