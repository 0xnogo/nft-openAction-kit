import { parseEther } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { NFTExtraction, NftOpenActionKit, PublicationInfo } from "../src";
import { CHAIN_CONFIG } from "../src/config/constants";
import { IPlatformService } from "../src/interfaces/IPlatformService";
import { bigintSerializer } from "../src/utils";

const DUMMY_ADDRESS = privateKeyToAccount(generatePrivateKey()).address;

const mockPlatformService: jest.Mocked<IPlatformService> = {
  platformName: "Mock Platform",
  getMinterAddress: jest.fn().mockResolvedValue("0xMockMinterAddress"),
  getMintSignature: jest.fn().mockResolvedValue("mock-signature"),
  getUIData: jest.fn().mockResolvedValue({
    platformName: "Mock Platform",
    platformLogoUrl: "https://mockplatform.logo",
    nftName: "Mock NFT Name",
    nftUri: "https://mocknft.uri",
    nftCreatorAddress: "0xMockCreatorAddress",
  }),
  getPrice: jest.fn().mockResolvedValue(parseEther("1")), // Mock price as 1 ETH
  getArgs: jest
    .fn()
    .mockResolvedValue(["0xMockArg1", BigInt(1), "0xMockArg2", BigInt(2)]),
};

// Sample post data for testing
const mockPost: PublicationInfo = {
  profileId: "48935",
  actionModules: [CHAIN_CONFIG.decentOpenActionContractAddress],
  actionModulesInitDatas: [
    "0x000000000000000000000000751362d366f66ecb70bf67e0d941daa7e34635f5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002105000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000006c66756e6374696f6e206d696e745769746852657761726473286164647265737320726563697069656e742c2075696e74323536207175616e746974792c20737472696e672063616c6c6461746120636f6d6d656e742c2061646472657373206d696e74526566657272616c29000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a6f726100000000000000000000000000000000000000000000000000000000",
  ],
  pubId: "10",
};

describe("detectAndReturnCalldata", () => {
  let nftOpenActionKit: any;

  beforeEach(() => {
    // Setup NftOpenActionKit with necessary mocks
    nftOpenActionKit = new NftOpenActionKit({
      decentApiKey: "mock-api-key",
      raribleApiKey: "mock-rarible-key",
    });
  });

  it("should generate calldata for a valid NFT URL", async () => {
    // Provide a mock URL and expected mock response for successful detection
    const mockUrl = "https://example.com/nft/zora/123";
    const expectedResult: NFTExtraction = {
      contractAddress: DUMMY_ADDRESS,
      nftId: "123",
      chain: mainnet,
      service: mockPlatformService,
    };

    jest
      .spyOn(nftOpenActionKit.detectionEngine, "detectNFTDetails")
      .mockReturnValue(expectedResult);

    const result = await nftOpenActionKit.detectAndReturnCalldata(mockUrl);
    expect(result).toBeDefined();
  });

  it("should return undefined for an NFT URL with no details found", async () => {
    const mockUrl = "https://example.com/nft/unknown/456";
    // Simulate no NFT details found
    jest
      .spyOn(nftOpenActionKit.detectionEngine, "detectNFTDetails")
      .mockResolvedValue(undefined);

    const result = await nftOpenActionKit.detectAndReturnCalldata(mockUrl);
    expect(result).toBeUndefined();
  });

  it("should handle errors gracefully during NFT details detection", async () => {
    const mockUrl = "https://example.com/nft/error";
    // Simulate throwing an error during detection
    jest
      .spyOn(nftOpenActionKit.detectionEngine, "detectNFTDetails")
      .mockRejectedValue(new Error("Mock error during detection"));

    await expect(
      nftOpenActionKit.detectAndReturnCalldata(mockUrl)
    ).rejects.toThrow("Mock error during detection");
  });
});

describe("actionDataFromPost", () => {
  let nftOpenActionKit: any;

  beforeEach(() => {
    // Mock the detection engine or directly inject the mocked platform service as needed
    nftOpenActionKit = new NftOpenActionKit({
      decentApiKey: "mock-api-key",
      raribleApiKey: "mock-rarible-key",
    });

    (global.fetch as jest.Mock).mockClear();
  });

  it("should return action data for a valid post", async () => {
    // Assuming fetch is used within actionDataFromPost, mock its response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      text: () =>
        Promise.resolve(
          JSON.stringify(
            {
              tx: {
                to: "0xCCadF28d9c74c8D412feEcD86EA9B0a9CefF1B28",
                data: "0x07e96a950000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000b80000000000000000000000003684e93ae82b40238911dc71c3875e08e33f4ddc00000000000000000000000000000000000000000000000007acbb93c80d5fa900000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000004600000000000000000000000000000000000000000000000001fd0a13cde3f0fe300000000000000000000000000000000000000000000000000000000001b578300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d500b1d8e8ef31e21c99d1db9a6444d3adf12700000000000000000000000002791bca1f2de4661ed88a30c99a7a9449aa8417400000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000002b2791bca1f2de4661ed88a30c99a7a9449aa841740001f40d500b1d8e8ef31e21c99d1db9a6444d3adf12700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000220000000000000000000000000444483c2d87a6c298f44c223c0638a3eac7b6ea0000000000000000000000000751362d366f66ecb70bf67e0d941daa7e34635f50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000751362d366f66ecb70bf67e0d941daa7e34635f50000000000000000000000000000000000000000000000000002c2ad68fd900000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000002b42000000000000000000000000000000000000060001f4833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a445368181000000000000000000000000444483c2d87a6c298f44c223c0638a3eac7b6ea000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003d09000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000",
                value: 553023097650634665n,
              },
              tokenPayment: {
                tokenAddress: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
                amount: 2292509493130366947n,
                isNative: false,
              },
              applicationFee: { amount: 0n, isNative: true },
              bridgeFee: {
                amount: 553023097650634665n,
                tokenAddress: "0x0000000000000000000000000000000000000000",
                isNative: true,
              },
              bridgeId: "stargate",
              actionResponse: {
                arbitraryData: {
                  lensActionData: "0xDUMMY_DATA",
                },
              },
            },
            bigintSerializer
          )
        ),
    });

    jest
      .spyOn(nftOpenActionKit.detectionEngine, "getService")
      .mockReturnValue(mockPlatformService);

    // Execute the method with the mock data
    const actionData = await nftOpenActionKit.actionDataFromPost(
      mockPost,
      "100",
      DUMMY_ADDRESS,
      DUMMY_ADDRESS,
      "1"
    );

    // Assertions to validate the action data
    expect(actionData).toBeDefined();
    expect(actionData.actArguments).toBeDefined();
    expect(actionData.uiData).toBeDefined();
    expect(actionData.actArgumentsFormatted).toBeDefined();

    // Validate calls to mocked services if needed
    expect(mockPlatformService.getMintSignature).toHaveBeenCalled();
    expect(mockPlatformService.getUIData).toHaveBeenCalled();
    expect(mockPlatformService.getPrice).toHaveBeenCalled();
    expect(mockPlatformService.getArgs).toHaveBeenCalled();
  });

  it("should handle errors or specific cases as per your function's logic", async () => {
    // Simulate an error during actionDataFromPost
    jest
      .spyOn(nftOpenActionKit.detectionEngine, "getService")
      .mockReturnValue(mockPlatformService);
    jest
      .spyOn(nftOpenActionKit, "actionDataFromPost")
      .mockRejectedValue(new Error("Mock error during actionDataFromPost"));

    await expect(
      nftOpenActionKit.actionDataFromPost(mockPost, "100", DUMMY_ADDRESS, "1")
    ).rejects.toThrow("Mock error during actionDataFromPost");
  });
});
