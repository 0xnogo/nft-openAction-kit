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
  getMintSignature(nftDetails: NFTExtraction): Promise<string | undefined>;
  getUIData(
    signature: string,
    contract: string,
    tokenId: bigint
  ): Promise<UIData | undefined>;
  getPrice(
    contractAddress: string,
    nftId: bigint,
    signature: string,
    unit?: bigint
  ): Promise<bigint | undefined>;
  getArgs(tokenId: bigint, senderAddress: string, signature: string): any[];
}
