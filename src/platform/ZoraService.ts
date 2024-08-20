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

  private erc1155MintSignature =
    "function mint(address minter, uint256 tokenId, uint256 quantity, address[] calldata rewardsRecipients, bytes calldata minterArguments)";

  constructor(config: ServiceConfig) {
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
    unit: bigint = 1n
  ): Promise<bigint | undefined> {
    const chain = this.client.chain!;

    let sale;
    if (this.isERC1155(signature)) {
      sale = await this.getERC1155SaleData(
        ZORA_CHAIN_ID_MAPPING[CHAIN_ID_TO_KEY[chain.id]],
        contractAddress,
        nftId.toString()
      );
    } else {
      throw new Error("Unsupported Zora NFT type");
    }

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
    dstChainId: bigint
  ): Promise<UIData | undefined> {
    let nftName: string = "";
    let nftUri: string = "";
    let nftCreatorAddress: string = "";

    if (this.isERC1155(signature)) {
      const erc1155Contract = getContract({
        address: contract as `0x${string}`,
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
        tokenStandard: this.isERC1155(signature) ? "erc1155" : "erc721",
        dstChainId: Number(dstChainId),
        zoraAdditional: response,
      };
    } else {
      throw new Error("Unsupported Zora NFT type");
    }
  }

  async getArgs(
    contract: string,
    tokenId: bigint,
    senderAddress: string,
    signature: string,
    price: bigint,
    quantity: bigint,
    profileOwnerAddress: string
  ): Promise<any[]> {
    const chain =
      ZORA_CHAIN_ID_MAPPING[CHAIN_ID_TO_KEY[Number(this.client.chain!.id)]];
    const fixedPriceSaleStrategyContract = getContract({
      address: chain.fixedPriceStrategy as `0x${string}`,
      abi: ZoraCreatorFixedPriceSaleStrategyABI,
      client: this.client,
    });

    let result: any = await fixedPriceSaleStrategyContract.read.sale([
      contract as `0x${string}`,
      tokenId,
    ]);

    let minter = chain.fixedPriceStrategy;

    if (result.saleStart === 0n && result.saleEnd === 0n) {
      minter = chain.timedSaleStrategy;
    }

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

  private isERC1155(signature: string): boolean {
    return signature === this.erc1155MintSignature;
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

    const tokenInfo = await erc1155Contract.read.getTokenInfo([BigInt(nftId)]);

    if (!tokenInfo) {
      return;
    }

    let mintFee = await erc1155Contract.read.mintFee();
    if (!mintFee) {
      mintFee = this.getFees();
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
      mintFee,
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

  private getFees(): bigint {
    // Minting fees
    // https://support.zora.co/en/articles/4981037-zora-mint-collect-fees
    return parseEther("0.000777");
  }
}
