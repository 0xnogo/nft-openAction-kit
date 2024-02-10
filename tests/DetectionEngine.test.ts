import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { DetectionEngine } from "../src/DetectionEngine";
import { SUPER_RARE_ADDRESS } from "../src/platform/SuperRareService";
import { ZoraExtendedChain } from "../src/platform/ZoraService";

jest.mock("../src/platform/ArtBlocksService");
jest.mock("../src/platform/RaribleService");
jest.mock("../src/platform/SuperRareService");
jest.mock("../src/platform/ZoraService");

const DUMMY_ADDRESS = privateKeyToAccount(generatePrivateKey()).address;

describe("DetectionEngine Platforms", () => {
  // Platform developers should add their tests within a dedicated describe block here
  let engine: DetectionEngine;
  let config = {
    decentApiKey: "decent-api-key",
    raribleApiKey: "test-api-key",
  };

  beforeEach(() => {
    engine = new DetectionEngine(config);
  });

  beforeEach(() => {
    engine = new DetectionEngine(config);
  });

  describe("Zora Platform", () => {
    it("detects NFT details from Zora URL", async () => {
      const zoraUrl = `https://zora.co/collect/zora:${DUMMY_ADDRESS}/1`;
      const result = await engine.detectNFTDetails(zoraUrl);

      expect(result).toBeDefined();
      expect(result?.chain.name).toBe("Zora");
      expect((result?.chain as ZoraExtendedChain).erc1155ZoraMinter).toBe(
        "0x04E2516A2c207E84a1839755675dfd8eF6302F0a"
      );
      expect(result?.contractAddress).toBe(DUMMY_ADDRESS);
      expect(result?.nftId).toBe("1");
    });

    it("returns Zora service", () => {
      const service = engine.getService("Zora", mainnet);
      expect(service).toBeDefined();
    });
  });

  describe("ArtBlocks Platform", () => {
    it("detects NFT details from ArtBlocks URL", async () => {
      const artBlocksUrl = `https://www.artblocks.io/collections/curated/projects/0x99a9b7c1116f9ceeb1652de04d5969cce509b069/1`;
      const result = await engine.detectNFTDetails(artBlocksUrl);

      expect(result).toBeDefined();
      expect(result?.chain).toBe(mainnet);
      expect(result?.contractAddress).toBe(
        "0x99a9b7c1116f9ceeb1652de04d5969cce509b069"
      );
      expect(result?.nftId).toBe("1");
    });

    it("returns ArtBlocks service", () => {
      const service = engine.getService("ArtBlocks", mainnet);
      expect(service).toBeDefined();
    });
  });

  describe("Rarible Platform", () => {
    let engine: DetectionEngine;

    beforeEach(() => {
      engine = new DetectionEngine({
        decentApiKey: "dummy-decent-api-key",
        raribleApiKey: "dummy-rarible-api-key",
      });
    });

    it("detects NFT details from Rarible URL", async () => {
      const raribleUrl = `https://rarible.com/token/${DUMMY_ADDRESS}:100`;
      const result = await engine.detectNFTDetails(raribleUrl);

      expect(result).toBeDefined();
      expect(result?.chain).toBe(mainnet);
      expect(result?.contractAddress).toBe(DUMMY_ADDRESS);
      expect(result?.nftId).toBe("100");
    });

    it("returns Rarible service for Rarible NFTs", () => {
      const service = engine.getService("Rarible", mainnet);
      expect(service).toBeDefined();
    });
  });

  describe("SuperRare Platform", () => {
    let engine: DetectionEngine;

    beforeEach(() => {
      engine = new DetectionEngine({ decentApiKey: "dummy-decent-api-key" });
    });

    it("detects NFT details from SuperRare URL", async () => {
      const superRareUrl = `https://superrare.com/artwork-v2/super-rare-nft-456`;
      const result = await engine.detectNFTDetails(superRareUrl);

      expect(result).toBeDefined();
      expect(result?.chain).toBe(mainnet);
      expect(result?.contractAddress).toBe(SUPER_RARE_ADDRESS);
      expect(result?.nftId).toBe("456");
    });

    it("returns SuperRare service for SuperRare NFTs", () => {
      const service = engine.getService("SuperRare", mainnet);
      expect(service).toBeDefined();
    });
  });

  // Define your detection test below...
});
