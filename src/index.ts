import * as dotenv from "dotenv";
dotenv.config();

export * from "./NftOpenActionKit";
export * from "./interfaces/INftOpenActionKit";
export * from "./types";

import { NftOpenActionKit } from "./NftOpenActionKit";
import { CHAIN_CONFIG } from "./config/constants";
import { PostCreatedEventFormatted } from "./types";

const sdk = new NftOpenActionKit({
  decentApiKey: "9b4c169dba54a9d9b1ed3b10a963159e",
  raribleApiKey: "19a238f1-2795-4147-9311-cde8146c5cf6",
});

// https://rarible.com/token/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85:97210543356365947583903670903433638628829406556346000984525494880998375939932
// ETHEREUM:0x22318dc6db1ba94a7a1b32437e7867cc415286a1:732
sdk
  .detectAndReturnCalldata(
    // "https://rarible.com/token/0x8d0802559775c70fb505f22988a4fd4a4f6d3b62:64663"
    // "https://rarible.com/token/polygon/0x926fba2b47916fcf58d165d44d6d9714d31ee397:155"
    "https://rarible.com/token/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85:97210543356365947583903670903433638628829406556346000984525494880998375939932"
  )
  .then((calldata: any) => {
    console.log(calldata);

    if (!calldata) {
      return;
    }

    const post: PostCreatedEventFormatted = {
      args: {
        actionModulesInitReturnDatas: [""],
        postParams: {
          profileId: "48935",
          contentURI:
            "https://zora.co/collect/base:0x751362d366f66ecb70bf67e0d941daa7e34635f5/0",
          actionModules: [CHAIN_CONFIG.decentOpenActionContractAddress],
          actionModulesInitDatas: [calldata!],
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

    sdk
      .actionDataFromPost(
        post,
        "50000",
        "0x444483c2d87a6C298f44c223C0638A3eAc7B6ea0",
        "137"
      )
      .then((actionData: any) => {
        console.log(actionData);
      });
  });
