// Logging utility

import { DEBUG_MODE } from "./constants";
import type { Logger } from "../types/logger";

export const logger: Logger = {
  info: (...args: unknown[]): void => {
    if (DEBUG_MODE) console.log(...args);
  },
  warn: (...args: unknown[]): void => {
    if (DEBUG_MODE) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  }, // Always log errors
  debug: (...args: unknown[]): void => {
    if (DEBUG_MODE) console.debug(...args);
  },
};

/**
 * Creates a logger with a module name prefix
 * @param moduleName - The name of the module using the logger
 * @returns Logger instance with prefixed messages
 */
export function createLogger(moduleName: string): Logger {
  return {
    info: (...args: unknown[]): void => logger.info(`[${moduleName}]`, ...args),
    warn: (...args: unknown[]): void => logger.warn(`[${moduleName}]`, ...args),
    error: (...args: unknown[]): void =>
      logger.error(`[${moduleName}]`, ...args),
    debug: (...args: unknown[]): void =>
      logger.debug(`[${moduleName}]`, ...args),
  };
}

export default logger;
