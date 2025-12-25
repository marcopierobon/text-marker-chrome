// Type definitions for symbol configuration

export interface CategoryWithUrl {
  symbols: string[];
  url: string;
}

export type CategoryValue = string[] | CategoryWithUrl;

export interface SymbolGroup {
  name: string;
  iconUrl: string;
  color: string;
  url?: string;
  categories: Record<string, CategoryValue>;
}

export interface SymbolMarkerConfig {
  groups: SymbolGroup[];
  urlFilters?: UrlFilters;
}

export interface UrlFilters {
  mode: "whitelist" | "blacklist";
  patterns: UrlPattern[];
}

export interface UrlPattern {
  pattern: string;
  type: "domain" | "regex" | "exact" | "wildcard";
}
