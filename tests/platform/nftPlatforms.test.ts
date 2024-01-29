import {
  detectNFTDetails,
  NFT_PLATFORM_CONFIG,
} from "../../src/platform/nftPlatforms";
import {
  ZORA_CHAIN_ID_MAPPING,
  ZoraService,
} from "../../src/platform/ZoraService";

describe("detectNFTDetails", () => {
  it("should extract NFT details for a valid Zora URL", () => {
    const zoraURL =
      "https://zora.co/collect/eth:0x1234567890123456789012345678901234567890/123";
    const expectedChain = ZORA_CHAIN_ID_MAPPING["eth"];
    const result = detectNFTDetails(zoraURL);

    expect(result).toBeDefined();
    expect(result?.platform).toBe(NFT_PLATFORM_CONFIG["Zora"]);
    expect(result?.chain).toBe(expectedChain);
    expect(result?.contractAddress).toBe(
      "0x1234567890123456789012345678901234567890"
    );
    expect(result?.nftId).toBe("123");
    expect(result?.service).toBeInstanceOf(ZoraService);
  });

  it("should return undefined for a URL not matching any platform", () => {
    const invalidURL = "https://invalid.url";
    const result = detectNFTDetails(invalidURL);
    expect(result).toBeUndefined();
  });

  it("should handle URLs without a token ID", () => {
    const zoraURLWithoutTokenId =
      "https://zora.co/collect/eth:0x1234567890123456789012345678901234567890";
    const result = detectNFTDetails(zoraURLWithoutTokenId);

    expect(result).toBeDefined();
    expect(result?.nftId).toBeUndefined();
  });
});
