// Chrome API mock helpers for tests
// Provides properly typed Chrome API mocks without 'as any'

export function createChromeMock() {
  return {
    storage: {
      sync: {
        get: jest.fn<Promise<any>, any[]>().mockResolvedValue({}) as any,
        set: jest
          .fn<Promise<void>, any[]>()
          .mockResolvedValue(undefined) as any,
        remove: jest
          .fn<Promise<void>, any[]>()
          .mockResolvedValue(undefined) as any,
        clear: jest
          .fn<Promise<void>, any[]>()
          .mockResolvedValue(undefined) as any,
      },
      local: {
        get: jest.fn<Promise<any>, any[]>().mockResolvedValue({}) as any,
        set: jest
          .fn<Promise<void>, any[]>()
          .mockResolvedValue(undefined) as any,
        remove: jest
          .fn<Promise<void>, any[]>()
          .mockResolvedValue(undefined) as any,
        clear: jest
          .fn<Promise<void>, any[]>()
          .mockResolvedValue(undefined) as any,
      },
    },
    tabs: {
      query: jest
        .fn<void, any[]>()
        .mockImplementation((_query, callback) => callback([])) as any,
      sendMessage: jest.fn<Promise<any>, any[]>().mockResolvedValue({}) as any,
    },
  };
}

export function setupChromeMock() {
  (global as any).chrome = createChromeMock();
}

export function createBlobMock() {
  return class MockBlob {
    parts: any;
    options: any;
    constructor(parts?: any, options?: any) {
      this.parts = parts;
      this.options = options;
    }
    get size(): number {
      return JSON.stringify(this.parts).length;
    }
  };
}

export function createURLMock() {
  return class MockURL {
    hostname: string;
    constructor(url: string) {
      const match = url.match(/^https?:\/\/([^\/]+)/);
      this.hostname = match ? match[1] : "";
    }
    static createObjectURL = jest.fn(() => "blob:mock-url");
    static revokeObjectURL = jest.fn();
  };
}

export function setupGlobalMocks() {
  setupChromeMock();
  (global as any).Blob = createBlobMock();
  (global as any).URL = createURLMock();
}
