import { Address, decodeAbiParameters } from "viem";
import { CHAIN_CONFIG } from "./config/constants";
import { BASE_URL } from "./config/endpoints";
import { NFT_PLATFORM_CONFIG } from "./platform/nftPlatforms";
import {
  ActionData,
  PlatformServiceConstructor,
  PostCreatedEventFormatted,
} from "./types";
import { bigintDeserializer, bigintSerializer, idToChain } from "./utils";

/**
 * Fetches action data from post
 * @param post Post object
 * @param profileId Profile ID of the user
 * @param senderAddress Address of the user
 * @param srcChainId Chain ID of the source chain
 * @returns action data
 */
export async function actionDataFromPost(
  post: PostCreatedEventFormatted,
  profileId: string,
  senderAddress: string,
  srcChainId: string,
  decentApiKey: string
): Promise<ActionData> {
  const [contract, tokenId, token, dstChainId, _, signature, platform] =
    fetchParams(post)!;

  const PlateformService: PlatformServiceConstructor =
    NFT_PLATFORM_CONFIG[platform].platformService;

  // from id to the viem chain object
  const dstChain = idToChain(Number(dstChainId));
  const plateformService = new PlateformService(dstChain);

  // logic to fetch the price + fee from the platform
  const price = await plateformService.getPrice(contract, tokenId, signature);

  if (!price) {
    throw new Error("No price");
  }

  const actionRequest = {
    sender: senderAddress,
    srcChainId: parseInt(srcChainId),
    srcToken: CHAIN_CONFIG.wMatic,
    dstChainId,
    dstToken: token,
    slippage: 3, // 1%
    actionType: "lens-open-action",
    actionConfig: {
      functionCall: "processPublicationAction",
      pubId: post.args.pubId,
      profileId: post.args.postParams.profileId,
      contractAddress:
        (await plateformService.getMinterAddress(contract, tokenId)) ??
        contract,
      chainId: dstChainId,
      cost: {
        isNative: true,
        amount: price,
      },
      signature,
      args: plateformService.getArgs(
        contract,
        tokenId,
        senderAddress,
        signature,
        price
      ),
    },
  };

  const url = `${BASE_URL}?arguments=${JSON.stringify(
    actionRequest,
    bigintSerializer
  )}`;

  const response = await fetch(url, {
    headers: {
      "x-api-key": decentApiKey!,
    },
  });
  const data = await response.text();

  const resp = JSON.parse(data, bigintDeserializer);

  console.log(resp);

  // TODO: commented for now as Decent API is not returning actionResponse
  // if (resp.success == "false" || !resp.actionResponse) {
  //   throw new Error("No action response");
  // }

  // TODO: check with Decent team why actionResponse is not present in the response
  // const encodedActionData = resp.actionResponse!.arbitraryData.lensActionData;

  const actArguments = {
    publicationActedProfileId: BigInt(post.args.postParams.profileId),
    publicationActedId: BigInt(post.args.pubId),
    actorProfileId: BigInt(profileId!),
    referrerProfileIds: [],
    referrerPubIds: [],
    actionModuleAddress: CHAIN_CONFIG.decentOpenActionContractAddress,
    // actionModuleData: encodedActionData as `0x${string}`,
    actionModuleData: "0x123456789" as `0x${string}`,
  };

  const uiData = await plateformService.getUIData(signature, contract, tokenId);

  if (!uiData) {
    throw new Error("No UI data");
  }

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
