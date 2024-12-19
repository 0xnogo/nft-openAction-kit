import {
  Address,
  decodeAbiParameters,
  encodeAbiParameters,
  encodePacked,
  hexToString,
  parseUnits,
} from "viem";
import { DetectionEngine } from "./DetectionEngine";
import { CHAIN_CONFIG, InitData, ZERO_ADDRESS } from "./config/constants";
import { BASE_URL } from "./config/endpoints";
import { IDetectionEngine } from "./interfaces/IDetectionEngine";
import {
  ActionDataFromPostParams,
  DetectAndReturnCalldataParams,
  INftOpenActionKit,
} from "./interfaces/INftOpenActionKit";
import { IPlatformService } from "./interfaces/IPlatformService";
import { ActionData, PublicationInfo, SdkConfig, UIData } from "./types";
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
      const { mintSignature, paymentToken } = await service.getMintSignature(
        nftDetails
      );

      if (!mintSignature) {
        return;
      }

      const minterAddress = await service.getMinterAddress(
        nftDetails,
        mintSignature
      );

      const nftId = nftDetails.nftId != null ? BigInt(nftDetails.nftId) : 0n;
      const paymentTokenParam = paymentToken ?? ZERO_ADDRESS;
      const cost = parseUnits("0", 18); // workaround - price fetched in actionDataFromPost
      const dstChainId = nftDetails.chain.id;
      return this.calldataGenerator(
        minterAddress,
        nftId,
        paymentTokenParam,
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
    sourceUrl,
  }: ActionDataFromPostParams): Promise<ActionData> {
    const initData = this.fetchParams(post)!;

    // from id to the viem chain object
    const dstChain = idToChain(Number(initData[0].chainId));
    const platformName = hexToString(initData[0].platformName);
    const signature = hexToString(initData[0].signature);
    const platformService = this.detectionEngine.getService(
      platformName,
      dstChain
    );

    // logic to fetch the price + fee from the platform
    const price = await platformService.getPrice(
      initData[0].targetContract,
      initData[0].tokenId,
      signature,
      senderAddress,
      undefined,
      sourceUrl,
      initData[0].paymentToken
    );

    if (!price) {
      throw new Error("No price");
    }

    const actionRequest = {
      sender: senderAddress,
      srcChainId: parseInt(srcChainId),
      srcToken: paymentToken,
      dstChainId: Number(initData[0].chainId),
      dstToken: initData[0].paymentToken,
      slippage: 3, // 1%
      actionType: "lens-open-action",
      actionConfig: {
        functionCall: "processPublicationAction",
        pubId: post.pubId,
        profileId: post.profileId,
        contractAddress: initData[0].targetContract,
        chainId: Number(initData[0].chainId),
        cost: {
          isNative: true,
          amount: price,
        },
        signature,
        args: await platformService.getArgs(
          initData[0].targetContract,
          initData[0].tokenId,
          senderAddress,
          signature,
          price,
          BigInt(quantity),
          profileOwnerAddress,
          sourceUrl,
          initData[0].paymentToken
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
      initData[0].targetContract,
      initData[0].tokenId,
      initData[0].chainId,
      sourceUrl
    );

    if (!uiData) {
      throw new Error("No UI data");
    }

    let bridgeFeeNative = 0;
    if (resp.tx.bridgeFee) {
      bridgeFeeNative =
        Number(
          BigInt(resp.tx.bridgeFee.amount) +
            BigInt(resp.tx.applicationFee.amount)
        ) /
        10 ** 18;
    } else {
      bridgeFeeNative = Number(BigInt(resp.applicationFee.amount)) / 10 ** 18;
    }

    return {
      actArguments,
      uiData,
      actArgumentsFormatted: {
        paymentToken: {
          address: resp.tokenPayment.tokenAddress,
          amount: resp.tokenPayment.amount,
          chainId: srcChainId,
        },
        bridgeFeeNative,
        dstChainId: Number(initData[0].chainId),
      },
    };
  }

  public async generateUiData({
    contentURI,
  }: {
    contentURI: string;
  }): Promise<UIData> {
    const nftDetails = await this.detectionEngine.detectNFTDetails(contentURI);
    if (!nftDetails) {
      throw new Error("NFT details not found");
    }
    const service: IPlatformService = nftDetails.service;
    const { mintSignature } = await service.getMintSignature(nftDetails, true);

    if (!mintSignature) {
      throw new Error("Mint signature not found");
    }

    const nftAddress = nftDetails.contractAddress;
    const nftId = nftDetails.nftId != null ? BigInt(nftDetails.nftId) : 0n;

    const dstChainId = nftDetails.chain.id;

    const platformService = this.detectionEngine.getService(
      nftDetails.service.platformName,
      idToChain(Number(dstChainId))
    );

    const uiData = await platformService.getUIData(
      mintSignature,
      nftAddress,
      nftId,
      BigInt(dstChainId),
      contentURI
    );

    if (!uiData) {
      throw new Error("No UI data");
    }

    return uiData;
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
    return encodeAbiParameters(InitData, [
      {
        targetContract: contractAddress as `0x${string}`,
        tokenId: nftId,
        paymentToken: paymentToken as `0x${string}`,
        chainId: dstChainId,
        cost,
        publishingClientProfileId,
        signature: encodePacked(["string"], [mintSignatureMethod]),
        platformName: encodePacked(["string"], [platformName]),
      },
    ]);
  }

  private fetchParams = (
    post: PublicationInfo
  ):
    | readonly [
        {
          targetContract: `0x${string}`;
          tokenId: bigint;
          paymentToken: `0x${string}`;
          chainId: bigint;
          cost: bigint;
          publishingClientProfileId: bigint;
          signature: `0x${string}`;
          platformName: `0x${string}`;
        }
      ]
    | undefined => {
    const actionModules = post.actionModules;
    const index = actionModules.indexOf(
      CHAIN_CONFIG.decentOpenActionContractAddress
    );
    if (index < 0) return;
    const actionModuleInitData = post.actionModulesInitDatas[index] as Address;
    return decodeAbiParameters(InitData, actionModuleInitData);
  };
}
