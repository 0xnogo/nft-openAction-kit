import { Chain } from "viem";
import { NFTExtraction, NftPlatformConfig } from "..";
import { IPlatformService } from "./IPlatformService";

export interface IDetectionEngine {
  nftPlatformConfig: NftPlatformConfig;

  detectNFTDetails(url: string): Promise<NFTExtraction | undefined>;
  getService(name: string, dstChain: Chain): IPlatformService {
}
