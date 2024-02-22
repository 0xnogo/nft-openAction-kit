import { PublicClient, createPublicClient, getContract, http } from "viem";
import { IPlatformService } from "../interfaces/IPlatformService";

import { NFTExtraction, ServiceConfig, UIData } from "../types";

import GenArt721CoreV3ABI from "../config/abis/ArtBlocks/GenArt721CoreV3.json";
import MinterDAExpSettlementV3 from "../config/abis/ArtBlocks/MinterDAExpSettlementV3.json";
import MinterFilterV2ABI from "../config/abis/ArtBlocks/MinterFilterV2.json";

export class ArtBlocksService implements IPlatformService {
  readonly platformName: string;
  readonly platformLogoUrl: string;

  private client: PublicClient;

  private mintSignature =
    "function purchase(uint256 projectId, address coreContract) external payable returns (uint256 tokenId)";

  constructor(config: ServiceConfig) {
    this.client = createPublicClient({
      chain: config.chain,
      transport: http(),
    });
    this.platformName = config.platformName;
    this.platformLogoUrl = config.platformLogoUrl;
  }

  async getMinterAddress(
    contract: string,
    tokenId: bigint
  ): Promise<string | undefined> {
    const minterContract = await this.getMinterContract(contract, tokenId);

    return minterContract.address;
  }

  async getMintSignature(
    nftDetails: NFTExtraction
  ): Promise<string | undefined> {
    const genArtContract = getContract({
      address: nftDetails.contractAddress as `0x${string}`,
      abi: GenArt721CoreV3ABI,
      client: this.client,
    });

    const stateData: any = await genArtContract.read.projectStateData([
      nftDetails.nftId,
    ]);

    const minterContract = await this.getMinterContract(
      nftDetails.contractAddress,
      BigInt(nftDetails.nftId)
    );

    const sale = await minterContract.read.projectAuctionParameters([
      nftDetails.nftId,
      nftDetails.contractAddress,
    ]);

    const isValid = this.isSaleValid(stateData[0], stateData[1], sale[0]);

    if (!isValid) {
      throw new Error("Sale not valid");
    }

    return this.mintSignature;
  }

  async getPrice(
    contractAddress: string,
    nftId: bigint,
    signature: string,
    userAddress: string,
    unit: bigint = 1n
  ): Promise<bigint | undefined> {
    const minterContract = await this.getMinterContract(contractAddress, nftId);

    const price: any = await minterContract.read.getPriceInfo([
      nftId,
      contractAddress,
    ]);

    if (!price) {
      throw new Error("Price not found");
    }

    if (!price[0]) {
      throw new Error("Price not configured");
    }

    return price[1] * unit;
  }

  async getUIData(
    signature: string,
    contract: string,
    tokenId: bigint
  ): Promise<UIData | undefined> {
    const genArtContract = getContract({
      address: contract as `0x${string}`,
      abi: GenArt721CoreV3ABI,
      client: this.client,
    });

    const _tokenId = await this.getTokenId(contract, tokenId);

    const tokenURI: any = await genArtContract.read.tokenURI([_tokenId]);

    // fetch json from tokenURI
    const tokenData = await fetch(tokenURI);

    if (!tokenData.ok) {
      throw new Error("Token data not found");
    }

    const tokenJson: any = await tokenData.json();

    // checks on tokenJson
    if (!tokenJson.collection_name) {
      throw new Error("Collection name not found");
    }

    if (!tokenJson.preview_asset_url) {
      throw new Error("Preview asset url not found");
    }

    if (!tokenJson.payout_address) {
      throw new Error("Payout address not found");
    }

    return {
      platformName: this.platformName,
      platformLogoUrl: this.platformLogoUrl,
      nftName: tokenJson.collection_name,
      nftUri: tokenJson.preview_asset_url,
      nftCreatorAddress: tokenJson.payout_address,
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
    return Promise.resolve([contract, tokenId, senderAddress]);
  }

  private async getTokenId(
    genArtAddress: string,
    projectId: bigint
  ): Promise<bigint> {
    const genArtContract = getContract({
      address: genArtAddress as `0x${string}`,
      abi: GenArt721CoreV3ABI,
      client: this.client,
    });

    const oneMillion = 1_000_000n;
    const stateData: any = await genArtContract.read.projectStateData([
      projectId,
    ]);

    return oneMillion * projectId + stateData[0] - 1n;
  }

  private async getMinterContract(
    contractAddress: string,
    projectId: bigint
  ): Promise<{ read: any; address: string }> {
    const genArtContract = getContract({
      address: contractAddress as `0x${string}`,
      abi: GenArt721CoreV3ABI,
      client: this.client,
    });

    const minterFilterAddress = await genArtContract.read.minterContract();

    const minterFilterContract = getContract({
      address: minterFilterAddress as `0x${string}`,
      abi: MinterFilterV2ABI,
      client: this.client,
    });

    const minterAddress = await minterFilterContract.read.getMinterForProject([
      projectId,
      contractAddress,
    ]);

    const minterContract = getContract({
      address: minterAddress as `0x${string}`,
      abi: MinterDAExpSettlementV3,
      client: this.client,
    });

    return minterContract;
  }

  private isSaleValid(
    totalMinted: bigint,
    maxSupply: bigint,
    saleStart: number
  ): boolean {
    const now = Math.floor(Date.now() / 1000);
    const saleOpen = saleStart <= now;
    const quantityAvailable = maxSupply > totalMinted;
    return quantityAvailable && saleOpen;
  }
}
