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
import ERC721DropAbi from "../config/abis/Zora/ERC721Drop.json";
import MetadataRendererABI from "../config/abis/Zora/MetadataRenderer.json";
import ZoraCreator1155ImplABI from "../config/abis/Zora/ZoraCreator1155Impl.json";
import ZoraCreatorFixedPriceSaleStrategyABI from "../config/abis/Zora/ZoraCreatorFixedPriceSaleStrategy.json";
import { NFTExtraction, ServiceConfig, UIData } from "../types";
import { fetchIPFSMetadataImageWithFallback } from "../utils";

type Sale = {
  saleStart: number;
  saleEnd: number;
  totalMinted: bigint;
  maxSupply: bigint;
  price: bigint;
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
    erc1155ZoraMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
    ethMinter: "0x777777E8850d8D6d98De2B5f64fae401F96eFF31",
  },
  eth: {
    ...mainnet,
    erc1155ZoraMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
    ethMinter: "0x777777E8850d8D6d98De2B5f64fae401F96eFF31",
  },
  base: {
    ...base,
    erc1155ZoraMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
    ethMinter: "0x777777E8850d8D6d98De2B5f64fae401F96eFF31",
  },
  oeth: {
    ...optimism,
    erc1155ZoraMinter: "0x3678862f04290E565cCA2EF163BAeb92Bb76790C",
    ethMinter: "0x777777E8850d8D6d98De2B5f64fae401F96eFF31",
  },
  arb: {
    ...arbitrum,
    erc1155ZoraMinter: "0x1Cd1C1f3b8B779B50Db23155F2Cb244FCcA06B21",
    ethMinter: "0x777777E8850d8D6d98De2B5f64fae401F96eFF31",
  },
};

export interface ZoraExtendedChain extends Chain {
  erc1155ZoraMinter: string;
  ethMinter: string;
}

export class ZoraService implements IPlatformService {
  readonly platformName: string;
  readonly platformLogoUrl: string;

  private client: PublicClient;

  private erc1155MintSignature =
    "function mintWithRewards(address minter, uint256 tokenId, uint256 quantity, bytes calldata minterArguments, address mintReferral)";
  private erc721DropMintSignature =
    "function mintWithRewards(address recipient, uint256 quantity, string calldata comment, address mintReferral)";
  private erc1155PremintSignature =
    "function premintV2(bytes calldata contractConfig, bytes calldata premintConfig, bytes calldata signature, uint256 quantityToMint, bytes calldata mintArguments)";

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
      sale = await this.getERC721DropSaleData(contractAddress);
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
      const cid = uri.split("/").pop();
      nftUri = await fetchIPFSMetadataImageWithFallback(cid);
    } else {
      const erc721DropContract = getContract({
        address: contract as `0x${string}`,
        abi: ERC721DropAbi,
        client: this.client,
      });

      nftName = (await erc721DropContract.read.name()) as string;
      nftCreatorAddress = (await erc721DropContract.read.owner()) as string;

      const metadataRendererAddress =
        (await erc721DropContract.read.metadataRenderer()) as `0x${string}`;

      const metadata: any = await this.client.readContract({
        address: metadataRendererAddress,
        abi: MetadataRendererABI,
        functionName: "tokenInfos",
        args: [contract as `0x${string}`],
      });

      if (metadata) {
        nftUri = metadata[1];
      }
    }

    return {
      platformName: this.platformName,
      platformLogoUrl: this.platformLogoUrl,
      nftName,
      nftUri,
      nftCreatorAddress,
      tokenStandard: this.isERC1155(signature) ? "erc1155" : "erc721",
      dstChainId: Number(dstChainId),
    };
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
      ZORA_CHAIN_ID_MAPPING[CHAIN_ID_TO_KEY[Number(this.client.chain!.id)]]
        .erc1155ZoraMinter;
    if (signature === this.erc721DropMintSignature) {
      return Promise.resolve([senderAddress, 1n, "", profileOwnerAddress]);
    } else {
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
    }
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
      try {
        const sale = await this.getERC721DropSaleData(
          nftDetails.contractAddress
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
          throw new Error("Not a valid ERC721Drop");
        }

        return {
          type: "ERC721Drop",
          signature: this.erc721DropMintSignature,
        };
      } catch (error) {
        throw new Error("Unrecognized contract");
      }
    }
  }

  private async getERC1155SaleData(
    chain: ZoraExtendedChain,
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

  private async getERC721DropSaleData(
    contractAddress: string
  ): Promise<Sale | undefined> {
    const erc721DropContract = getContract({
      address: contractAddress as `0x${string}`,
      abi: ERC721DropAbi,
      client: this.client,
    });

    const salesDetails: any = await erc721DropContract.read.saleDetails();

    if (!salesDetails) {
      return;
    }
    return {
      saleStart: salesDetails.publicSaleStart,
      saleEnd: salesDetails.publicSaleEnd,
      totalMinted: salesDetails.totalMinted,
      maxSupply: salesDetails.maxSupply,
      price: salesDetails.publicSalePrice,
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
    // Minting fees
    // https://support.zora.co/en/articles/4981037-zora-mint-collect-fees
    return parseEther("0.000777");
  }
}
