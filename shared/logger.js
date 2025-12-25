// Logging utility with conditional debug mode

import { DEBUG_MODE } from './constants.js';

export const logger = {
    info: (...args) => DEBUG_MODE && console.log(...args),
    warn: (...args) => DEBUG_MODE && console.warn(...args),
    error: (...args) => console.error(...args), // Always log errors
    debug: (...args) => DEBUG_MODE && console.debug(...args)
};

// Specialized loggers for different modules
export const createLogger = (moduleName) => ({
    info: (...args) => logger.info(`[${moduleName}]`, ...args),
    warn: (...args) => logger.warn(`[${moduleName}]`, ...args),
    error: (...args) => logger.error(`[${moduleName}]`, ...args),
    debug: (...args) => logger.debug(`[${moduleName}]`, ...args)
});
