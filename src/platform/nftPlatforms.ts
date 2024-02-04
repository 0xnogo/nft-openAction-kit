import { mainnet } from "viem/chains";
import { NFTExtraction, NFTPlatform } from "../types";
import { ArtBlocksService } from "./ArtBlocksService";
import { ZORA_CHAIN_ID_MAPPING, ZoraService } from "./ZoraService";

export const NFT_PLATFORM_CONFIG: { [key: string]: NFTPlatform } = {
  Zora: {
    platformName: "Zora",
    platformLogoUrl: "https://zora.co/favicon.ico",
    urlPattern:
      /https:\/\/zora\.co\/collect\/([a-z]+):(0x[a-fA-F0-9]{40})(?:\/(\d+))?/,

    urlExtractor: (url: string): NFTExtraction | undefined => {
      const match = url.match(
        /https:\/\/zora\.co\/collect\/([a-z]+):(0x[a-fA-F0-9]{40})(?:\/(\d+))?/
      );
      if (match && ZORA_CHAIN_ID_MAPPING[match[1]]) {
        return {
          platform: NFT_PLATFORM_CONFIG["Zora"],
          chain: ZORA_CHAIN_ID_MAPPING[match[1]],
          contractAddress: match[2],
          nftId: match[3],
          service: new ZoraService(ZORA_CHAIN_ID_MAPPING[match[1]]),
        };
      }
    },
    platformService: ZoraService,
  },
  ArtBlocks: {
    platformName: "ArtBlocks",
    platformLogoUrl: "https://www.artblocks.io/favicon.ico",
    urlPattern:
      /https:\/\/www\.artblocks\.io\/collections\/curated\/projects\/0x99a9b7c1116f9ceeb1652de04d5969cce509b069\/(\d+)/, // other GenArt ommited as no more active projects
    urlExtractor: (url: string): NFTExtraction | undefined => {
      const match = url.match(
        /https:\/\/www\.artblocks\.io\/collections\/curated\/projects\/(0x[a-fA-F0-9]{40})\/(\d+)/
      );
      if (match) {
        return {
          platform: NFT_PLATFORM_CONFIG["ArtBlocks"],
          chain: mainnet,
          contractAddress: match[1],
          nftId: match[2], // corresponds to a project ID in ArtBlocks
          service: new ArtBlocksService(mainnet),
        };
      }
    },
    platformService: ArtBlocksService,
  },
};

// Function to detect NFT details from URL
export function detectNFTDetails(url: string): NFTExtraction | undefined {
  for (const key in NFT_PLATFORM_CONFIG) {
    const platform = NFT_PLATFORM_CONFIG[key];
    if (platform.urlPattern.test(url)) {
      return platform.urlExtractor(url);
    }
  }
}
