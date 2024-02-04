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
import { NFT_PLATFORM_CONFIG } from "./nftPlatforms";

import { base, mainnet, optimism, zora } from "viem/chains";
import ERC721DropAbi from "../config/abis/Zora/ERC721Drop.json";
import MetadataRendererABI from "../config/abis/Zora/MetadataRenderer.json";
import ZoraCreator1155ImplABI from "../config/abis/Zora/ZoraCreator1155Impl.json";
import ZoraCreatorFixedPriceSaleStrategyABI from "../config/abis/Zora/ZoraCreatorFixedPriceSaleStrategy.json";
import { NFTExtraction, UIData } from "../types";

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
};

export const ZORA_CHAIN_ID_MAPPING: { [key: string]: ZoraExtendedChain } = {
  zora: {
    ...zora,
    erc1155ZoraMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
  },
  eth: {
    ...mainnet,
    erc1155ZoraMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
  },
  base: {
    ...base,
    erc1155ZoraMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
  },
  oeth: {
    ...optimism,
    erc1155ZoraMinter: "0x3678862f04290E565cCA2EF163BAeb92Bb76790C",
  },
};

export interface ZoraExtendedChain extends Chain {
  erc1155ZoraMinter: string;
}

export class ZoraService implements IPlatformService {
  private client: PublicClient;

  private erc1155MintSignature =
    "function mintWithRewards(address minter, uint256 tokenId, uint256 quantity, bytes calldata minterArguments, address mintReferral)";
  private erc721DropMintSignature =
    "function mintWithRewards(address recipient, uint256 quantity, string calldata comment, address mintReferral)";

  constructor(chain: Chain) {
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
    nftDetails: NFTExtraction
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
      const response = await fetch(
        `https://ipfs.decentralized-content.com/ipfs/${cid}`
      );
      const metadata: any = await response.json();
      nftUri = metadata.image;
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
    signature: string
  ): any[] {
    const minter =
      ZORA_CHAIN_ID_MAPPING[CHAIN_ID_TO_KEY[Number(this.client.chain!.id)]]
        .erc1155ZoraMinter;
    if (signature === this.erc721DropMintSignature) {
      return [
        senderAddress,
        1n,
        "",
        "0x0000000000000000000000000000000000000000",
      ];
    } else {
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
    }
  }

  private isERC1155(signature: string): boolean {
    return signature === this.erc1155MintSignature;
  }

  private async getContractType(
    nftDetails: NFTExtraction
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
        )
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
          )
        ) {
          throw new Error("Not a valid ERC721Drop");
        }

        return {
          type: "ERC721Drop",
          signature: this.erc721DropMintSignature,
        };
      } catch (error) {
        // do nothing
        console.log("unrecognized contract");
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
