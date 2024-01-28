import { Chain } from "viem";
import { NFTExtraction } from "../config/nftPlatformsConfig";

export interface UIData {
  platformName: string;
  platformLogoUrl: string;
  nftName: string;
  nftUri: string;
  nftCreatorAddress: string;
}

export interface IPlatformService {
  getMintSignature(nftDetails: NFTExtraction): Promise<string | undefined>;
  getUIData(
    signature: string,
    contract: string,
    tokenId: bigint
  ): Promise<UIData | undefined>;
  getPrice(
    chain: Chain,
    contractAddress: string,
    nftId: bigint,
    signature: string,
    unit?: bigint
  ): Promise<bigint | undefined>;
  getArgs(
    tokenId: bigint,
    senderAddress: string,
    minter: string,
    signature: string
  ): any[];
}
