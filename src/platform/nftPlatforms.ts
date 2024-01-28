import { ZORA_CHAIN_ID_MAPPING } from "../config/constants";
import { NFTExtraction, NFTPlatform } from "../types";
import { ZoraService } from "./ZoraService";

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
  // ... other platforms can be added here
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
