import { NftOpenActionKit } from "./NftOpenActionKit";
import { CHAIN_CONFIG } from "./config/constants";

export * from "./NftOpenActionKit";
export * from "./interfaces/INftOpenActionKit";
export * from "./types";

const sdk = new NftOpenActionKit({
  decentApiKey: "9b4c169dba54a9d9b1ed3b10a963159e",
  openSeaApiKey: "29b5132f24444e4f835f045453c98f1a",
});

sdk
  .detectAndReturnCalldata(
    "https://opensea.io/assets/ethereum/0x7ea3cca10668b8346aec0bf1844a49e995527c8b/14099"
  )
  .then((calldata: any) => {
    console.log(calldata);

    if (!calldata) {
      return;
    }

    const post = {
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
