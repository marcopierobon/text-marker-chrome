// Rollup configuration for bundling Chrome extension modules
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'content/content.js',
  output: {
    file: 'dist/content.js',
    format: 'iife',
    name: 'ContentScript',
    sourcemap: true // Helpful for debugging
  },
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false
    })
  ]
};
