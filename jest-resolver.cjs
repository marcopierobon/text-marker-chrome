// Custom Jest resolver to handle .js imports resolving to .ts files
const { resolve } = require('path');
const { existsSync } = require('fs');

module.exports = (path, options) => {
  // Try to resolve the path as-is first
  try {
    return options.defaultResolver(path, options);
  } catch (e) {
    // If it ends with .js, try .ts instead
    if (path.endsWith('.js')) {
      const tsPath = path.replace(/\.js$/, '.ts');
      const resolvedTsPath = resolve(options.basedir, tsPath);
      
      if (existsSync(resolvedTsPath)) {
        return resolvedTsPath;
      }
    }
    
    // If still not found, throw the original error
    throw e;
  }
};
