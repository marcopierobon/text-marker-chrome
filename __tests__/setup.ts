// Test setup to suppress expected console errors
const originalError = console.error;

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress expected validation and error-handling test errors
    const message = args[0]?.toString() || "";
    if (
      message.includes("[URLValidator] Invalid image URL") ||
      message.includes("[URLValidator] Invalid URL for sanitization") ||
      message.includes("[StorageService] Error") ||
      message.includes("Invalid URL")
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
