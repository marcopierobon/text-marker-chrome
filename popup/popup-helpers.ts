// Pure helper functions for popup - testable without DOM
import type { SymbolMarkerConfig, SymbolGroup } from "../types/symbol-config";

/**
 * Get default configuration
 */
export function getDefaultConfiguration(): SymbolMarkerConfig {
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
      mode: "whitelist",
      patterns: [],
    },
  };
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "";
  }
}

/**
 * Determine pattern type from pattern string
 */
export function determinePatternType(
  pattern: string,
): "domain" | "regex" | "exact" | "wildcard" {
  if (pattern.startsWith("/") && pattern.endsWith("/")) {
    return "regex";
  } else if (pattern.includes("*")) {
    return "wildcard";
  } else if (pattern.includes(".") && !pattern.includes("/")) {
    return "domain";
  }
  return "exact";
}

/**
 * Parse symbols from comma-separated text
 */
export function parseSymbols(symbolsText: string): string[] {
  return symbolsText
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s);
}

/**
 * Validate configuration structure
 */
export function validateConfiguration(
  config: unknown,
): config is SymbolMarkerConfig {
  if (!config || typeof config !== "object") {
    return false;
  }
  const cfg = config as Partial<SymbolMarkerConfig>;
  return !!(cfg.groups && Array.isArray(cfg.groups));
}

/**
 * Validate group structure
 */
export function validateGroup(group: unknown): group is SymbolGroup {
  if (!group || typeof group !== "object") {
    return false;
  }
  const g = group as Partial<SymbolGroup>;
  return !!(
    g.name &&
    g.iconUrl &&
    g.color &&
    g.categories &&
    typeof g.categories === "object"
  );
}

/**
 * Calculate configuration size in bytes
 */
export function calculateConfigSize(config: SymbolMarkerConfig): number {
  const configStr = JSON.stringify(config);
  return new Blob([configStr]).size;
}

/**
 * Check if configuration should use local storage (>90KB)
 */
export function shouldUseLocalStorage(config: SymbolMarkerConfig): boolean {
  return calculateConfigSize(config) > 90000;
}

/**
 * Ensure configuration has urlFilters
 */
export function ensureUrlFilters(
  config: SymbolMarkerConfig,
): SymbolMarkerConfig {
  if (!config.urlFilters) {
    return {
      ...config,
      urlFilters: { mode: "whitelist", patterns: [] },
    };
  }
  return config;
}

/**
 * Extract base domain from full domain (remove subdomains)
 */
export function extractBaseDomain(domain: string): string {
  const parts = domain.split(".");
  if (parts.length > 2) {
    return parts.slice(-2).join(".");
  }
  return domain;
}

/**
 * Create wildcard pattern for domain and subdomains
 */
export function createWildcardPattern(domain: string): string {
  const baseDomain = extractBaseDomain(domain);
  return `*.${baseDomain}`;
}

/**
 * Get pattern preview text
 */
export function getPatternPreview(pattern: string, type: string): string {
  switch (type) {
    case "domain":
      return `Will match: ${pattern}`;
    case "wildcard": {
      const baseDomain = pattern.replace("*.", "");
      return `Will match: ${baseDomain} and all subdomains (e.g., www.${baseDomain}, mail.${baseDomain})`;
    }
    case "exact":
      return `Will match: ${pattern} (exact URL only)`;
    case "regex":
      return `Will match: URLs matching regex ${pattern}`;
    default:
      return `Will match: ${pattern}`;
  }
}
