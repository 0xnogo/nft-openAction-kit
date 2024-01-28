import { Address, decodeAbiParameters } from "viem";
import {
  BASE_URL,
  CHAIN_CONFIG,
  CHAIN_ID_TO_KEY,
  DECENT_API_KEY,
  ZORA_CHAIN_ID_MAPPING,
} from "./config/constants";
import {
  NFT_PLATFORM_CONFIG,
  PlatformServiceConstructor,
} from "./platform/nftPlatforms";
import { bigintDeserializer, bigintSerializer } from "./utils";

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

export async function actionDataFromPost(
  post: PostCreatedEventFormatted,
  profileId: string,
  senderAddress: string,
  srcChainId: bigint
): Promise<any | undefined> {
  const [contract, tokenId, token, dstChainId, _, signature, platform] =
    fetchParams(post)!;

  const dstChain = ZORA_CHAIN_ID_MAPPING[CHAIN_ID_TO_KEY[Number(dstChainId)]];
  const PlateformService: PlatformServiceConstructor =
    NFT_PLATFORM_CONFIG[platform].platformService;

  const plateformService = new PlateformService(dstChain);

  // logic to fetch the price + fee from the platform
  const cost = await plateformService.getPrice(
    dstChain,
    contract,
    tokenId,
    signature
  );

  const actionRequest = {
    sender: senderAddress,
    srcChainId: parseInt(srcChainId.toString()),
    srcToken: CHAIN_CONFIG.wMatic,
    dstChainId: dstChain.id,
    dstToken: token,
    slippage: 3, // 1%
    actionType: "lens-open-action",
    actionConfig: {
      functionCall: "processPublicationAction",
      pubId: post.args.pubId,
      profileId: post.args.postParams.profileId,
      contractAddress: contract,
      chainId: dstChain.id,
      cost: {
        isNative: true,
        amount: cost,
      },
      signature,
      args: plateformService.getArgs(
        tokenId,
        senderAddress,
        dstChain.erc1155ZoraMinter,
        signature
      ),
    },
  };

  const url = `${BASE_URL}?arguments=${JSON.stringify(
    actionRequest,
    bigintSerializer
  )}`;

  const response = await fetch(url, {
    headers: {
      "x-api-key": DECENT_API_KEY!,
    },
  });
  const data = await response.text();

  const resp = JSON.parse(data, bigintDeserializer);

  if (resp.success == "false" || !resp.actionResponse) {
    throw new Error("No action response");
  }

  const encodedActionData = resp.actionResponse!.arbitraryData.lensActionData;

  const actArguments = {
    publicationActedProfileId: BigInt(post.args.postParams.profileId),
    publicationActedId: BigInt(post.args.pubId),
    actorProfileId: BigInt(profileId!),
    referrerProfileIds: [],
    referrerPubIds: [],
    actionModuleAddress: CHAIN_CONFIG.decentOpenActionContractAddress,
    actionModuleData: encodedActionData as `0x${string}`,
  };

  const uiData = await plateformService.getUIData(signature, contract, tokenId);

  return { actArguments, uiData };
}

export const fetchParams = (
  post: PostCreatedEventFormatted
):
  | readonly [
      `0x${string}`,
      bigint,
      `0x${string}`,
      bigint,
      bigint,
      string,
      string
    ]
  | undefined => {
  const actionModules = post.args.postParams.actionModules;
  const index = actionModules.indexOf(
    CHAIN_CONFIG.decentOpenActionContractAddress
  );
  if (index < 0) return;
  const actionModuleInitData = post.args.postParams.actionModulesInitDatas[
    index
  ] as Address;

  return decodeAbiParameters(
    [
      { type: "address" },
      { type: "uint256" },
      { type: "address" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "string" },
      { type: "string" },
    ],
    actionModuleInitData
  );
};

const post: PostCreatedEventFormatted = {
  args: {
    actionModulesInitReturnDatas: [""],
    postParams: {
      profileId: "48935",
      contentURI:
        "https://zora.co/collect/base:0x751362d366f66ecb70bf67e0d941daa7e34635f5/0",
      actionModules: [CHAIN_CONFIG.decentOpenActionContractAddress],
      actionModulesInitDatas: [
        "0x000000000000000000000000751362d366f66ecb70bf67e0d941daa7e34635f5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002105000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000006c66756e6374696f6e206d696e745769746852657761726473286164647265737320726563697069656e742c2075696e74323536207175616e746974792c20737472696e672063616c6c6461746120636f6d6d656e742c2061646472657373206d696e74526566657272616c29000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a6f726100000000000000000000000000000000000000000000000000000000",
      ],
      referenceModule: "0x0000000000000000000000000000000000000000",
      referenceModuleInitData: "0x01",
    },
    pubId: "10",
    referenceModuleInitReturnData: "0x",
    timestamp: "1704816612",
    transactionExecutor: "0x755bdaE53b234C6D1b7Be9cE7F316CF8f03F2533",
  },
  blockNumber: "52127727",
  transactionHash:
    "0x95f6175eb48fb4da576268e5dfa0ffd2f54619abdd367d65c99b2009b9f62331",
};

// actionDataFromPost(
//   post,
//   "50000",
//   "0x444483c2d87a6C298f44c223C0638A3eAc7B6ea0",
//   137n
// ).then((calldata) => console.log(calldata));
