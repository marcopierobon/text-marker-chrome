// Background Service Worker for Symbol Marker Extension
// Handles extension lifecycle, message routing, and state management

const DEBUG_MODE = false;

const log = {
    info: (...args) => DEBUG_MODE && console.log('[Background]', ...args),
    warn: (...args) => DEBUG_MODE && console.warn('[Background]', ...args),
    error: (...args) => console.error('[Background]', ...args)
};

log.info('Background service worker started');

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        log.info('Extension installed');
        // Could open welcome page or setup wizard here
    } else if (details.reason === 'update') {
        log.info('Extension updated to version', chrome.runtime.getManifest().version);
        // Could handle data migration here if needed
    }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    log.info('Message received:', request);
    
    // Handle different message types
    switch (request.action) {
        case 'getConfiguration':
            // Fetch configuration from storage and send to requester
            chrome.storage.sync.get(['symbolMarkerConfig'], (result) => {
                sendResponse({ configuration: result.symbolMarkerConfig });
            });
            return true; // Keep message channel open for async response
            
        case 'notifyConfigUpdate':
            // Notify all content scripts that configuration has been updated
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { 
                        action: 'reloadConfiguration' 
                    }).catch(() => {
                        // Ignore errors for tabs that don't have content script
                    });
                });
            });
            sendResponse({ success: true });
            break;
            
        default:
            log.warn('Unknown action:', request.action);
            sendResponse({ error: 'Unknown action' });
    }
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.symbolMarkerConfig) {
        log.info('Configuration changed in storage');
        // Could add additional logic here if needed
    }
});

// Keep service worker alive (optional, for long-running tasks)
// Note: Service workers are designed to be ephemeral, so this is usually not needed
// chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
// chrome.alarms.onAlarm.addListener((alarm) => {
//     if (alarm.name === 'keepAlive') {
//         log.info('Keep alive ping');
//     }
// });

log.info('Background service worker initialized');
