import { Chain } from "viem/chains";
import {
  NFTExtraction,
  NftPlatformConfig,
  PlatformServiceConstructor,
  SdkConfig,
} from ".";
import { IDetectionEngine } from "./interfaces/IDetectionEngine";
import { IPlatformService } from "./interfaces/IPlatformService";
import {
  PODS_CHAIN_ID_MAPPING,
  PodsService,
  type PodsSupportedChain,
  type TokenInfoAPIResponse as PodsTokenInfoAPIResponse,
} from "./platform/PodsService";
import { ZORA_CHAIN_ID_MAPPING, ZoraService } from "./platform/ZoraService";

export class DetectionEngine implements IDetectionEngine {
  public nftPlatformConfig: NftPlatformConfig = {};
  private fallbackRpcs: Record<number, string> | undefined;



  constructor(config: SdkConfig) {

    this.fallbackRpcs = config.fallbackRpcs;

    this.initializePlatformConfig();
  }

  public async detectNFTDetails(
    url: string
  ): Promise<NFTExtraction | undefined> {
    for (const key in this.nftPlatformConfig) {
      const platform = this.nftPlatformConfig[key];
      if (platform.urlPattern.test(url)) {
        return platform.urlExtractor(url);
      }
    }
  }

  public getService(name: string, dstChain: Chain): IPlatformService {
    const PlatformService: PlatformServiceConstructor =
      this.nftPlatformConfig[name].platformService;

    return new PlatformService({
      chain: dstChain,
      platformName: this.nftPlatformConfig[name].platformName,
      platformLogoUrl: this.nftPlatformConfig[name].platformLogoUrl,
      apiKey: this.nftPlatformConfig[name].apiKey ?? "",
    });
  }

  private initializePlatformConfig(): void {
    // Zora, ArtBlocks, Pods, and SuperRare don't require an API key for this setup
    this.nftPlatformConfig.Zora = {
      platformName: "Zora",
      platformLogoUrl: "https://zora.co/favicon.ico",
      urlPattern:
        /https:\/\/zora\.co\/collect\/([a-z]+):(0x[a-fA-F0-9]{40})(?:\/(?:premint-)?(\d+))?/,

      urlExtractor: (url: string): Promise<NFTExtraction | undefined> => {
        const match = url.match(
          /https:\/\/zora\.co\/collect\/([a-z]+):(0x[a-fA-F0-9]{40})(?:\/(?:premint-)?(\d+))?/
        );
        if (match && ZORA_CHAIN_ID_MAPPING[match[1]]) {
          return Promise.resolve({
            platform: this.nftPlatformConfig["Zora"],
            chain: ZORA_CHAIN_ID_MAPPING[match[1]],
            contractAddress: match[2],
            nftId: match[3],
            service: new ZoraService({
              chain: ZORA_CHAIN_ID_MAPPING[match[1]],
              platformName: this.nftPlatformConfig["Zora"].platformName,
              platformLogoUrl: this.nftPlatformConfig["Zora"].platformLogoUrl,
              fallbackRpcs: this.fallbackRpcs
            }),
          });
        }
        return Promise.resolve(undefined);
      },
      platformService: ZoraService,
    };

    this.nftPlatformConfig.Pods = {
      platformName: "Pods",
      platformLogoUrl: "https://pods.media/icon.svg",
      urlPattern: /(https?:\/\/)?pods\.media(\/.+)/,
      urlExtractor: async (url: string): Promise<NFTExtraction | undefined> => {
        try {
          // e.g. https://pods.media/the-rollup/ep-123-data-availability-in-the-modular-stack-explained
          const [, , route] =
            url.match(/(https?:\/\/)?pods\.media(\/.+)/) ?? [];
          if (!route) return Promise.resolve(undefined);

          // Given a Pods route, lookup the chain ID, contract address, and token ID.
          // e.g. /the-rollup/ep-123-data-availability-in-the-modular-stack-explained
          const response = await fetch(
            `https://pods.media/api/tokenInfo?route=${encodeURIComponent(
              route
            )}`
          );

          const { chainId, contractAddress, tokenId } =
            (await response.json()) as PodsTokenInfoAPIResponse;

          if (chainId && contractAddress && tokenId) {
            return Promise.resolve({
              chain: PODS_CHAIN_ID_MAPPING[chainId],
              contractAddress,
              nftId: tokenId, // all are 1155s, this is the episode tokenId
              service: new PodsService({
                chain: PODS_CHAIN_ID_MAPPING[chainId],
                platformName: this.nftPlatformConfig["Pods"].platformName,
                platformLogoUrl: this.nftPlatformConfig["Pods"].platformLogoUrl,
                fallbackRpcs: this.fallbackRpcs,
              }),
            } satisfies NFTExtraction<PodsSupportedChain>);
          }
        } catch (err) {
          throw new Error("Failed to parse Pods URL");
        }
      },
      /*
       * this type coercion is necessary because the constructor signature is not compatible with
       * the IPlatformService interface, and we're referencing it in the initializer
       */
      platformService: PodsService as unknown as PlatformServiceConstructor,
    };

    /* this.nftPlatformConfig.ArtBlocks = {
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
            platform: this.nftPlatformConfig["ArtBlocks"],
            chain: mainnet,
            contractAddress: match[1],
            nftId: match[2], // corresponds to a project ID in ArtBlocks
            service: new ArtBlocksService({
              chain: mainnet,
              platformName: this.nftPlatformConfig["ArtBlocks"].platformName,
              platformLogoUrl:
                this.nftPlatformConfig["ArtBlocks"].platformLogoUrl,
            }),
          });
        }
        return Promise.resolve(undefined);
      },
      platformService: ArtBlocksService,
    }; */

    /* this.nftPlatformConfig.SuperRare = {
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
            platform: this.nftPlatformConfig["SuperRare"],
            chain: mainnet,
            contractAddress,
            minterAddress: SUPER_RARE_MINTER_ADDRESS,
            nftId,
            service: new SuperRareService({
              chain: mainnet,
              platformName: this.nftPlatformConfig["SuperRare"].platformName,
              platformLogoUrl:
                this.nftPlatformConfig["SuperRare"].platformLogoUrl,
            }),
          });
        }
        return Promise.resolve(undefined);
      },
      platformService: SuperRareService,
    }; */

    // Rarible is conditionally added based on the presence of its API key
    /* if (this.raribleApiKey) {
      this.nftPlatformConfig.Rarible = {
        platformName: "Rarible",
        platformLogoUrl: "https://rarible.com/favicon.ico",
        urlPattern:
          /https:\/\/rarible\.com\/token\/(?:polygon\/)?(0x[a-fA-F0-9]{40}):(\d+)/,
        urlExtractor: (url: string): Promise<NFTExtraction | undefined> => {
          const match = url.match(
            /https:\/\/rarible\.com\/token\/(?:polygon\/)?(0x[a-fA-F0-9]{40}):(\d+)/
          );
          if (match) {
            // Determine the chain based on the URL structure
            const isPolygon = url.includes("/token/polygon/");
            const chain = isPolygon ? polygon : mainnet;
            const contractAddress = match[1];
            const minterAddress = isPolygon
              ? RARIBLE_MINTER_ADDRESS["POLYGON"]
              : RARIBLE_MINTER_ADDRESS["ETHEREUM"];
            const nftId = match[2];

            // Return undefined for unsupported chains (Rari Chain, ZkSync Era, Immutable X)
            if (![mainnet.name, polygon.name].includes(chain.name)) {
              return Promise.resolve(undefined);
            }

            return Promise.resolve({
              platform: this.nftPlatformConfig["Rarible"],
              chain: chain,
              contractAddress,
              minterAddress,
              nftId,
              service: new RaribleService({
                chain,
                platformName: this.nftPlatformConfig["Rarible"].platformName,
                platformLogoUrl:
                  this.nftPlatformConfig["Rarible"].platformLogoUrl,
                apiKey: this.raribleApiKey!,
              }),
            });
          }
          return Promise.resolve(undefined);
        },
        platformService: RaribleService,
        apiKey: this.raribleApiKey,
      };
    } */

    // OpenSea is conditionally added based on the presence of its API key
    /* if (this.openSeaApiKey) {
      this.nftPlatformConfig.OpenSea = {
        platformName: "OpenSea",
        platformLogoUrl: "https://opensea.io/favicon.ico",
        urlPattern:
          /https:\/\/opensea\.io\/assets\/(ethereum|matic|optimism|arbitrum|zora|base)\/(0x[a-fA-F0-9]{40})\/(\d+)/,
        urlExtractor: (url: string): Promise<NFTExtraction | undefined> => {
          const match = url.match(this.nftPlatformConfig.OpenSea.urlPattern);
          if (match) {
            // Determine the chain based on the URL segment
            let chain;
            switch (match[1].toLowerCase()) {
              case "ethereum":
                chain = mainnet;
                break;
              case "matic":
                chain = polygon;
                break;
              case "optimism":
                chain = optimism;
                break;
              case "arbitrum":
                chain = arbitrum;
                break;
              case "zora":
                chain = zora;
                break;
              case "base":
                chain = base;
                break;
              default:
                return Promise.resolve(undefined); // Unsupported chain
            }

            const contractAddress = match[2];
            const nftId = match[3];

            return Promise.resolve({
              platform: this.nftPlatformConfig["OpenSea"],
              chain: chain,
              contractAddress: contractAddress,
              minterAddress: OPENSEA_MINTER_ADDRESS,
              nftId: nftId,
              service: new OpenSeaService({
                chain,
                platformName: this.nftPlatformConfig["OpenSea"].platformName,
                platformLogoUrl:
                  this.nftPlatformConfig["OpenSea"].platformLogoUrl,
                apiKey: this.openSeaApiKey!,
              }),
            });
          }
          return Promise.resolve(undefined);
        },
        platformService: OpenSeaService,
        apiKey: this.openSeaApiKey,
      };
    } */
  }
}
