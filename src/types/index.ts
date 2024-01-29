import { Chain } from "viem";
import { IPlatformService } from "../interfaces/IPlatformService";

export type ChainConfig = {
  openActionContractAddress: string;
  lensHubProxyAddress: string;
  collectActionContractAddress: string;
  simpleCollectModuleContractAddress: string;
  decentOpenActionContractAddress: string;
  wMatic: string;
};

export type UIData = {
  platformName: string;
  platformLogoUrl: string;
  nftName: string;
  nftUri: string;
  nftCreatorAddress: string;
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
};

export type PostCreatedEventFormatted = {
  args: {
    postParams: {
      profileId: string;
      contentURI: string;
      actionModules: string[];
      actionModulesInitDatas: string[];
      referenceModule: string;
      referenceModuleInitData: string;
    };
    pubId: string;
    actionModulesInitReturnDatas: string[];
    referenceModuleInitReturnData: string;
    transactionExecutor: string;
    timestamp: string;
  };
  blockNumber: string;
  transactionHash: string;
};

export type PlatformServiceConstructor = new (chain: Chain) => IPlatformService;

export type NFTPlatform = {
  platformName: string;
  platformLogoUrl: string;
  urlPattern: RegExp;
  urlExtractor: (url: string) => NFTExtraction | undefined;
  platformService: PlatformServiceConstructor;
};

export type NFTExtraction = {
  platform: NFTPlatform;
  chain: Chain;
  contractAddress: string;
  nftId: string;
  service: IPlatformService;
};
