import axios from "axios";
import { Client, createPublicClient, http } from "viem";
import { IPlatformService } from "../interfaces/IPlatformService";
import { NFTExtraction, ServiceConfig, UIData } from "../types";

const chainToOpenSeaChain = {
  137: "matic",
  42161: "arbitrum",
  10: "optimism",
  1: "ethereum",
  7777777: "zora",
  8453: "base",
};

export const OPENSEA_MINTER_ADDRESS =
  "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC";

export class OpenSeaService implements IPlatformService {
  public readonly platformName: string;
  public readonly platformLogoUrl: string;
  private apiKey: string;
  private client: Client;

  private mintSignature = `function fulfillBasicOrder((address considerationToken, uint256 considerationIdentifier, uint256 considerationAmount, address offerer, address zone, address offerToken, uint256 offerIdentifier, uint256 offerAmount, uint8 basicOrderType, uint256 startTime, uint256 endTime, bytes32 zoneHash, uint256 salt, bytes32 offererConduitKey, bytes32 fulfillerConduitKey, uint256 totalOriginalAdditionalRecipients, (uint256 amount, address recipient)[] additionalRecipients, bytes signature)) external payable returns (bool fulfilled)`;

  constructor(config: ServiceConfig) {
    this.platformName = config.platformName;
    this.platformLogoUrl = config.platformLogoUrl;

    if (!config.apiKey) {
      throw new Error("OpenSea API key is required");
    }

    this.apiKey = config.apiKey;
    this.client = createPublicClient({
      chain: config.chain,
      transport: http(),
    });
  }

  getMinterAddress(
    contract: string,
    tokenId: bigint
  ): Promise<string | undefined> {
    return Promise.resolve(OPENSEA_MINTER_ADDRESS);
  }

  getMintSignature(nftDetails: NFTExtraction): Promise<string | undefined> {
    if (!this.isSaleValid(nftDetails.contractAddress, nftDetails.nftId)) {
      return Promise.resolve(undefined);
    }
    return Promise.resolve(this.mintSignature);
  }

  async getUIData(
    signature: string,
    contract: string,
    tokenId: bigint,
    dstChainId: bigint,
    sourceUrl?: string
  ): Promise<UIData | undefined> {
    const chainName = this.getChainName();
    let sellAddress = contract;
    if (sourceUrl) {
      sellAddress = sourceUrl.split("/")[5];
    }
    const nftDetail = await this.getNFTDetails(
      chainName,
      sellAddress,
      tokenId.toString()
    );
    if (!nftDetail) {
      return;
    }
    return Promise.resolve({
      platformName: this.platformName,
      platformLogoUrl: this.platformLogoUrl,
      nftName: nftDetail.name,
      nftUri: nftDetail.imageUrl,
      nftCreatorAddress: nftDetail.creator,
      tokenStandard: nftDetail.tokenStandard,
      dstChainId: Number(dstChainId),
    });
  }

  async getPrice(
    contractAddress: string,
    nftId: bigint,
    signature: string,
    userAddress: string,
    unit?: bigint | undefined,
    sourceUrl?: string
  ): Promise<bigint | undefined> {
    const chainName = this.getChainName();
    let sellAddress = contractAddress;
    if (sourceUrl) {
      sellAddress = sourceUrl.split("/")[5];
    }
    const nftDetails = await this.getNFTDetails(
      chainName,
      sellAddress,
      nftId.toString()
    );

    if (!nftDetails) {
      throw new Error("No slug found");
    }

    const bestListing = await this.getBestListing(
      nftDetails.slug,
      nftId.toString()
    );

    if (!bestListing) {
      throw new Error("No listing");
    }

    return bestListing.price;
  }

  async getArgs(
    contractAddress: string,
    tokenId: bigint,
    senderAddress: string,
    signature: string,
    price: bigint,
    quantity: bigint,
    profileOwnerAddress: string,
    sourceUrl?: string
  ): Promise<any[]> {
    const chainName = this.getChainName();
    let sellAddress = contractAddress;
    if (sourceUrl) {
      sellAddress = sourceUrl.split("/")[5];
    }
    const nftDetails = await this.getNFTDetails(
      chainName,
      sellAddress,
      tokenId.toString()
    );

    if (!nftDetails) {
      throw new Error("No slug found");
    }

    const bestListing = await this.getBestListing(
      nftDetails.slug,
      tokenId.toString()
    );

    if (!bestListing) {
      throw new Error("No listing");
    }

    const fulfillmentData = await this.fulfillmentData(
      bestListing.orderHash,
      chainName,
      OPENSEA_MINTER_ADDRESS,
      senderAddress,
      sellAddress,
      tokenId.toString()
    );

    const args = [];
    for (const [_, value] of Object.entries(
      fulfillmentData.fulfillment_data.transaction.input_data
    )) {
      args.push(value);
    }
    return args;
  }

  private async getNFTDetails(
    chain: string,
    contractAddress: string,
    tokenId: string
  ): Promise<
    | {
        slug: string;
        name: string;
        imageUrl: string;
        creator: string;
        tokenStandard: string;
      }
    | undefined
  > {
    const url = `https://api.opensea.io/api/v2/chain/${chain}/contract/${contractAddress}/nfts/${tokenId}`;

    try {
      const response = await axios.get(url, {
        headers: {
          accept: "application/json",
          "x-api-key": this.apiKey,
        },
      });

      return {
        slug: response.data.nft.collection,
        name: response.data.nft.name,
        imageUrl: response.data.nft.image_url,
        creator: response.data.nft.creator,
        tokenStandard: response.data.token_standard,
      };
    } catch (error) {
      console.error("Error making GET request:", error);
      return;
    }
  }

  private async getBestListing(
    collectionSlug: string,
    tokenId: string
  ): Promise<
    { orderHash: string; protocolAddress: string; price: bigint } | undefined
  > {
    const url = `https://api.opensea.io/api/v2/listings/collection/${collectionSlug}/nfts/${tokenId}/best`;

    try {
      const response = await axios.get(url, {
        headers: {
          accept: "application/json",
          "x-api-key": this.apiKey,
        },
      });
      return {
        orderHash: response.data.order_hash,
        protocolAddress: response.data.protocol_address,
        price: BigInt(response.data.price.current.value),
      };
    } catch (error) {
      console.error("Error making GET request:", error);
      return;
    }
  }

  private async fulfillmentData(
    orderHash: string,
    chain: string,
    protocolAddress: string,
    fullfiller: string,
    assetContract: string,
    tokenId: string
  ) {
    const url = "https://api.opensea.io/api/v2/offers/fulfillment_data";
    const data = {
      offer: {
        hash: orderHash,
        chain: chain,
      },
      fulfiller: {
        address: fullfiller,
      },
      consideration: {
        asset_contract_address: assetContract,
        token_id: tokenId,
      },
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-api-key": this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Failed to post fulfillment data:", error);
    }
  }

  private getChainName(): string {
    return chainToOpenSeaChain[
      this.client.chain!.id as keyof typeof chainToOpenSeaChain
    ];
  }

  private async isSaleValid(
    contractAddress: string,
    tokenId: string
  ): Promise<boolean> {
    const chainName = this.getChainName();

    const nftDetails = await this.getNFTDetails(
      chainName,
      contractAddress,
      tokenId.toString()
    );

    if (!nftDetails) {
      return false;
    }

    const bestListing = await this.getBestListing(
      nftDetails.slug,
      tokenId.toString()
    );

    if (!bestListing) {
      return false;
    }

    return true;
  }
}
