import { ActionData, PostCreatedEventFormatted } from "..";

export interface INftOpenActionKit {
  detectAndReturnCalldata(contentURI: string): Promise<string | undefined>;

  actionDataFromPost(
    post: PostCreatedEventFormatted,
    profileId: string,
    senderAddress: string,
    srcChainId: string
  ): Promise<ActionData>;
}
