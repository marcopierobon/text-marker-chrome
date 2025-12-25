// Advanced unit tests for Logger - Module name formatting edge cases
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { createLogger } from '../../shared/logger.js';

describe('Logger - Advanced Tests', () => {
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;
  let consoleDebugSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('Module Name Formatting', () => {
    test('handles empty module name', () => {
      const logger = createLogger('');
      
      // Error should always log
      logger.error('test message');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[]', 'test message');
    });

    test('handles very long module names', () => {
      const longName = 'A'.repeat(200);
      const logger = createLogger(longName);
      
      logger.error('test message');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(`[${longName}]`, 'test message');
    });

    test('handles special characters in module names', () => {
      const specialNames = [
        'Module<script>alert(1)</script>',
        'Module&Co.',
        'Module "quoted"',
        "Module 'single'",
        'Module\nNewline',
        'Module\tTab',
        'Module!@#$%^&*()',
        'Module[brackets]',
        'Module{braces}',
        'Module/slash\\backslash'
      ];

      specialNames.forEach(name => {
        const logger = createLogger(name);
        logger.error('test');
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(`[${name}]`, 'test');
        consoleErrorSpy.mockClear();
      });
    });

    test('handles Unicode characters in module names', () => {
      const unicodeNames = [
        'Module中文',
        'Module日本語',
        'Moduleрусский',
        'Module🚀',
        'Module™',
        'Module©'
      ];

      unicodeNames.forEach(name => {
        const logger = createLogger(name);
        logger.error('test');
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(`[${name}]`, 'test');
        consoleErrorSpy.mockClear();
      });
    });

    test('handles whitespace-only module names', () => {
      const whitespaceNames = [
        '   ',
        '\t\t',
        '\n\n',
        '  \t  \n  '
      ];

      whitespaceNames.forEach(name => {
        const logger = createLogger(name);
        logger.error('test');
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(`[${name}]`, 'test');
        consoleErrorSpy.mockClear();
      });
    });

    test('handles module names with multiple words', () => {
      const logger = createLogger('Content Script Manager');
      
      logger.error('test message');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Content Script Manager]', 'test message');
    });

    test('preserves exact module name formatting', () => {
      const names = [
        'lowercase',
        'UPPERCASE',
        'MixedCase',
        'camelCase',
        'PascalCase',
        'snake_case',
        'kebab-case'
      ];

      names.forEach(name => {
        const logger = createLogger(name);
        logger.error('test');
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(`[${name}]`, 'test');
        consoleErrorSpy.mockClear();
      });
    });
  });

  describe('Logger with Multiple Arguments', () => {
    test('handles multiple arguments with special module names', () => {
      const logger = createLogger('Special<>Module');
      
      logger.error('message', { key: 'value' }, [1, 2, 3], 'extra');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Special<>Module]',
        'message',
        { key: 'value' },
        [1, 2, 3],
        'extra'
      );
    });

    test('handles objects and arrays in log messages', () => {
      const logger = createLogger('Test');
      
      const obj = { nested: { deep: 'value' } };
      const arr = [1, [2, [3, 4]]];
      
      logger.error('complex', obj, arr);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Test]', 'complex', obj, arr);
    });
  });

  describe('Logger Instance Independence', () => {
    test('different loggers with different module names are independent', () => {
      const logger1 = createLogger('Module1');
      const logger2 = createLogger('Module2');
      
      logger1.error('from module 1');
      logger2.error('from module 2');
      
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, '[Module1]', 'from module 1');
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, '[Module2]', 'from module 2');
    });

    test('creating multiple loggers with same name works correctly', () => {
      const logger1 = createLogger('SameName');
      const logger2 = createLogger('SameName');
      
      logger1.error('from logger 1');
      logger2.error('from logger 2');
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, '[SameName]', 'from logger 1');
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, '[SameName]', 'from logger 2');
    });
  });

  describe('Edge Cases', () => {
    test('handles null as module name', () => {
      const logger = createLogger(null);
      
      logger.error('test');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[null]', 'test');
    });

    test('handles undefined as module name', () => {
      const logger = createLogger(undefined);
      
      logger.error('test');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[undefined]', 'test');
    });

    test('handles number as module name', () => {
      const logger = createLogger(12345);
      
      logger.error('test');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[12345]', 'test');
    });

    test('handles boolean as module name', () => {
      const logger = createLogger(true);
      
      logger.error('test');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[true]', 'test');
    });
  });
});
