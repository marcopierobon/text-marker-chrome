// Jest configuration for ES6 modules
export default {
  testEnvironment: 'jsdom',
  transform: {},
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'shared/**/*.js',
    'utils/**/*.js',
    'content/**/*.js',
    '!content/content.js.old',
    '!**/*.test.js',
    '!**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};
