// Unit tests for logger utility
import { jest, beforeEach, afterEach, describe, test, expect } from '@jest/globals';
import { logger, createLogger } from '../../shared/logger.js';

// Mock console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.debug = jest.fn();
});

afterEach(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
});

describe('logger', () => {
  describe('when DEBUG_MODE is false', () => {
    test('info does not log', () => {
      logger.info('test message');
      expect(console.log).not.toHaveBeenCalled();
    });

    test('warn does not log', () => {
      logger.warn('test warning');
      expect(console.warn).not.toHaveBeenCalled();
    });

    test('error always logs', () => {
      logger.error('test error');
      expect(console.error).toHaveBeenCalledWith('test error');
    });

    test('debug does not log', () => {
      logger.debug('test debug');
      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  test('handles multiple arguments', () => {
    logger.error('Error:', 'message', 123, { key: 'value' });
    expect(console.error).toHaveBeenCalledWith('Error:', 'message', 123, { key: 'value' });
  });
});

describe('createLogger', () => {
  test('creates module-specific logger', () => {
    const moduleLogger = createLogger('TestModule');
    
    moduleLogger.error('test error');
    expect(console.error).toHaveBeenCalledWith('[TestModule]', 'test error');
  });

  test('prefixes all log levels with module name', () => {
    const moduleLogger = createLogger('MyModule');
    
    moduleLogger.info('info message');
    moduleLogger.warn('warn message');
    moduleLogger.error('error message');
    moduleLogger.debug('debug message');
    
    // Only error should be called (DEBUG_MODE is false)
    expect(console.error).toHaveBeenCalledWith('[MyModule]', 'error message');
    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.debug).not.toHaveBeenCalled();
  });

  test('handles multiple arguments with module prefix', () => {
    const moduleLogger = createLogger('TestModule');
    
    moduleLogger.error('Error:', 'details', 123);
    expect(console.error).toHaveBeenCalledWith('[TestModule]', 'Error:', 'details', 123);
  });

  test('creates loggers with different module names', () => {
    const logger1 = createLogger('Module1');
    const logger2 = createLogger('Module2');
    
    logger1.error('error from module 1');
    logger2.error('error from module 2');
    
    expect(console.error).toHaveBeenCalledWith('[Module1]', 'error from module 1');
    expect(console.error).toHaveBeenCalledWith('[Module2]', 'error from module 2');
  });
});
