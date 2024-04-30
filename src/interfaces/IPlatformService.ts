import { NFTExtraction, UIData } from "../types";

/**
 * Interface for platform services
 * @interface IPlatformService
 * @param getMintSignature - returns the signature of the mint function
 * @param getUIData - returns the UI data for the NFT
 * @param getPrice - returns the price of the NFT
 * @param getArgs - returns the arguments for the mint function
 */
export interface IPlatformService {
  platformName: string;
  getMinterAddress(
    contract: string,
    tokenId: bigint
  ): Promise<string | undefined>;
  getMintSignature(nftDetails: NFTExtraction): Promise<string | undefined>;
  getUIData(
    signature: string,
    contract: string,
    tokenId: bigint,
    dstChainId: bigint,
    sourceUrl?: string
  ): Promise<UIData | undefined>;
  getPrice(
    contractAddress: string,
    nftId: bigint,
    signature: string,
    userAddress: string,
    unit?: bigint,
    sourceUrl?: string
  ): Promise<bigint | undefined>;
  getArgs(
    contractAddress: string,
    tokenId: bigint,
    senderAddress: string,
    signature: string,
    price: bigint,
    quantity: bigint,
    profileOwnerAddress: string,
    sourceUrl?: string
  ): Promise<any[]>;
}
