// Quick Stryker configuration for testing single file
export default {
  packageManager: 'npm',
  reporters: ['clear-text', 'progress', 'html'],
  testRunner: 'jest',
  testRunnerNodeArgs: ['--experimental-vm-modules'],
  coverageAnalysis: 'perTest',
  
  // Only mutate debounce.js for quick test
  mutate: [
    'utils/debounce.js'
  ],
  
  thresholds: {
    high: 80,
    low: 60,
    break: null // Don't break build for testing
  },
  
  timeoutMS: 60000,
  timeoutFactor: 2,
  
  jest: {
    projectType: 'custom',
    config: {
      testEnvironment: 'jsdom',
      transform: {},
      testMatch: [
        '**/__tests__/**/*.test.js'
      ],
      moduleFileExtensions: ['js'],
      testPathIgnorePatterns: ['/node_modules/']
    },
    enableFindRelatedTests: true
  },
  
  // Files that need to be in sandbox
  files: [
    'utils/**/*.js',
    'shared/**/*.js',
    '__tests__/**/*.test.js',
    'jest.config.js',
    'package.json'
  ],
  
  ignorePatterns: [
    'node_modules',
    'dist',
    'coverage',
    '*.config.js',
    'content.js.old'
  ]
};
