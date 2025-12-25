// URL validation utilities

import { TRUSTED_IMAGE_DOMAINS, VALID_IMAGE_EXTENSIONS } from '../shared/constants.js';
import { createLogger } from '../shared/logger.js';

const log = createLogger('URLValidator');

/**
 * Validates if a URL is a valid and safe image URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidImageUrl(url) {
    try {
        const urlObj = new URL(url);
        
        // Only allow HTTPS URLs for security
        if (urlObj.protocol !== 'https:') {
            log.warn('Non-HTTPS image URL rejected:', url);
            return false;
        }
        
        // Check for valid image extensions
        const hasValidExt = VALID_IMAGE_EXTENSIONS.some(ext => 
            urlObj.pathname.toLowerCase().endsWith(ext)
        );
        
        // Also allow URLs from known CDNs without extension check
        const isTrustedDomain = TRUSTED_IMAGE_DOMAINS.some(domain => 
            urlObj.hostname.includes(domain)
        );
        
        return hasValidExt || isTrustedDomain;
    } catch (e) {
        log.error('Invalid image URL:', url, e);
        return false;
    }
}

/**
 * Sanitizes a URL by encoding special characters
 * @param {string} url - The URL to sanitize
 * @returns {string} - Sanitized URL
 */
export function sanitizeUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.href;
    } catch (e) {
        log.error('Failed to sanitize URL:', url, e);
        return '';
    }
}
