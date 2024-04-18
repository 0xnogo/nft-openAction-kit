import {
  Address,
  decodeAbiParameters,
  encodeAbiParameters,
  encodePacked,
  parseUnits,
} from "viem";
import { DetectionEngine } from "./DetectionEngine";
import { CHAIN_CONFIG, ZERO_ADDRESS } from "./config/constants";
import { BASE_URL } from "./config/endpoints";
import { IDetectionEngine } from "./interfaces/IDetectionEngine";
import {
  ActionDataFromPostParams,
  DetectAndReturnCalldataParams,
  INftOpenActionKit,
} from "./interfaces/INftOpenActionKit";
import { IPlatformService } from "./interfaces/IPlatformService";
import { ActionData, PublicationInfo, SdkConfig } from "./types";
import { bigintDeserializer, bigintSerializer, idToChain } from "./utils";

/**
 * NFTOpenActionKit class
 * @class
 * @classdesc NFTOpenActionKit class: Detects NFT details from URL and returns calldata for minting
 * @constructor
 * @param {SdkConfig} config - SDK configuration
 */
export class NftOpenActionKit implements INftOpenActionKit {
  private decentApiKey: string;
  private detectionEngine: IDetectionEngine;

  // TODO: add the RPC url as input
  constructor(config: SdkConfig) {
    if (!config.decentApiKey) {
      throw new Error("Decent API key is mandatory.");
    }
    this.decentApiKey = config.decentApiKey;
    this.detectionEngine = new DetectionEngine(config);
  }

  /**
   * Detects NFT details from URL and returns calldata for minting
   * @param contentURI URI of the publication
   * @param publishingClientProfileId profileId of application where publication is created
   * @returns calldata for minting
   */
  public async detectAndReturnCalldata({
    contentURI,
    publishingClientProfileId,
  }: DetectAndReturnCalldataParams): Promise<string | undefined> {
    const nftDetails = await this.detectionEngine.detectNFTDetails(contentURI);
    if (nftDetails) {
      const service: IPlatformService = nftDetails.service;
      const mintSignature = await service.getMintSignature(nftDetails);
      if (!mintSignature) {
        return;
      }

      const nftAddress = nftDetails.contractAddress;
      const nftId = nftDetails.nftId != null ? BigInt(nftDetails.nftId) : 0n;
      const paymentToken = ZERO_ADDRESS;
      const cost = parseUnits("0", 18); // workaround - price fetched in actionDataFromPost
      const dstChainId = nftDetails.chain.id;
      return this.calldataGenerator(
        nftAddress,
        nftId,
        paymentToken,
        BigInt(dstChainId),
        cost,
        BigInt(publishingClientProfileId),
        mintSignature,
        nftDetails.service.platformName
      );
    }
  }

  /**
   * Fetches action data from post
   * @param post Post object
   * @param profileId Profile ID of the user
   * @param profileOwnerAddress Address owning profileID
   * @param senderAddress Address of the user
   * @param srcChainId Chain ID of the source chain
   * @param quantity Quantity of 1155 NFT mints
   * @returns action data
   */
  public async actionDataFromPost({
    post,
    profileId,
    profileOwnerAddress,
    senderAddress,
    srcChainId,
    quantity,
    paymentToken,
    executingClientProfileId,
    mirrorerProfileId,
    mirrorPubId,
  }: ActionDataFromPostParams): Promise<ActionData> {
    const [contract, tokenId, token, dstChainId, , , signature, platform] =
      this.fetchParams(post)!;

    // from id to the viem chain object
    const dstChain = idToChain(Number(dstChainId));
    const platformService = this.detectionEngine.getService(platform, dstChain);

    // logic to fetch the price + fee from the platform
    const price = await platformService.getPrice(
      contract,
      tokenId,
      signature,
      senderAddress
    );

    if (!price) {
      throw new Error("No price");
    }

    const actionRequest = {
      sender: senderAddress,
      srcChainId: parseInt(srcChainId),
      srcToken: paymentToken,
      dstChainId: Number(dstChainId),
      dstToken: token,
      slippage: 3, // 1%
      actionType: "lens-open-action",
      actionConfig: {
        functionCall: "processPublicationAction",
        pubId: post.pubId,
        profileId: post.profileId,
        contractAddress:
          (await platformService.getMinterAddress(contract, tokenId)) ??
          contract,
        chainId: Number(dstChainId),
        cost: {
          isNative: true,
          amount: price,
        },
        signature,
        args: await platformService.getArgs(
          contract,
          tokenId,
          senderAddress,
          signature,
          price,
          BigInt(quantity),
          profileOwnerAddress
        ),
      },
    };

    const url = `${BASE_URL}?arguments=${JSON.stringify(
      actionRequest,
      bigintSerializer
    )}`;

    const response = await fetch(url, {
      headers: {
        "x-api-key": this.decentApiKey,
      },
    });
    const data = await response.text();

    const resp = JSON.parse(data, bigintDeserializer);

    if (resp.success === "false" || !resp.arbitraryData) {
      throw new Error("No action response", resp.error);
    }

    const encodedActionData = resp.arbitraryData.lensActionData;

    let referrerProfileIds = [];
    let referrerPubIds = [];

    if (!!mirrorerProfileId && !!mirrorPubId) {
      referrerProfileIds = [
        BigInt(mirrorerProfileId),
        BigInt(executingClientProfileId),
      ];
      referrerPubIds = [BigInt(mirrorPubId), BigInt(0)];
    } else {
      referrerProfileIds = [BigInt(executingClientProfileId)];
      referrerPubIds = [BigInt(0)];
    }

    const actArguments = {
      publicationActedProfileId: BigInt(post.profileId),
      publicationActedId: BigInt(post.pubId),
      actorProfileId: BigInt(profileId!),
      referrerProfileIds,
      referrerPubIds,
      actionModuleAddress: CHAIN_CONFIG.decentOpenActionContractAddress,
      actionModuleData: encodedActionData as `0x${string}`,
    };

    const uiData = await platformService.getUIData(
      signature,
      contract,
      tokenId
    );

    if (!uiData) {
      throw new Error("No UI data");
    }

    /*         amountOut: {
          address: resp.amountOut.tokenAddress,
          amount: resp.amountOut.amount,
          chainId: dstChainId.toString(),
        },
        bridgeFee: {
          address: resp.bridgeFee.tokenAddress,
          amount: resp.bridgeFee.amount,
          chainId: srcChainId,
        }, */

    return {
      actArguments,
      uiData,
      actArgumentsFormatted: {
        paymentToken: {
          address: resp.tokenPayment.tokenAddress,
          amount: resp.tokenPayment.amount,
          chainId: srcChainId,
        },
      },
    };
  }

  private calldataGenerator(
    contractAddress: string,
    nftId: bigint,
    paymentToken: string,
    dstChainId: bigint,
    cost: bigint,
    publishingClientProfileId: bigint,
    mintSignatureMethod: string,
    platformName: string
  ): string {
    return encodeAbiParameters(
      [
        // contract address of call
        { type: "address" },
        // tokenId of the nft
        { type: "uint256" },
        // the payment token for the action (i.e.mint) zeroAddress if cost is native or free
        { type: "address" },
        // chainId of that contract
        { type: "uint256" },
        // cost of the function call
        { type: "uint256" },
        // profileId of application where publication is created
        { type: "uint256" },
        // signature of the mint function
        { type: "bytes" },
        // platform name
        { type: "bytes" },
      ],
      [
        contractAddress as `0x${string}`,
        nftId,
        paymentToken as `0x${string}`,
        dstChainId,
        cost,
        publishingClientProfileId,
        encodePacked(["string"], [mintSignatureMethod]),
        encodePacked(["string"], [platformName]),
      ]
    );
  }

  private fetchParams = (
    post: PublicationInfo
  ):
    | readonly [
        `0x${string}`,
        bigint,
        `0x${string}`,
        bigint,
        bigint,
        bigint,
        string,
        string
      ]
    | undefined => {
    const actionModules = post.actionModules;
    const index = actionModules.indexOf(
      CHAIN_CONFIG.decentOpenActionContractAddress
    );
    if (index < 0) return;
    const actionModuleInitData = post.actionModulesInitDatas[index] as Address;

    return decodeAbiParameters(
      [
        { type: "address" },
        { type: "uint256" },
        { type: "address" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "string" },
        { type: "string" },
      ],
      actionModuleInitData
    );
  };
}
