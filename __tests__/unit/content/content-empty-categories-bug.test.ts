import { ContentScript } from "../../../content/content";
import { StorageService } from "../../../shared/storage-service";
import type { SymbolMarkerConfig } from "../../../types/symbol-config";

// Mock the StorageService
jest.mock("../../../shared/storage-service");

describe("ContentScript - Empty Categories Bug Reproduction", () => {
  let contentScript: ContentScript;
  let mockStorageService: jest.Mocked<typeof StorageService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockStorageService = StorageService as jest.Mocked<typeof StorageService>;

    // Create content script instance
    contentScript = new ContentScript();
  });

  test("should handle configuration with groups that have empty categories", async () => {
    // Arrange: Mock configuration with groups that have empty categories (matching user's setup)
    const configWithEmptyCategories: SymbolMarkerConfig = {
      groups: [
        {
          name: "FOOL.COM",
          iconUrl:
            "https://st3.depositphotos.com/4177785/15378/v/450/depositphotos_153787488-stock-illustration-1st-april-fool-color-icon.jpg",
          color: "#c8102e",
          url: "fool.com",
          categories: {}, // Empty categories - this was causing the bug
        },
        {
          name: "ZACKS",
          iconUrl:
            "https://consumersiteimages.trustpilot.net/business-units/5a7921b47dd4b200014b4e69-198x149-1x.jpg",
          color: "#1cc610",
          url: "zacks.com",
          categories: {}, // Empty categories - this was causing the bug
        },
      ],
      urlFilters: {
        mode: "blacklist",
        patterns: [],
      },
      floatingWindow: false,
    };

    mockStorageService.load.mockResolvedValue(configWithEmptyCategories);

    // Act: Initialize the content script
    await contentScript.initialize();

    // Assert: The content script should handle empty categories gracefully
    const detector = contentScript["detector"];
    const allSymbols = detector.getAllSymbols();

    // This should be empty since categories are empty
    expect(allSymbols).toEqual([]);

    // The content script should handle this gracefully by checking
    // if there are actual symbols to track before proceeding
    // The fix ensures markSymbols() returns early when no symbols exist

    // Verify that the content script handles empty symbol sets gracefully
    // It should not crash and should recognize the empty state
    expect(contentScript["configuration"]).toEqual(configWithEmptyCategories);

    // The fix should prevent the "Failed to load configuration" error
    // when groups exist but have no symbols to track

    // With the backwards condition (length > 0), when symbols.length = 0:
    // - The condition 0 > 0 is false
    // - So markSymbols should proceed (which is wrong behavior)
    // - This should cause issues similar to the browser error

    // Let's verify that markSymbols actually tries to proceed when it shouldn't
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    contentScript["markSymbols"]();

    // With corrected guard, markSymbols should early-return before logging
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("should return symbols when first group is empty but second contains symbols", async () => {
    const configWithPartialSymbols: SymbolMarkerConfig = {
      groups: [
        {
          name: "EMPTY GROUP",
          iconUrl:
            "https://static.example.com/empty-icon.png",
          color: "#000000",
          url: "empty.com",
          categories: {},
        },
        {
          name: "ETORO",
          iconUrl:
            "https://static.example.com/etoro-icon.png",
          color: "#0a74da",
          url: "etoro.com",
          categories: {
            INVESTORS: ["01336.HK", "KGC"],
          },
        },
      ],
      urlFilters: {
        mode: "blacklist",
        patterns: [],
      },
      floatingWindow: false,
    };

    mockStorageService.load.mockResolvedValue(configWithPartialSymbols);

    await contentScript.initialize();

    const detector = contentScript["detector"];
    const allSymbols = detector.getAllSymbols();

    expect(allSymbols.sort()).toEqual(["01336.HK", "KGC"]);
    const groupsForKGC = detector.getGroupsForSymbol("KGC");
    expect(groupsForKGC).toHaveLength(1);
    expect(groupsForKGC[0].groupName).toBe("ETORO");
  });
});
