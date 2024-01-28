import { parseEther } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { zora } from "viem/chains";
import {
  PostCreatedEventFormatted,
  actionDataFromPost,
} from "../src/actionDataFromPost";
import { CHAIN_CONFIG } from "../src/config/constants";
import { ZoraService } from "../src/platform/ZoraService";
import { NFT_PLATFORM_CONFIG } from "../src/platform/nftPlatforms";
import { bigintSerializer } from "../src/utils";

jest.mock("../src/platform/ZoraService");

global.fetch = jest.fn();

const dummyAddress = privateKeyToAccount(generatePrivateKey()).address;

// Define a mock post object
const mockPost: PostCreatedEventFormatted = {
  args: {
    actionModulesInitReturnDatas: [""],
    postParams: {
      profileId: "48935",
      contentURI:
        "https://zora.co/collect/base:0x751362d366f66ecb70bf67e0d941daa7e34635f5/0",
      actionModules: [CHAIN_CONFIG.decentOpenActionContractAddress],
      actionModulesInitDatas: [
        "0x000000000000000000000000751362d366f66ecb70bf67e0d941daa7e34635f5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002105000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000006c66756e6374696f6e206d696e745769746852657761726473286164647265737320726563697069656e742c2075696e74323536207175616e746974792c20737472696e672063616c6c6461746120636f6d6d656e742c2061646472657373206d696e74526566657272616c29000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a6f726100000000000000000000000000000000000000000000000000000000",
      ],
      referenceModule: "0x0000000000000000000000000000000000000000",
      referenceModuleInitData: "0x01",
    },
    pubId: "10",
    referenceModuleInitReturnData: "0x",
    timestamp: "1704816612",
    transactionExecutor: "0x755bdaE53b234C6D1b7Be9cE7F316CF8f03F2533",
  },
  blockNumber: "52127727",
  transactionHash:
    "0x95f6175eb48fb4da576268e5dfa0ffd2f54619abdd367d65c99b2009b9f62331",
};

describe("actionDataFromPost", () => {
  let mockZoraService: jest.Mocked<ZoraService>;

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockZoraService = new ZoraService(zora) as any;

    // Mock the methods of ZoraService
    mockZoraService.getPrice.mockResolvedValue(parseEther("0.1"));
    mockZoraService.getArgs.mockReturnValue([
      dummyAddress,
      1n,
      "",
      "0x0000000000000000000000000000000000000000",
    ]);
    mockZoraService.getUIData.mockResolvedValue({
      platformName: "Zora",
      platformLogoUrl: "https://zora.co/favicon.ico",
      nftName: "Messi World Cup 2022",
      nftUri:
        "ipfs://bafybeid2ixox2zpsdg6mvzyoaclgjpikoa2wurg564kqrpt43svyddcpqq",
      nftCreatorAddress: "0x32B6B5B6a1c49fD2d386ccc7Dd0275CBAF11fE6b",
    });

    // Replace the service instance in NFT_PLATFORM_CONFIG with the mock
    NFT_PLATFORM_CONFIG["Zora"].platformService = jest.fn(
      () => mockZoraService
    );
  });

  it("should handle valid post data and return action data", async () => {
    // Mock the fetch response
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

    // Call the function with mock data
    const result = await actionDataFromPost(
      mockPost,
      "50000",
      "0x444483c2d87a6C298f44c223C0638A3eAc7B6ea0",
      137n
    );

    expect(result).toBeDefined();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything()
    );
  });

  it("should handle API errors gracefully", async () => {
    // Mock an API error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      text: () =>
        Promise.resolve({
          success: false,
          error: {
            code: 500,
            name: "InputError",
            message: "An error occurred while processing the request.",
            title: "Resource not found",
          },
        }),
    });

    await expect(
      actionDataFromPost(
        mockPost,
        "50000",
        "0x444483c2d87a6C298f44c223C0638A3eAc7B6ea0",
        137n
      )
    ).rejects.toThrow();
  });
});
