import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { base, zora } from "viem/chains";
import { DetectionEngine } from "../src/DetectionEngine";
import { ZoraExtendedChain } from "../src/platform/ZoraService";
import { PodsService } from "../src/platform/PodsService";

jest.mock("../src/platform/ZoraService");
jest.mock("../src/platform/PodsService");

const DUMMY_ADDRESS = privateKeyToAccount(generatePrivateKey()).address;

describe("DetectionEngine Platforms", () => {
  let engine: DetectionEngine;
  let config = {
    decentApiKey: "decent-api-key",
    raribleApiKey: "test-api-key",
  };

  beforeEach(() => {
    engine = new DetectionEngine(config);
  });

  describe("Zora Platform", () => {
    it("detects NFT details from Zora URL", async () => {
      const zoraUrl = `https://zora.co/collect/zora:${DUMMY_ADDRESS}/1`;
      const result = await engine.detectNFTDetails(zoraUrl);

      expect(result).toBeDefined();
      expect(result?.chain.name).toBe("Zora");
      expect((result?.chain as ZoraExtendedChain).fixedPriceStrategy).toBe(
        "0x04E2516A2c207E84a1839755675dfd8eF6302F0a"
      );
      expect(result?.contractAddress).toBe(DUMMY_ADDRESS);
      expect(result?.nftId).toBe("1");
    });

    it("returns Zora service", () => {
      const service = engine.getService("Zora", zora);
      expect(service).toBeDefined();
    });
  });

  describe("Pods Platform", () => {
    it("detects NFT details from Pods URL", async () => {
      const podsUrl = `https://pods.media/the-rollup/ep-123-data-availability-in-the-modular-stack-explained`;
      const mockResponse = {
        chainId: base.id,
        contractAddress: DUMMY_ADDRESS,
        tokenId: "123",
      };

      // Mock fetch to return the expected data
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const result = await engine.detectNFTDetails(podsUrl);

      expect(result).toBeDefined();
      expect(result?.chain.name).toBe("Base");
      expect(result?.contractAddress).toBe(DUMMY_ADDRESS);
      expect(result?.nftId).toBe("123");
      expect(result?.service).toBeInstanceOf(PodsService);
    });

    it("returns Pods service", () => {
      const service = engine.getService("Pods", base);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(PodsService);
    });
  });
});
