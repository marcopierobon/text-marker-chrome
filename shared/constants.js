// Shared constants across the extension

export const ICON_SIZE = 16;
export const CHECK_INTERVAL = 2000;
export const DEBOUNCE_DELAY = 300;
export const DEBUG_MODE = false; // Set to true for development
export const STORAGE_SIZE_LIMIT = 90000; // Chrome sync storage limit

export const TRUSTED_IMAGE_DOMAINS = [
    'googleusercontent.com',
    'githubusercontent.com',
    'cloudflare.com'
];

export const VALID_IMAGE_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'
];
