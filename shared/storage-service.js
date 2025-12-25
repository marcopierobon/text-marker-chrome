// Storage service - abstracts Chrome storage API
// Handles hybrid sync/local storage based on size

import { STORAGE_SIZE_LIMIT } from './constants.js';
import { createLogger } from './logger.js';

const log = createLogger('StorageService');

export class StorageService {
    /**
     * Load configuration from storage (tries sync first, then local)
     */
    static async load(key) {
        try {
            // Try sync storage first
            let result = await chrome.storage.sync.get([key]);
            
            if (result[key]) {
                log.info('Loaded from sync storage');
                return result[key];
            }
            
            // Fallback to local storage
            result = await chrome.storage.local.get([key]);
            
            if (result[key]) {
                log.info('Loaded from local storage');
                return result[key];
            }
            
            return null;
        } catch (error) {
            log.error('Error loading from storage:', error);
            throw error;
        }
    }

    /**
     * Save configuration to appropriate storage based on size
     */
    static async save(key, data) {
        try {
            const dataStr = JSON.stringify(data);
            const dataSize = new Blob([dataStr]).size;
            
            log.info(`Saving data, size: ${dataSize} bytes`);
            
            // Use local storage if data is too large for sync
            if (dataSize > STORAGE_SIZE_LIMIT) {
                log.info('Data too large for sync storage, using local');
                await chrome.storage.local.set({ [key]: data });
                // Clear from sync if it was there
                await chrome.storage.sync.remove([key]);
            } else {
                await chrome.storage.sync.set({ [key]: data });
            }
            
            log.info('Data saved successfully');
            return true;
        } catch (error) {
            log.error('Error saving to storage:', error);
            // Fallback to local storage
            try {
                await chrome.storage.local.set({ [key]: data });
                log.info('Saved to local storage (fallback)');
                return true;
            } catch (localError) {
                log.error('Error saving to local storage:', localError);
                throw localError;
            }
        }
    }

    /**
     * Remove data from both storages
     */
    static async remove(key) {
        try {
            await Promise.all([
                chrome.storage.sync.remove([key]),
                chrome.storage.local.remove([key])
            ]);
            log.info(`Removed ${key} from storage`);
            return true;
        } catch (error) {
            log.error('Error removing from storage:', error);
            throw error;
        }
    }

    /**
     * Clear all storage
     */
    static async clear() {
        try {
            await Promise.all([
                chrome.storage.sync.clear(),
                chrome.storage.local.clear()
            ]);
            log.info('Storage cleared');
            return true;
        } catch (error) {
            log.error('Error clearing storage:', error);
            throw error;
        }
    }
}
