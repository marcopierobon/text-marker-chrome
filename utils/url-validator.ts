// URL validation utilities

import {
  TRUSTED_IMAGE_DOMAINS,
  VALID_IMAGE_EXTENSIONS,
} from "../shared/constants";
import { createLogger } from "../shared/logger";

const log = createLogger("URLValidator");

/**
 * Validates if a URL is a valid and safe image URL
 * @param url - The URL to validate
 * @returns True if valid, false otherwise
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // Only allow HTTPS URLs for security
    if (urlObj.protocol !== "https:") {
      log.warn("Non-HTTPS image URL rejected:", url);
      return false;
    }

    // Check for valid image extensions
    const hasValidExt = VALID_IMAGE_EXTENSIONS.some((ext: string) =>
      urlObj.pathname.toLowerCase().endsWith(ext),
    );

    // Also allow URLs from known CDNs without extension check
    const isTrustedDomain = TRUSTED_IMAGE_DOMAINS.some((domain: string) =>
      urlObj.hostname.includes(domain),
    );

    return hasValidExt || isTrustedDomain;
  } catch (e) {
    log.error("Invalid image URL:", url, e);
    return false;
  }
}

/**
 * Sanitizes a URL by removing potentially dangerous protocols
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url) {
    return "";
  }

  try {
    const urlObj = new URL(url);

    // Only allow safe protocols
    const safeProtocols = ["https:", "http:"];
    if (!safeProtocols.includes(urlObj.protocol)) {
      log.warn("Unsafe protocol rejected:", urlObj.protocol);
      return "";
    }

    return urlObj.href;
  } catch (e) {
    log.error("Invalid URL for sanitization:", url, e);
    return "";
  }
}
