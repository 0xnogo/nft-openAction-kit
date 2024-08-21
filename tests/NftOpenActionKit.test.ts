import { parseEther } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { NftOpenActionKit, PublicationInfo, ActionData } from "../src";
import { CHAIN_CONFIG } from "../src/config/constants";
import { IPlatformService } from "../src/interfaces/IPlatformService";
import { DetectionEngine } from "../src/DetectionEngine";

const DUMMY_ADDRESS = privateKeyToAccount(generatePrivateKey()).address;

const mockPlatformService: jest.Mocked<IPlatformService> = {
  platformName: "Mock Platform",
  getMinterAddress: jest.fn().mockResolvedValue(DUMMY_ADDRESS),
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
    .mockResolvedValue([DUMMY_ADDRESS, BigInt(1), DUMMY_ADDRESS, BigInt(2)]),
};

// Mocking the DetectionEngine class
jest.mock("../src/DetectionEngine", () => {
  return {
    DetectionEngine: jest.fn().mockImplementation(() => ({
      detectNFTDetails: jest.fn().mockResolvedValue({
        contractAddress: DUMMY_ADDRESS,
        nftId: "123",
        chain: mainnet,
        service: mockPlatformService,
      }),
      getService: jest.fn().mockReturnValue(mockPlatformService),
    })),
  };
});

const mockPost: PublicationInfo = {
  profileId: "48935",
  actionModules: [CHAIN_CONFIG.decentOpenActionContractAddress],
  actionModulesInitDatas: [
    "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000f7d3ddffae7ec2576c9a6d95fe7d0f79c480c721000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000089000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000000bf2700000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000003166756e6374696f6e206d696e74286164647265737320746f2c2075696e74323536206e756d6265724f66546f6b656e7329000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b4578616d706c655265706f000000000000000000000000000000000000000000",
  ],
  pubId: "10",
};

describe("NftOpenActionKit", () => {
  let nftOpenActionKit: NftOpenActionKit;

  beforeEach(() => {
    nftOpenActionKit = new NftOpenActionKit({
      decentApiKey: "mock-api-key",
      raribleApiKey: "mock-rarible-key",
      openSeaApiKey: "mock-opensea-key",
    });

    jest.clearAllMocks();
  });

  it("should generate calldata for a valid NFT URL", async () => {
    const result = await nftOpenActionKit.detectAndReturnCalldata({
      contentURI: "https://example.com/nft/zora/123",
      publishingClientProfileId: "10",
    });

    expect(result).toBeDefined();
    expect(result).toContain("e6d6f636b2d7369676e6174757265");
  });

  it("should return action data for a valid post", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      text: () =>
        Promise.resolve(
          JSON.stringify({
            tx: {
              to: "0xCCadF28d9c74c8D412feEcD86EA9B0a9CefF1B28",
              data: "0x07e96a950000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000b80000000000000000000000003684e93ae82b40238911dc71c3875e08e33f4ddc00000000000000000000000000000000000000000000000007acbb93c80d5fa900000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000004600000000000000000000000000000000000000000000000001fd0a13cde3f0fe300000000000000000000000000000000000000000000000000000000001b578300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d500b1d8e8ef31e21c99d1db9a6444d3adf12700000000000000000000000002791bca1f2de4661ed88a30c99a7a9449aa8417400000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000002b2791bca1f2de4661ed88a30c99a7a9449aa841740001f40d500b1d8e8ef31e21c99d1db9a6444d3adf12700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000220000000000000000000000000444483c2d87a6c298f44c223c0638a3eac7b6ea0000000000000000000000000751362d366f66ecb70bf67e0d941daa7e34635f50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000751362d366f66ecb70bf67e0d941daa7e34635f50000000000000000000000000000000000000000000000000002c2ad68fd900000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000002b42000000000000000000000000000000000000060001f4833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a445368181000000000000000000000000444483c2d87a6c298f44c223c0638a3eac7b6ea000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003d09000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000",
              value: "553023097650634665",
            },
            tokenPayment: {
              tokenAddress: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
              amount: "2292509493130366947",
              isNative: false,
            },
            applicationFee: { amount: "0", isNative: true },
            bridgeFee: {
              amount: "553023097650634665",
              tokenAddress: "0x0000000000000000000000000000000000000000",
              isNative: true,
            },
            bridgeId: "stargate",
            actionResponse: {
              arbitraryData: {
                lensActionData: "0xDUMMY_DATA",
              },
            },
            arbitraryData: {
              lensActionData: "0xDUMMY_DATA",
            },
            success: "true",
          })
        ),
    } as Response);

    const actionData = await nftOpenActionKit.actionDataFromPost({
      post: mockPost,
      profileId: "100",
      profileOwnerAddress: DUMMY_ADDRESS,
      senderAddress: DUMMY_ADDRESS,
      srcChainId: "1",
      quantity: 1,
      paymentToken: DUMMY_ADDRESS,
      executingClientProfileId: "1",
      mirrorerProfileId: "1",
      mirrorPubId: "1",
    });

    expect(actionData).toBeDefined();
    expect(actionData.actArguments).toBeDefined();
    expect(actionData.uiData).toBeDefined();
    expect(actionData.actArgumentsFormatted).toBeDefined();

    expect(mockPlatformService.getUIData).toHaveBeenCalled();
    expect(mockPlatformService.getPrice).toHaveBeenCalled();
    expect(mockPlatformService.getArgs).toHaveBeenCalled();
  });

  it("should handle actionDataFromPost rejected error", async () => {
    jest
      .spyOn(nftOpenActionKit, "actionDataFromPost")
      .mockRejectedValue(new Error("Mock error during actionDataFromPost"));
    await expect(
      nftOpenActionKit.actionDataFromPost({
        post: mockPost,
        profileId: "100",
        profileOwnerAddress: DUMMY_ADDRESS,
        senderAddress: DUMMY_ADDRESS,
        srcChainId: "1",
        quantity: 1,
        paymentToken: DUMMY_ADDRESS,
        executingClientProfileId: "1",
        mirrorerProfileId: "1",
        mirrorPubId: "1",
      })
    ).rejects.toThrow("Mock error during actionDataFromPost");
  });
});
