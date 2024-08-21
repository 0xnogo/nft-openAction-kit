import {
  Chain,
  PublicClient,
  createPublicClient,
  encodeAbiParameters,
  getContract,
  http,
  parseEther,
} from "viem";
import { IPlatformService } from "../interfaces/IPlatformService";

import { arbitrum, base, mainnet, optimism, zora } from "viem/chains";
import { NFTExtraction, ServiceConfig, UIData } from "../types";
import { fetchZoraMetadata } from "../utils";
import { ZoraCreatorTimedSaleStrategyABI } from "../config/abis/Zora/ZoraCreatorTimedSaleStrategy";
import { ZoraCreatorFixedPriceSaleStrategyABI } from "../config/abis/Zora/ZoraCreatorFixedPriceSaleStrategy";
import { ZoraCreator1155ImplABI } from "../config/abis/Zora/ZoraCreator1155Impl";

type Sale = {
  saleStart: number;
  saleEnd: number;
  totalMinted: bigint;
  maxSupply: bigint;
  price: bigint;
  mintFee: bigint;
  mintSignature: string;
};

const CHAIN_ID_TO_KEY: { [id: number]: string } = {
  [mainnet.id]: "eth",
  [zora.id]: "zora",
  [base.id]: "base",
  [optimism.id]: "oeth",
  [arbitrum.id]: "arb",
};

export const ZORA_CHAIN_ID_MAPPING: { [key: string]: ZoraExtendedChain } = {
  zora: {
    ...zora,
    fixedPriceStrategy: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
    timedSaleStrategy: "0x777777722D078c97c6ad07d9f36801e653E356Ae",
  },
  eth: {
    ...mainnet,
    fixedPriceStrategy: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
    timedSaleStrategy: "0x777777722D078c97c6ad07d9f36801e653E356Ae",
  },
  base: {
    ...base,
    fixedPriceStrategy: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
    timedSaleStrategy: "0x777777722D078c97c6ad07d9f36801e653E356Ae",
  },
  oeth: {
    ...optimism,
    fixedPriceStrategy: "0x3678862f04290E565cCA2EF163BAeb92Bb76790C",
    timedSaleStrategy: "0x777777722D078c97c6ad07d9f36801e653E356Ae",
  },
  arb: {
    ...arbitrum,
    fixedPriceStrategy: "0x1Cd1C1f3b8B779B50Db23155F2Cb244FCcA06B21",
    timedSaleStrategy: "0x777777722D078c97c6ad07d9f36801e653E356Ae",
  },
};

export interface ZoraExtendedChain extends Chain {
  fixedPriceStrategy: string;
  timedSaleStrategy: string;
}

export class ZoraService implements IPlatformService {
  readonly platformName: string;
  readonly platformLogoUrl: string;

  private client: PublicClient;

  private fixedPriceStrategySignature =
    "function mint(address minter, uint256 tokenId, uint256 quantity, address[] calldata rewardsRecipients, bytes calldata minterArguments)";
  private timedSaleStrategySignature =
    "function mint(address mintTo, uint256 quantity, address collection, uint256 tokenId, address mintReferral, string comment)";

  constructor(config: ServiceConfig) {
    this.client = createPublicClient({
      chain: config.chain,
      transport: http(),
    });
    this.platformName = config.platformName;
    this.platformLogoUrl = config.platformLogoUrl;
  }

  getMinterAddress(
    nftDetails: NFTExtraction,
    mintSignature: string
  ): Promise<string> {
    if (mintSignature === this.fixedPriceStrategySignature) {
      return Promise.resolve(nftDetails.contractAddress);
    } else {
      const chain =
        ZORA_CHAIN_ID_MAPPING[CHAIN_ID_TO_KEY[Number(this.client.chain!.id)]];
      return Promise.resolve(chain.timedSaleStrategy);
    }
  }

  async getMintSignature(
    nftDetails: NFTExtraction,
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
    unit: bigint = 1n,
    sourceUrl: string
  ): Promise<bigint | undefined> {
    const chain = this.client.chain!;

    let sale;

    let nftAddress = contractAddress;

    if (signature === this.timedSaleStrategySignature) {
      const match = sourceUrl.match(
        /https:\/\/zora\.co\/collect\/([a-z]+):(0x[a-fA-F0-9]{40})(?:\/(?:premint-)?(\d+))?/
      );
      nftAddress = match![2];
    }

    sale = await this.getERC1155SaleData(
      ZORA_CHAIN_ID_MAPPING[CHAIN_ID_TO_KEY[chain.id]],
      nftAddress,
      nftId.toString()
    );

    if (
      !sale ||
      !this.isSaleValid(
        sale.saleStart,
        sale.saleEnd,
        sale.totalMinted,
        sale.maxSupply
      )
    ) {
      return;
    }

    return (sale.price + sale.mintFee) * unit;
  }

  async getUIData(
    signature: string,
    contract: string,
    tokenId: bigint,
    dstChainId: bigint,
    sourceUrl: string
  ): Promise<UIData | undefined> {
    let nftName: string = "";
    let nftCreatorAddress: string = "";

    let nftAddress = contract;

    if (signature === this.timedSaleStrategySignature) {
      const match = sourceUrl.match(
        /https:\/\/zora\.co\/collect\/([a-z]+):(0x[a-fA-F0-9]{40})(?:\/(?:premint-)?(\d+))?/
      );
      nftAddress = match![2];
    }

    const erc1155Contract = getContract({
      address: nftAddress as `0x${string}`,
      abi: ZoraCreator1155ImplABI,
      client: this.client,
    });
    nftName = (await erc1155Contract.read.name()) as string;
    nftCreatorAddress = (await erc1155Contract.read.owner()) as string;

    const uri = (await erc1155Contract.read.uri([tokenId])) as string;
    const response = await fetchZoraMetadata(uri);

    return {
      platformName: this.platformName,
      platformLogoUrl: this.platformLogoUrl,
      nftName,
      nftUri: response.image,
      rawMetadataUri: uri,
      nftCreatorAddress,
      tokenStandard: "erc1155",
      dstChainId: Number(dstChainId),
      zoraAdditional: response,
    };
  }

  async getArgs(
    contract: string,
    tokenId: bigint,
    senderAddress: string,
    signature: string,
    price: bigint,
    quantity: bigint,
    profileOwnerAddress: string,
    sourceUrl: string
  ): Promise<any[]> {
    const chain =
      ZORA_CHAIN_ID_MAPPING[CHAIN_ID_TO_KEY[Number(this.client.chain!.id)]];

    let minter = chain.fixedPriceStrategy;

    if (signature === this.timedSaleStrategySignature) {
      minter = chain.timedSaleStrategy;
      const match = sourceUrl.match(
        /https:\/\/zora\.co\/collect\/([a-z]+):(0x[a-fA-F0-9]{40})(?:\/(?:premint-)?(\d+))?/
      );
      const nftAddress = match![2];
      return Promise.resolve([
        senderAddress,
        quantity,
        nftAddress,
        tokenId,
        profileOwnerAddress,
        "",
      ]);
    }
    {
      const rewardsRecipients = [profileOwnerAddress];

      return Promise.resolve([
        minter,
        tokenId,
        quantity,
        rewardsRecipients,
        encodeAbiParameters(
          [{ type: "address" }],
          [senderAddress as `0x${string}`]
        ),
      ]);
    }
  }

  private async getContractType(
    nftDetails: NFTExtraction,
    ignoreValidSale?: boolean
  ): Promise<{ type: string; signature: string } | undefined> {
    try {
      const sale = await this.getERC1155SaleData(
        ZORA_CHAIN_ID_MAPPING[CHAIN_ID_TO_KEY[nftDetails.chain.id]],
        nftDetails.contractAddress,
        nftDetails.nftId
      );

      if (!sale) {
        throw new Error("Unsupported Zora sale type");
      }

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
        throw new Error("Mint expired");
      }

      return {
        type: "ZoraCreator1155Impl",
        signature: sale.mintSignature,
      };
    } catch (error) {
      // If the above call fail, it might be an ERC721Drop
      throw new Error(`Unrecognized Zora contract type: ${error}`);
    }
  }

  private async getERC1155SaleData(
    chain: ZoraExtendedChain,
    contractAddress: string,
    nftId: string
  ): Promise<Sale | undefined> {
    const erc1155Contract = getContract({
      address: contractAddress as `0x${string}`,
      abi: ZoraCreator1155ImplABI,
      client: this.client,
    });
    let mintSignature = this.fixedPriceStrategySignature;
    const tokenInfo = await erc1155Contract.read.getTokenInfo([BigInt(nftId)]);

    if (!tokenInfo) {
      return;
    }

    const fixedPriceSaleStrategyContract = getContract({
      address: chain.fixedPriceStrategy as `0x${string}`,
      abi: ZoraCreatorFixedPriceSaleStrategyABI,
      client: this.client,
    });

    let result: any = await fixedPriceSaleStrategyContract.read.sale([
      contractAddress as `0x${string}`,
      BigInt(nftId),
    ]);

    if (result.saleStart === 0n && result.saleEnd === 0n) {
      mintSignature = this.timedSaleStrategySignature;
      const timedSaleStrategyContract = getContract({
        address: chain.timedSaleStrategy as `0x${string}`,
        abi: ZoraCreatorTimedSaleStrategyABI,
        client: this.client,
      });

      result = await timedSaleStrategyContract.read.sale([
        contractAddress as `0x${string}`,
        BigInt(nftId),
      ]);
    }

    return {
      saleStart: Number(result.saleStart),
      saleEnd: Number(result.saleEnd),
      totalMinted: tokenInfo.totalMinted,
      maxSupply: tokenInfo.maxSupply,
      price: 0n,
      mintFee: this.getFees(mintSignature),
      mintSignature,
    };
  }

  private isSaleValid(
    saleStart: number,
    saleEnd: number,
    totalMinted: bigint,
    maxSupply: bigint
  ): boolean {
    // check the saleEnd + mint liquidity available
    const now = Math.floor(Date.now() / 1000);
    const saleOpen = saleStart <= now && saleEnd >= now;
    const quantityAvailable = maxSupply > totalMinted;
    return saleOpen && quantityAvailable;
  }

  private getFees(signature: string): bigint {
    if (signature === this.fixedPriceStrategySignature) {
      return parseEther("0.000777");
    } else {
      return parseEther("0.000111");
    }
  }
}
