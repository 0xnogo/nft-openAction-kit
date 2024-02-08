import { mainnet } from "viem/chains";
import type {
  NFTExtraction,
  NFTPlatform,
  PlatformServiceConstructor,
} from "../types";
import { ArtBlocksService } from "./ArtBlocksService";
import { SUPER_RARE_ADDRESS, SuperRareService } from "./SuperRareService";
import { ZORA_CHAIN_ID_MAPPING, ZoraService } from "./ZoraService";
import {
  PODS_CHAIN_ID_MAPPING,
  PodsService,
  type PodsSupportedChain,
} from "./PodsService";

export const NFT_PLATFORM_CONFIG: { [key: string]: NFTPlatform } = {
  Zora: {
    platformName: "Zora",
    platformLogoUrl: "https://zora.co/favicon.ico",
    urlPattern:
      /https:\/\/zora\.co\/collect\/([a-z]+):(0x[a-fA-F0-9]{40})(?:\/(\d+))?/,

    urlExtractor: (url: string): Promise<NFTExtraction | undefined> => {
      const match = url.match(
        /https:\/\/zora\.co\/collect\/([a-z]+):(0x[a-fA-F0-9]{40})(?:\/(\d+))?/
      );
      if (match && ZORA_CHAIN_ID_MAPPING[match[1]]) {
        return Promise.resolve({
          platform: NFT_PLATFORM_CONFIG["Zora"],
          chain: ZORA_CHAIN_ID_MAPPING[match[1]],
          contractAddress: match[2],
          nftId: match[3],
          service: new ZoraService(ZORA_CHAIN_ID_MAPPING[match[1]]),
        });
      } else {
        return Promise.resolve(undefined);
      }
    },
    platformService: ZoraService,
  },
  Pods: {
    platformName: "Pods",
    platformLogoUrl: "https://pods.media/icon.svg",
    urlPattern: /(https?:\/\/)?pods\.media(\/.+)/,
    urlExtractor: async (url) => {
      const match = url.match(/(https?:\/\/)?pods\.media(\/.+)/);
      if (match) {
        const response = await fetch(
          `https://pods.media/api/tokenInfo?route=${encodeURIComponent(
            match[2]
          )}`
        );
        const data = (await response.json()) as
          | { chainId: number; contractAddress: `0x${string}`; tokenId: string }
          | undefined;

        if (data && data.chainId && data.contractAddress && data.tokenId) {
          if (data.chainId in PODS_CHAIN_ID_MAPPING) {
            const chainId = data.chainId as keyof typeof PODS_CHAIN_ID_MAPPING;
            return {
              platform: NFT_PLATFORM_CONFIG["Pods"],
              chain: PODS_CHAIN_ID_MAPPING[chainId],
              contractAddress: data.contractAddress,
              nftId: data.tokenId, // all are 1155s, this is the episode tokenId
              service: new PodsService(PODS_CHAIN_ID_MAPPING[chainId]),
            } satisfies NFTExtraction<PodsSupportedChain>;
          }
        }
        throw new Error("Failed to parse Pods URL");
      }
    },
    /*
     * this type coercion is necessary because the constructor signature is not compatible with
     * the IPlatformService interface, and we're referencing it in the initializer
     */
    platformService: PodsService as unknown as PlatformServiceConstructor,
  },
  ArtBlocks: {
    platformName: "ArtBlocks",
    platformLogoUrl: "https://www.artblocks.io/favicon.ico",
    urlPattern:
      /https:\/\/www\.artblocks\.io\/collections\/curated\/projects\/0x99a9b7c1116f9ceeb1652de04d5969cce509b069\/(\d+)/, // other GenArt ommited as no more active projects
    urlExtractor: (url: string): Promise<NFTExtraction | undefined> => {
      const match = url.match(
        /https:\/\/www\.artblocks\.io\/collections\/curated\/projects\/(0x[a-fA-F0-9]{40})\/(\d+)/
      );
      if (match) {
        return Promise.resolve({
          platform: NFT_PLATFORM_CONFIG["ArtBlocks"],
          chain: mainnet,
          contractAddress: match[1],
          nftId: match[2], // corresponds to a project ID in ArtBlocks
          service: new ArtBlocksService(mainnet),
        });
      } else {
        return Promise.resolve(undefined);
      }
    },
    platformService: ArtBlocksService,
  },
  SuperRare: {
    platformName: "SuperRare",
    platformLogoUrl: "https://superrare.com/favicon.ico",
    urlPattern:
      /https:\/\/superrare\.com\/(?:artwork-v2\/)?(?:0x[a-fA-F0-9]{40}\/)?[\w-]+(?:\:\s?[\w-]+)?-(\d+)/,
    urlExtractor: (url: string): Promise<NFTExtraction | undefined> => {
      const match = url.match(
        /https:\/\/superrare\.com\/(?:artwork-v2\/)?(?:0x[a-fA-F0-9]{40}\/)?[\w-]+(?:\:\s?[\w-]+)?-(\d+)/
      );
      if (match) {
        const nftId = match[1];
        let contractAddress = SUPER_RARE_ADDRESS; // Default contract address
        // Attempt to extract the contract address if present
        const contractMatch = url.match(
          /https:\/\/superrare\.com\/(0x[a-fA-F0-9]{40})/
        );
        if (contractMatch) {
          contractAddress = contractMatch[1];
        }

        return Promise.resolve({
          platform: NFT_PLATFORM_CONFIG["SuperRare"],
          chain: mainnet, // Assuming SuperRare is on Ethereum
          contractAddress,
          nftId,
          service: new SuperRareService(mainnet), // Placeholder for actual service
        });
      } else {
        return Promise.resolve(undefined);
      }
    },
    platformService: SuperRareService,
  },
};

// Function to detect NFT details from URL
export async function detectNFTDetails(
  url: string
): Promise<NFTExtraction | undefined> {
  for (const key in NFT_PLATFORM_CONFIG) {
    const platform = NFT_PLATFORM_CONFIG[key];
    if (platform.urlPattern.test(url)) {
      return await platform.urlExtractor(url);
    }
  }
  return Promise.resolve(undefined);
}
