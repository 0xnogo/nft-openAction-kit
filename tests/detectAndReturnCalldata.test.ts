import { Chain } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { zora } from "viem/chains";
import { detectAndReturnCalldata } from "../src";
import { detectNFTDetails } from "../src/platform/nftPlatforms";
import { NFTExtraction, UIData } from "../src/types";

// Mock the nftPlatformsConfig module
jest.mock("../src/platform/nftPlatforms", () => ({
  detectNFTDetails: jest.fn(),
}));

// TypeScript type casting for Jest mocks
const mockDetectNFTDetails = detectNFTDetails as jest.Mock;
const dummyAddress = privateKeyToAccount(generatePrivateKey()).address;

type MockService = {
  getMintSignature: jest.Mock<Promise<string | undefined>, [NFTExtraction]>;
  getUIData: jest.Mock<Promise<UIData | undefined>, [string, string, bigint]>;
  getPrice: jest.Mock<
    Promise<bigint | undefined>,
    [Chain, string, bigint, string, bigint?]
  >;
  getArgs: jest.Mock<any[], [bigint, string, string, string]>;
};

let mockService: MockService;

describe("detectAndReturnCalldata tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockDetectNFTDetails.mockClear();

    // Set up a mock service
    mockService = {
      getMintSignature: jest.fn(),
      getUIData: jest.fn(),
      getPrice: jest.fn(),
      getArgs: jest.fn(),
    };
  });

  it("should return undefined if detectNFTDetails returns undefined", async () => {
    mockDetectNFTDetails.mockReturnValueOnce(undefined);

    const result = await detectAndReturnCalldata("someURI");
    expect(result).toBeUndefined();
    expect(mockDetectNFTDetails).toHaveBeenCalledWith("someURI");
  });

  it("should return correct data when detectNFTDetails returns valid NFT details", async () => {
    // Mock NFT details
    const mockNFTDetails = {
      platform: {
        platformName: "Zora",
        platformLogoUrl: "https://zora.co/favicon.ico",
      },
      chain: zora,
      contractAddress: dummyAddress,
      nftId: "456",
      service: mockService,
    };
    mockDetectNFTDetails.mockReturnValueOnce(mockNFTDetails);

    // Mock service method
    const mintSignature = "0xMintSignature";
    mockService.getMintSignature.mockResolvedValue(mintSignature);

    const result = await detectAndReturnCalldata("someURI");
    expect(result).toBeDefined();
    expect(mockService.getMintSignature).toHaveBeenCalled();
  });

  it("should return undefined when getMintSignature returns undefined", async () => {
    const mockNFTDetails = {
      platform: {
        platformName: "Zora",
        platformLogoUrl: "https://zora.co/favicon.ico",
      },
      chain: zora,
      contractAddress: dummyAddress,
      nftId: "456",
      service: mockService,
    };
    mockDetectNFTDetails.mockReturnValueOnce(mockNFTDetails);
    mockService.getMintSignature.mockResolvedValue(undefined);

    const result = await detectAndReturnCalldata("someURI");
    expect(result).toBeUndefined();
  });

  it("should return undefined for an URL not matching any platform", async () => {
    const invalidURL = "https://invalid.url";
    const result = await detectAndReturnCalldata(invalidURL);
    expect(result).toBeUndefined();
  });
});
