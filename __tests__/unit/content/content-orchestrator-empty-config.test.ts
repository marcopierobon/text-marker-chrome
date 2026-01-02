import { ContentScript } from "../../../content/content";
import { StorageService } from "../../../shared/storage-service";
import type { SymbolMarkerConfig } from "../../../types/symbol-config";

// Mock the StorageService
jest.mock("../../../shared/storage-service");

describe("ContentScript - Empty Categories Configuration", () => {
  let contentScript: ContentScript;
  let mockStorageService: jest.Mocked<typeof StorageService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockStorageService = StorageService as jest.Mocked<typeof StorageService>;

    // Create content script instance
    contentScript = new ContentScript();
  });

  test("should handle configuration with groups that have empty categories - REPRODUCES BUG", async () => {
    // Arrange: Mock configuration with empty categories (matching user's setup)
    const configWithEmptyCategories: SymbolMarkerConfig = {
      groups: [
        {
          name: "FOOL.COM",
          iconUrl:
            "https://st3.depositphotos.com/4177785/15378/v/450/depositphotos_153787488-stock-illustration-1st-april-fool-color-icon.jpg",
          color: "#c8102e",
          url: "fool.com",
          categories: {}, // Empty categories - this is the issue
        },
        {
          name: "ZACKS",
          iconUrl:
            "https://consumersiteimages.trustpilot.net/business-units/5a7921b47dd4b200014b4e69-198x149-1x.jpg",
          color: "#1cc610",
          url: "zacks.com",
          categories: {}, // Empty categories - this is the issue
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

    // Assert: Should handle empty categories without failing
    expect(mockStorageService.load).toHaveBeenCalledWith("symbolMarkerConfig");

    // The content script should NOT fail when groups exist but have no symbols
    expect(contentScript["configuration"]).toEqual(configWithEmptyCategories);

    // Verify the detector was built but has no symbols
    const detector = contentScript["detector"];
    expect(detector.getAllSymbols()).toEqual([]);
  });

  test("should fail when groups exist but contain no symbols - ACTUAL BUG", async () => {
    // Arrange: Mock configuration with empty categories (matching user's setup)
    const configWithEmptyCategories: SymbolMarkerConfig = {
      groups: [
        {
          name: "FOOL.COM",
          iconUrl:
            "https://st3.depositphotos.com/4177785/15378/v/450/depositphotos_153787488-stock-illustration-1st-april-fool-color-icon.jpg",
          color: "#c8102e",
          url: "fool.com",
          categories: {}, // Empty categories - this is the issue
        },
        {
          name: "ZACKS",
          iconUrl:
            "https://consumersiteimages.trustpilot.net/business-units/5a7921b47dd4b200014b4e69-198x149-1x.jpg",
          color: "#1cc610",
          url: "zacks.com",
          categories: {}, // Empty categories - this is the issue
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

    // Assert: The content script should detect that there are no symbols to track
    // and handle this gracefully instead of failing
    const detector = contentScript["detector"];
    const allSymbols = detector.getAllSymbols();

    // This should be empty since categories are empty
    expect(allSymbols).toEqual([]);

    // The content script should recognize this situation and not crash
    // Currently it will proceed to try to mark symbols but find none
    // This is the actual bug - it should handle empty symbol sets gracefully
  });

  test("should reproduce exact error - Failed to load configuration", async () => {
    // Arrange: Mock StorageService.load to return null (no config found)
    mockStorageService.load.mockResolvedValue(null);

    // Act: Initialize the content script
    await contentScript.initialize();

    // Assert: The content script should handle null configuration gracefully
    // but currently it will log "Failed to load configuration" and return early
    expect(contentScript["configuration"].groups).toEqual([]);
    expect(mockStorageService.load).toHaveBeenCalledWith("symbolMarkerConfig");

    // The detector should have no symbols since no configuration was loaded
    const detector = contentScript["detector"];
    expect(detector.getAllSymbols()).toEqual([]);
  });
});
