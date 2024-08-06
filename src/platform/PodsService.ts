import {
  createPublicClient,
  encodeAbiParameters,
  getContract,
  http,
  parseEther,
} from "viem";
import { base, mainnet, optimism, zora } from "viem/chains";
import type { Address, PublicClient, Transport } from "viem";

import ZoraCreator1155ImplABI from "../config/abis/Pods/ZoraCreator1155Impl";
import ZoraCreatorFixedPriceSaleStrategyABI from "../config/abis/Zora/ZoraCreatorFixedPriceSaleStrategy.json";
import { ARWEAVE_GATEWAY } from "../config/endpoints";
import { IPlatformService } from "../interfaces/IPlatformService";
import type { NFTExtraction, UIData } from "../types";
import { fetchZoraMetadata } from "../utils";

// Although Pods does have a versioned metadata standard, for the purposes of
// these platform configuration bindings, this is all we need to care about for
// now.
//
// It may make sense to enhance this in the future based on client capabilities
// (e.g. audio and video support).
type PodsMetadataStandard = { image: string };

// Given a Pods route, lookup the chain ID, contract address, and token ID.
export type TokenInfoAPIResponse = {
  chainId: PodsSupportedChain["id"];
  contractAddress: Address;
  tokenId: string;
};

type Sale = {
  saleStart: number;
  saleEnd: number;
  totalMinted: bigint;
  maxSupply: bigint;
  price: bigint;
};

export const PODS_CHAIN_ID_MAPPING = {
  [zora.id]: {
    ...zora,
    erc1155ZoraMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
  },
  [base.id]: {
    ...base,
    erc1155ZoraMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
  },
  [mainnet.id]: {
    ...mainnet,
    erc1155ZoraMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
  },
  [optimism.id]: {
    ...optimism,
    erc1155ZoraMinter: "0x3678862f04290E565cCA2EF163BAeb92Bb76790C",
  },
} as const;

export type PodsSupportedChain =
  (typeof PODS_CHAIN_ID_MAPPING)[keyof typeof PODS_CHAIN_ID_MAPPING];

type PodsServiceConfig = {
  chain: PodsSupportedChain;
  platformName: string;
  platformLogoUrl: string;
};

export class PodsService implements IPlatformService {
  readonly platformName: string;
  readonly platformLogoUrl: string;

  private client: PublicClient<Transport, PodsSupportedChain>;

  private erc1155MintSignature =
    "function mintWithRewards(address minter, uint256 tokenId, uint256 quantity, bytes calldata minterArguments, address mintReferral)";

  constructor(config: PodsServiceConfig) {
    this.client = createPublicClient({
      chain: config.chain,
      transport: http(),
    });
    this.platformName = config.platformName;
    this.platformLogoUrl = config.platformLogoUrl;
  }

  getMinterAddress(
    contract: string,
    tokenId: bigint
  ): Promise<string | undefined> {
    return Promise.resolve(undefined);
  }

  async getMintSignature(
    nftDetails: NFTExtraction<PodsSupportedChain>,
    ignoreValidSale?: boolean
  ): Promise<string | undefined> {
    const contractTypeResult = await this.getContractType(
      nftDetails,
      ignoreValidSale
    );
    if (!contractTypeResult) {
      return;
    }

    return contractTypeResult.signature;
  }

  async getPrice(
    contractAddress: string,
    nftId: bigint,
    signature: string,
    userAddress: string,
    unit: bigint = 1n
  ): Promise<bigint | undefined> {
    const sale = await this.getERC1155SaleData(
      PODS_CHAIN_ID_MAPPING[this.client.chain.id],
      contractAddress,
      nftId.toString()
    );

    if (!sale) {
      return;
    }

    const price = sale.price;
    const fee = this.getFees();

    return (price + fee) * unit;
  }

  async getUIData(
    signature: string,
    contract: string,
    tokenId: bigint,
    dstChainId: bigint
  ): Promise<UIData | undefined> {
    try {
      const podcastContract = getContract({
        address: contract as `0x${string}`,
        // Pods makes use of Zora Protocol 1155 contracts, this is intentional.
        abi: ZoraCreator1155ImplABI,
        client: this.client,
      });

      const metadataURI = await podcastContract.read.uri([tokenId]);
      const response = await fetchZoraMetadata(metadataURI);

      return {
        platformName: this.platformName,
        platformLogoUrl: this.platformLogoUrl,
        nftName: await podcastContract.read.name(),
        nftUri: response.image,
        nftCreatorAddress: await podcastContract.read.owner(),
        tokenStandard: "erc1155",
        dstChainId: Number(dstChainId),
        podsAdditional: response.animation_url,
      };
    } catch (err) {
      console.error(err);
    }
  }

  getArgs(
    contract: string,
    tokenId: bigint,
    senderAddress: string,
    signature: string,
    price: bigint,
    quantity: bigint,
    profileOwnerAddress: string
  ): Promise<any[]> {
    const minter =
      PODS_CHAIN_ID_MAPPING[this.client.chain.id].erc1155ZoraMinter;
    if (signature === this.erc1155MintSignature) {
      return Promise.resolve([
        minter,
        tokenId,
        quantity,
        encodeAbiParameters(
          [{ type: "address" }],
          [senderAddress as `0x${string}`]
        ),
        profileOwnerAddress,
      ]);
    } else {
      throw new Error("Invalid function signature");
    }
  }

  private async getContractType(
    nftDetails: NFTExtraction<PodsSupportedChain>,
    ignoreValidSale?: boolean
  ): Promise<{ type: string; signature: string } | undefined> {
    if (!(nftDetails.chain.id in PODS_CHAIN_ID_MAPPING)) {
      return;
    }

    try {
      const sale = await this.getERC1155SaleData(
        PODS_CHAIN_ID_MAPPING[
          nftDetails.chain.id as keyof typeof PODS_CHAIN_ID_MAPPING
        ],
        nftDetails.contractAddress,
        nftDetails.nftId
      );

      if (
        sale &&
        !this.isSaleValid(
          sale.saleStart,
          sale.saleEnd,
          sale.totalMinted,
          sale.maxSupply
        ) &&
        !ignoreValidSale
      ) {
        throw new Error("Not an ERC1155");
      }

      return {
        type: "ZoraCreator1155Impl",
        signature: this.erc1155MintSignature,
      };
    } catch (error) {
      console.log("unrecognized contract");
      throw new Error("Unrecognized contract");
    }
  }

  private async getERC1155SaleData(
    chain: PodsSupportedChain,
    contractAddress: string,
    nftId: string
  ): Promise<Sale | undefined> {
    const fixedPriceSaleStrategyContract = getContract({
      address: chain.erc1155ZoraMinter as `0x${string}`,
      abi: ZoraCreatorFixedPriceSaleStrategyABI,
      client: this.client,
    });

    const result: any = await fixedPriceSaleStrategyContract.read.sale([
      contractAddress as `0x${string}`,
      BigInt(nftId),
    ]);
    const erc1155Contract = getContract({
      address: contractAddress as `0x${string}`,
      abi: ZoraCreator1155ImplABI,
      client: this.client,
    });

    const tokenInfo: any = await erc1155Contract.read.getTokenInfo([
      BigInt(nftId),
    ]);

    if (!result || !tokenInfo) {
      return;
    }

    return {
      saleStart: result.saleStart,
      saleEnd: result.saleEnd,
      totalMinted: tokenInfo.totalMinted,
      maxSupply: tokenInfo.maxSupply,
      price: result.pricePerToken,
    };
  }

  private isSaleValid(
    saleStart: any,
    saleEnd: any,
    totalMinted: bigint,
    maxSupply: bigint
  ): boolean {
    // check the saleEnd + mint liquidity available
    const now = Math.floor(Date.now() / 1000);
    const saleOpen = saleStart <= now && saleEnd >= now;
    const quantityAvailable = maxSupply > totalMinted;
    return saleOpen && quantityAvailable;
  }

  private getFees(): bigint {
    return parseEther("0.0007");
  }
}
