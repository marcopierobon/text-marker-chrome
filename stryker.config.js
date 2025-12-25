// Stryker configuration for mutation testing - Full repo
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  testRunnerNodeArgs: ['--experimental-vm-modules'],
  coverageAnalysis: 'perTest',
  
  // Files to mutate - all testable code
  mutate: [
    'shared/**/*.js',
    'utils/**/*.js',
    'content/symbol-detector.js',
    'content/badge-renderer.js',
    '!content/content.js.old',
    '!content/content.js' // Skip main orchestrator for now
  ],
  
  // Thresholds for mutation score
  thresholds: {
    high: 80,
    low: 60,
    break: 50 // Fail build if mutation score below 50%
  },
  
  // Timeout settings
  timeoutMS: 60000,
  timeoutFactor: 2,
  
  // Jest configuration
  jest: {
    projectType: 'custom',
    config: {
      testEnvironment: '@stryker-mutator/jest-runner/jest-env/jsdom',
      transform: {},
      testMatch: [
        '**/__tests__/**/*.test.js'
      ],
      moduleFileExtensions: ['js'],
      testPathIgnorePatterns: ['/node_modules/', '/__tests__/e2e/']
    },
    enableFindRelatedTests: true
  },
  
  // Ignore patterns (don't ignore test files!)
  ignorePatterns: [
    'node_modules/**',
    'dist/**',
    'coverage/**',
    'reports/**',
    '.stryker-tmp/**',
    '**/*.config.js',
    'content/content.js.old',
    'content/content.js', // Skip main orchestrator
    'popup/**', // Skip popup for now
    'background.js' // Skip background
  ],
  
  // Mutation types to apply
  mutator: {
    excludedMutations: [
      'StringLiteral', // Don't mutate log messages
      'ObjectLiteral' // Don't mutate config objects
    ]
  },
  
  // Incremental mode for faster subsequent runs
  incremental: true,
  incrementalFile: '.stryker-tmp/incremental.json'
};
