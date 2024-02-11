import { NFTExtraction, ServiceConfig, UIData } from "..";
import { IPlatformService } from "../interfaces/IPlatformService";

export class OpenSeaService implements IPlatformService {
  public readonly platformName: string;
  public readonly platformLogoUrl: string;
  private apiKey: string;

  constructor(config: ServiceConfig) {
    this.platformName = config.platformName;
    this.platformLogoUrl = config.platformLogoUrl;

    if (!config.apiKey) {
      throw new Error("OpenSea API key is required");
    }

    this.apiKey = config.apiKey;
  }
  getMinterAddress(
    contract: string,
    tokenId: bigint
  ): Promise<string | undefined> {
    throw new Error("Method not implemented.");
  }
  getMintSignature(nftDetails: NFTExtraction): Promise<string | undefined> {
    throw new Error("Method not implemented.");
  }
  getUIData(
    signature: string,
    contract: string,
    tokenId: bigint
  ): Promise<UIData | undefined> {
    throw new Error("Method not implemented.");
  }
  getPrice(
    contractAddress: string,
    nftId: bigint,
    signature: string,
    userAddress: string,
    unit?: bigint | undefined
  ): Promise<bigint | undefined> {
    throw new Error("Method not implemented.");
  }
  getArgs(
    contractAddress: string,
    tokenId: bigint,
    senderAddress: string,
    signature: string,
    price: bigint
  ): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
}
