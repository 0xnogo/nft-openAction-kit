import { mainnet, polygon } from "viem/chains";
import { ArtBlocksService } from "./platform/ArtBlocksService";
import { RaribleService } from "./platform/RaribleService";
import { ZORA_CHAIN_ID_MAPPING, ZoraService } from "./platform/ZoraService";

import {
  Address,
  decodeAbiParameters,
  encodeAbiParameters,
  encodePacked,
  parseUnits,
} from "viem";
import { CHAIN_CONFIG, ZERO_ADDRESS } from "./config/constants";
import { BASE_URL } from "./config/endpoints";
import { INftOpenActionKit } from "./interfaces/INftOpenActionKit";
import { IPlatformService } from "./interfaces/IPlatformService";
import {
  SUPER_RARE_ADDRESS,
  SuperRareService,
} from "./platform/SuperRareService";
import {
  ActionData,
  NFTExtraction,
  NFTPlatform,
  PlatformServiceConstructor,
  PostCreatedEventFormatted,
  SdkConfig,
} from "./types";
import { bigintDeserializer, bigintSerializer, idToChain } from "./utils";

/**
 * NFTOpenActionKit class
 * @class
 * @classdesc NFTOpenActionKit class: Detects NFT details from URL and returns calldata for minting
 * @constructor
 * @param {string} decentApiKey - Decent API key
 * @param {string} raribleApiKey - Rarible API key
 */
export class NftOpenActionKit implements INftOpenActionKit {
  private decentApiKey: string;
  private raribleApiKey?: string;
  private nftPlatformConfig: { [key: string]: NFTPlatform } = {};

  // TODO: add the RPC url as input
  constructor(config: SdkConfig) {
    if (!config.decentApiKey) {
      throw new Error("Decent API key is mandatory.");
    }
    this.decentApiKey = config.decentApiKey;
    this.raribleApiKey = config.raribleApiKey;
    this.initializePlatformConfig();
  }

  private initializePlatformConfig(): void {
    // Zora, ArtBlocks, and SuperRare don't require an API key for this setup
    this.nftPlatformConfig.Zora = {
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
            platform: this.nftPlatformConfig["Zora"],
            chain: ZORA_CHAIN_ID_MAPPING[match[1]],
            contractAddress: match[2],
            nftId: match[3],
            service: new ZoraService({
              chain: ZORA_CHAIN_ID_MAPPING[match[1]],
              platformName: this.nftPlatformConfig["Zora"].platformName,
              platformLogoUrl: this.nftPlatformConfig["Zora"].platformLogoUrl,
            }),
          };
        }
      },
      platformService: ZoraService,
    };

    this.nftPlatformConfig.ArtBlocks = {
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
          };
        }
      },
      platformService: ArtBlocksService,
    };

    this.nftPlatformConfig.SuperRare = {
      platformName: "SuperRare",
      platformLogoUrl: "https://superrare.com/favicon.ico",
      urlPattern:
        /https:\/\/superrare\.com\/(?:artwork-v2\/)?(?:0x[a-fA-F0-9]{40}\/)?[\w-]+(?:\:\s?[\w-]+)?-(\d+)/,
      urlExtractor: (url: string): NFTExtraction | undefined => {
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

          return {
            platform: this.nftPlatformConfig["SuperRare"],
            chain: mainnet,
            contractAddress,
            nftId,
            service: new SuperRareService({
              chain: mainnet,
              platformName: this.nftPlatformConfig["SuperRare"].platformName,
              platformLogoUrl:
                this.nftPlatformConfig["SuperRare"].platformLogoUrl,
            }),
          };
        }
      },
      platformService: SuperRareService,
    };

    // Rarible is conditionally added based on the presence of its API key
    if (this.raribleApiKey) {
      this.nftPlatformConfig.Rarible = {
        platformName: "Rarible",
        platformLogoUrl: "https://rarible.com/favicon.ico",
        urlPattern:
          /https:\/\/rarible\.com\/token\/(?:polygon\/)?(0x[a-fA-F0-9]{40}):(\d+)/,
        urlExtractor: (url: string): NFTExtraction | undefined => {
          const match = url.match(
            /https:\/\/rarible\.com\/token\/(?:polygon\/)?(0x[a-fA-F0-9]{40}):(\d+)/
          );
          if (match) {
            // Determine the chain based on the URL structure
            const isPolygon = url.includes("/token/polygon/");
            const chain = isPolygon ? polygon : mainnet;
            const contractAddress = match[1];
            const nftId = match[2];

            // Return undefined for unsupported chains (Rari Chain, ZkSync Era, Immutable X)
            if (![mainnet.name, polygon.name].includes(chain.name)) {
              return undefined;
            }

            return {
              platform: this.nftPlatformConfig["Rarible"],
              chain: chain,
              contractAddress,
              nftId,
              service: new RaribleService({
                chain,
                platformName: this.nftPlatformConfig["Rarible"].platformName,
                platformLogoUrl:
                  this.nftPlatformConfig["Rarible"].platformLogoUrl,
                apiKey: this.raribleApiKey!,
              }),
            };
          }
        },
        platformService: RaribleService,
        apiKey: this.raribleApiKey,
      };
    }
  }

  /**
   * Detects NFT details from URL and returns calldata for minting
   * @param contentURI URL of the NFT
   * @returns calldata for minting
   */
  public async detectAndReturnCalldata(
    contentURI: string
  ): Promise<string | undefined> {
    const nftDetails = this.detectNFTDetails(contentURI);

    if (nftDetails) {
      const service: IPlatformService = nftDetails.service;
      const mintSignature = await service.getMintSignature(nftDetails);
      if (!mintSignature) {
        return;
      }

      const nftAddress = nftDetails.contractAddress;
      const nftId = nftDetails.nftId != null ? BigInt(nftDetails.nftId) : 0n;
      const paymentToken = ZERO_ADDRESS;
      const cost = parseUnits("0", 18); // workaround - price fetched in actionDataFromPost
      const dstChainId = nftDetails.chain.id;
      return this.calldataGenerator(
        nftAddress,
        nftId,
        paymentToken,
        BigInt(dstChainId),
        cost,
        mintSignature,
        nftDetails.platform.platformName
      );
    }
  }

  /**
   * Fetches action data from post
   * @param post Post object
   * @param profileId Profile ID of the user
   * @param senderAddress Address of the user
   * @param srcChainId Chain ID of the source chain
   * @returns action data
   */
  public async actionDataFromPost(
    post: PostCreatedEventFormatted,
    profileId: string,
    senderAddress: string,
    srcChainId: string
  ): Promise<ActionData> {
    const [contract, tokenId, token, dstChainId, _, signature, platform] =
      this.fetchParams(post)!;

    const PlateformService: PlatformServiceConstructor =
      this.nftPlatformConfig[platform].platformService;

    // from id to the viem chain object
    const dstChain = idToChain(Number(dstChainId));
    const plateformService = new PlateformService({
      chain: dstChain,
      platformName: this.nftPlatformConfig[platform].platformName,
      platformLogoUrl: this.nftPlatformConfig[platform].platformLogoUrl,
      apiKey: this.nftPlatformConfig[platform].apiKey ?? "",
    });

    // logic to fetch the price + fee from the platform
    const price = await plateformService.getPrice(
      contract,
      tokenId,
      signature,
      senderAddress
    );

    if (!price) {
      throw new Error("No price");
    }

    const actionRequest = {
      sender: senderAddress,
      srcChainId: parseInt(srcChainId),
      srcToken: CHAIN_CONFIG.wMatic,
      dstChainId,
      dstToken: token,
      slippage: 3, // 1%
      actionType: "lens-open-action",
      actionConfig: {
        functionCall: "processPublicationAction",
        pubId: post.args.pubId,
        profileId: post.args.postParams.profileId,
        contractAddress:
          (await plateformService.getMinterAddress(contract, tokenId)) ??
          contract,
        chainId: dstChainId,
        cost: {
          isNative: true,
          amount: price,
        },
        signature,
        args: await plateformService.getArgs(
          contract,
          tokenId,
          senderAddress,
          signature,
          price
        ),
      },
    };

    const url = `${BASE_URL}?arguments=${JSON.stringify(
      actionRequest,
      bigintSerializer
    )}`;

    const response = await fetch(url, {
      headers: {
        "x-api-key": this.decentApiKey,
      },
    });
    const data = await response.text();

    const resp = JSON.parse(data, bigintDeserializer);

    console.log(resp);

    // TODO: commented for now as Decent API is not returning actionResponse
    // if (resp.success == "false" || !resp.actionResponse) {
    //   throw new Error("No action response");
    // }

    // TODO: check with Decent team why actionResponse is not present in the response
    // const encodedActionData = resp.actionResponse!.arbitraryData.lensActionData;

    const actArguments = {
      publicationActedProfileId: BigInt(post.args.postParams.profileId),
      publicationActedId: BigInt(post.args.pubId),
      actorProfileId: BigInt(profileId!),
      referrerProfileIds: [],
      referrerPubIds: [],
      actionModuleAddress: CHAIN_CONFIG.decentOpenActionContractAddress,
      // actionModuleData: encodedActionData as `0x${string}`,
      actionModuleData: "0x123456789" as `0x${string}`,
    };

    const uiData = await plateformService.getUIData(
      signature,
      contract,
      tokenId
    );

    if (!uiData) {
      throw new Error("No UI data");
    }

    return { actArguments, uiData };
  }

  private detectNFTDetails(url: string): NFTExtraction | undefined {
    for (const key in this.nftPlatformConfig) {
      const platform = this.nftPlatformConfig[key];
      if (platform.urlPattern.test(url)) {
        return platform.urlExtractor(url);
      }
    }
  }

  private calldataGenerator(
    contractAddress: string,
    nftId: bigint,
    paymentToken: string,
    dstChainId: bigint,
    cost: bigint,
    mintSignatureMethod: string,
    platformName: string
  ): string {
    return encodeAbiParameters(
      [
        // contract address of call
        { type: "address" },
        // tokenId of the nft
        { type: "uint256" },
        // the payment token for the action (i.e.mint) zeroAddress if cost is native or free
        { type: "address" },
        // chainId of that contract
        { type: "uint256" },
        // cost of the function call
        { type: "uint256" },
        // signature of the mint function
        { type: "bytes" },
        // platform name
        { type: "bytes" },
      ],
      [
        contractAddress as `0x${string}`,
        nftId,
        paymentToken as `0x${string}`,
        dstChainId,
        cost,
        encodePacked(["string"], [mintSignatureMethod]),
        encodePacked(["string"], [platformName]),
      ]
    );
  }

  private fetchParams = (
    post: PostCreatedEventFormatted
  ):
    | readonly [
        `0x${string}`,
        bigint,
        `0x${string}`,
        bigint,
        bigint,
        string,
        string
      ]
    | undefined => {
    const actionModules = post.args.postParams.actionModules;
    const index = actionModules.indexOf(
      CHAIN_CONFIG.decentOpenActionContractAddress
    );
    if (index < 0) return;
    const actionModuleInitData = post.args.postParams.actionModulesInitDatas[
      index
    ] as Address;

    return decodeAbiParameters(
      [
        { type: "address" },
        { type: "uint256" },
        { type: "address" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "string" },
        { type: "string" },
      ],
      actionModuleInitData
    );
  };
}
