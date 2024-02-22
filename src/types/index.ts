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
  openActionContractAddress: string;
  lensHubProxyAddress: string;
  collectActionContractAddress: string;
  simpleCollectModuleContractAddress: string;
  decentOpenActionContractAddress: string;
  wMatic: string;
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
    bridgeFee: Token;
    amountOut: Token;
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
  nftId: string;
  service: IPlatformService;
};
