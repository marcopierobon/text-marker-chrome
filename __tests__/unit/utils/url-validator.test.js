// Unit tests for URL validator utility
import { describe, test, expect } from '@jest/globals';
import { isValidImageUrl, sanitizeUrl } from '../../utils/url-validator.js';

describe('url-validator', () => {
  describe('isValidImageUrl', () => {
    test('accepts valid HTTPS image URLs with extensions', () => {
      expect(isValidImageUrl('https://example.com/image.png')).toBe(true);
      expect(isValidImageUrl('https://example.com/photo.jpg')).toBe(true);
      expect(isValidImageUrl('https://example.com/pic.jpeg')).toBe(true);
      expect(isValidImageUrl('https://example.com/icon.svg')).toBe(true);
      expect(isValidImageUrl('https://example.com/graphic.webp')).toBe(true);
      expect(isValidImageUrl('https://example.com/favicon.ico')).toBe(true);
    });

    test('accepts URLs from trusted domains without extensions', () => {
      expect(isValidImageUrl('https://lh3.googleusercontent.com/abc123')).toBe(true);
      expect(isValidImageUrl('https://raw.githubusercontent.com/user/repo/main/image')).toBe(true);
      expect(isValidImageUrl('https://cdn.cloudflare.com/image')).toBe(true);
    });

    test('rejects non-HTTPS URLs', () => {
      expect(isValidImageUrl('http://example.com/image.png')).toBe(false);
      expect(isValidImageUrl('ftp://example.com/image.png')).toBe(false);
      expect(isValidImageUrl('file:///path/to/image.png')).toBe(false);
    });

    test('rejects URLs without valid extensions or trusted domains', () => {
      expect(isValidImageUrl('https://example.com/notanimage.txt')).toBe(false);
      expect(isValidImageUrl('https://example.com/file.pdf')).toBe(false);
      expect(isValidImageUrl('https://example.com/document')).toBe(false);
    });

    test('rejects invalid URLs', () => {
      expect(isValidImageUrl('not-a-url')).toBe(false);
      expect(isValidImageUrl('')).toBe(false);
      expect(isValidImageUrl('javascript:alert(1)')).toBe(false);
    });

    test('handles edge cases', () => {
      expect(isValidImageUrl('https://example.com/image.PNG')).toBe(true); // Case insensitive
      expect(isValidImageUrl('https://example.com/path/to/image.png')).toBe(true); // Nested path
      expect(isValidImageUrl('https://example.com/image.png?query=param')).toBe(true); // Query params
    });
  });

  describe('sanitizeUrl', () => {
    test('returns valid URLs unchanged', () => {
      const url = 'https://example.com/image.png';
      expect(sanitizeUrl(url)).toBe(url);
    });

    test('handles URLs with special characters', () => {
      const url = 'https://example.com/image with spaces.png';
      const result = sanitizeUrl(url);
      expect(result).toContain('https://example.com/');
    });

    test('returns empty string for invalid URLs', () => {
      expect(sanitizeUrl('not-a-url')).toBe('');
      expect(sanitizeUrl('')).toBe('');
      // Note: javascript: URLs are technically valid URLs, just not safe
      // The URL constructor doesn't reject them, so we get the URL back
      // This should be combined with isValidImageUrl() for safety
    });

    test('normalizes URLs', () => {
      const url = 'https://example.com:443/path';
      const result = sanitizeUrl(url);
      expect(result).toBe('https://example.com/path');
    });
  });
});
