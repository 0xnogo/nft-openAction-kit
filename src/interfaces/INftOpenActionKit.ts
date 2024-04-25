import { ActionData, PublicationInfo, UIData } from "..";

export interface DetectAndReturnCalldataParams {
  contentURI: string;
  publishingClientProfileId: string;
}

export interface ActionDataFromPostParams {
  post: PublicationInfo;
  profileId: string;
  profileOwnerAddress: string;
  senderAddress: string;
  srcChainId: string;
  quantity: number;
  paymentToken: string;
  executingClientProfileId: string;
  mirrorerProfileId?: string;
  mirrorPubId?: string;
}

export interface INftOpenActionKit {
  detectAndReturnCalldata({
    contentURI,
    publishingClientProfileId,
  }: DetectAndReturnCalldataParams): Promise<string | undefined>;

  actionDataFromPost({
    post,
    profileId,
    profileOwnerAddress,
    senderAddress,
    srcChainId,
    quantity,
    paymentToken,
    mirrorerProfileId,
    mirrorPubId,
    executingClientProfileId,
  }: ActionDataFromPostParams): Promise<ActionData>;

  generateUiData({ contentURI }: { contentURI: string }): Promise<UIData>;
}
