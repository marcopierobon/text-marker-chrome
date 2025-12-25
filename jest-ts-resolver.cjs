// Custom Jest resolver for TypeScript modules
const { resolve: pathResolve } = require('path');
const { existsSync } = require('fs');

module.exports = (request, options) => {
  // Try to resolve the path as-is first
  try {
    return options.defaultResolver(request, options);
  } catch (e) {
    // If it fails, try adding .ts extension
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    for (const ext of extensions) {
      const requestWithExt = request + ext;
      try {
        const resolved = options.defaultResolver(requestWithExt, options);
        return resolved;
      } catch (err) {
        // Continue to next extension
      }
    }
    
    // If still not found, throw the original error
    throw e;
  }
};
