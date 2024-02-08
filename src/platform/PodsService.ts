import {
  PublicClient,
  type Transport,
  createPublicClient,
  encodeAbiParameters,
  getContract,
  http,
  parseEther,
} from "viem";
import { IPlatformService } from "../interfaces/IPlatformService";
import { NFT_PLATFORM_CONFIG } from "./nftPlatforms";

import { base, mainnet, optimism, zora } from "viem/chains";
import ZoraCreator1155ImplABI from "../config/abis/Zora/ZoraCreator1155Impl.json";
import ZoraCreatorFixedPriceSaleStrategyABI from "../config/abis/Zora/ZoraCreatorFixedPriceSaleStrategy.json";
import type { NFTExtraction, UIData } from "../types";

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

export class PodsService implements IPlatformService {
  private client: PublicClient<Transport, PodsSupportedChain>;

  private erc1155MintSignature =
    "function mintWithRewards(address minter, uint256 tokenId, uint256 quantity, bytes calldata minterArguments, address mintReferral)";

  constructor(chain: PodsSupportedChain) {
    this.client = createPublicClient({
      chain: chain,
      transport: http(),
    });
  }

  getMinterAddress(
    contract: string,
    tokenId: bigint
  ): Promise<string | undefined> {
    return Promise.resolve(undefined);
  }

  async getMintSignature(
    nftDetails: NFTExtraction<PodsSupportedChain>
  ): Promise<string | undefined> {
    const contractTypeResult = await this.getContractType(nftDetails);
    if (!contractTypeResult) {
      return;
    }

    return contractTypeResult.signature;
  }

  async getPrice(
    contractAddress: string,
    nftId: bigint,
    signature: string,
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
    tokenId: bigint
  ): Promise<UIData | undefined> {
    let nftName: string = "";
    let nftUri: string = "";
    let nftCreatorAddress: string = "";

    const erc1155Contract = getContract({
      address: contract as `0x${string}`,
      abi: ZoraCreator1155ImplABI,
      client: this.client,
    });
    nftName = (await erc1155Contract.read.name()) as string;
    nftCreatorAddress = (await erc1155Contract.read.owner()) as string;

    const uri = (await erc1155Contract.read.uri([tokenId])) as string;
    const cid = uri.split("/").pop();
    const response = await fetch(
      `https://ipfs.decentralized-content.com/ipfs/${cid}`
    );
    const metadata: any = await response.json();
    nftUri = metadata.image;

    return {
      platformName: NFT_PLATFORM_CONFIG["Zora"].platformName,
      platformLogoUrl: NFT_PLATFORM_CONFIG["Zora"].platformLogoUrl,
      nftName,
      nftUri,
      nftCreatorAddress,
    };
  }

  getArgs(
    contract: string,
    tokenId: bigint,
    senderAddress: string,
    signature: string,
    price: bigint
  ) {
    const minter =
      PODS_CHAIN_ID_MAPPING[this.client.chain.id].erc1155ZoraMinter;
    if (signature === this.erc1155MintSignature) {
      return [
        minter,
        tokenId,
        1n,
        encodeAbiParameters(
          [{ type: "address" }],
          [senderAddress as `0x${string}`]
        ),
        "0x0000000000000000000000000000000000000000",
      ];
    } else {
      throw new Error("Invalid function signature");
    }
  }

  private async getContractType(
    nftDetails: NFTExtraction<PodsSupportedChain>
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
        )
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
      nftId,
    ]);
    const erc1155Contract = getContract({
      address: contractAddress as `0x${string}`,
      abi: ZoraCreator1155ImplABI,
      client: this.client,
    });

    const tokenInfo: any = await erc1155Contract.read.getTokenInfo([nftId]);

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
