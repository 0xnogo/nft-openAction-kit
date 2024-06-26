import { Chain } from "viem";
import { IPlatformService } from "../interfaces/IPlatformService";

export type ServiceConfig = {
  chain: Chain;
  platformName: string;
  platformLogoUrl: string;
  apiKey?: string;
};

export type NftPlatformConfig = { [key: string]: NFTPlatform };

export type SdkConfig = {
  decentApiKey: string;
  raribleApiKey?: string;
  openSeaApiKey?: string;
};

export type ChainConfig = {
  lensHubProxyAddress: string;
  decentOpenActionContractAddress: string;
};

type Token = {
  address: string;
  amount: bigint;
  chainId: string;
};

export type UIData = {
  platformName: string;
  platformLogoUrl: string;
  nftName: string;
  nftUri: string;
  nftCreatorAddress?: string;
  tokenStandard: string;
  dstChainId: number;
};

export type ActionData = {
  actArguments: {
    publicationActedProfileId: bigint;
    publicationActedId: bigint;
    actorProfileId: bigint;
    referrerProfileIds: bigint[];
    referrerPubIds: bigint[];
    actionModuleAddress: string;
    actionModuleData: `0x${string}`;
  };
  uiData: UIData;
  actArgumentsFormatted: {
    paymentToken: Token;
    bridgeFeeNative: number;
    dstChainId: number;
  };
};

export type PublicationInfo = {
  profileId: string;
  actionModules: string[];
  actionModulesInitDatas: string[];
  pubId: string;
};

export type PlatformServiceConstructor = new (
  config: ServiceConfig
) => IPlatformService;

export type NFTPlatform = {
  platformName: string;
  platformLogoUrl: string;
  urlPattern: RegExp;
  urlExtractor: (url: string) => Promise<NFTExtraction | undefined>;
  platformService: PlatformServiceConstructor;
  apiKey?: string;
};

export type NFTExtraction<TChain extends Chain = Chain> = {
  chain: TChain;
  contractAddress: string;
  minterAddress?: string;
  nftId: string;
  service: IPlatformService;
};
