// Shared constants

export const DEBUG_MODE = false;

export const ICON_SIZE = 16;

export const CHECK_INTERVAL = 2000; // 2 seconds

export const DEBOUNCE_DELAY = 300; // 300ms

export const STORAGE_SIZE_LIMIT = 90000; // Chrome sync storage quota per item

export const VALID_IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".ico",
  ".bmp",
  ".tiff",
] as const;

export const TRUSTED_IMAGE_DOMAINS = [
  "cloudinary.com",
  "imgur.com",
  "googleusercontent.com",
  "githubusercontent.com",
  "cloudflare.com",
] as const;

export type ValidImageExtension = (typeof VALID_IMAGE_EXTENSIONS)[number];
export type TrustedImageDomain = (typeof TRUSTED_IMAGE_DOMAINS)[number];
