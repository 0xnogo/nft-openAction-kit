# nft-openaction-kit

## Description

The nft-openaction-kit package simplifies the process of integrating an NFT minting open action into Lens applications. This package has two core functionalities:

When a user posts a link to an NFT in a Lens Publication, this package will parse data from the URL and smart contracts to embed an NFT minting open action into the Lens Publication.

When a post appears in a Lens application feed with the NFT minting action attached, the app can use this package to populate metadata to appear on a UI and generate calldata to perform the transaction.

## Features

- Function 1: `detectAndReturnCalldata`. Detects the NFT platform and returns the calldata to be used in the post action.
- Function 2: `actionDataFromPost`. Returns the encoded calldata from Decent and UI data for the post action.
- Extensible: the kit is extensible to add new NFT platforms with the usage of `IPlatformService` interface.
- Zora detection logic: detect collections with an active sale (ZoraCreatorFixedPriceSaleStrategy for ERC1155 or contract collection for ERC721). All other cases are discarded as they don't represent a minting event (require specific handling - e.g. Seaport integration).

> `actionDataFromPost` is returing `undefined` as the actionResponse from Decent is empty.

> The route from Polygon to Zora is not configured in the Decent API.

## Installation

1. Clone the repo

   ```sh
   git clone https://github.com/0xnogo/nft-openAction-kit.git
   ```

2. Install NPM packages

   ```sh
   yarn install
   ```

3. Build

   ```sh
   yarn build
   ```

## Usage

> The package is not published. To use is locally, run `yarn link` in the root directory and `yarn link nft-openaction-kit` in the project you want to use it.

1. Create a .env file in the root directory and add the following variables:

   ```sh
   DECENT_API_KEY=api-key
   RARIBLE_API_KEY=api-key
   ```

2. Instantiate the `NFTOpenActionKit` class and use the `detectAndReturnCalldata` and `actionDataFromPost` methods.

```js
import { NFTOpenActionKit } from "nft-openaction-kit";

const nftOpenActionKit = new NFTOpenActionKit({
  decentApiKey: process.env.DECENT_API_KEY,
  raribleApiKey: process.env.RARIBLE_API_KEY,
});
```

> Only the `decentApiKey` is required. The `raribleApiKey` is optional, which would make the Rareble detection available.

3. Use `detectAndReturnCalldata`

```js
const fetchCalldata = async () => {
  try {
    const result = await nftOpenActionKit.detectAndReturnCalldata(url);
    console.log(result || "No calldata found");
  } catch (err) {
    console.log(err);
  }
};
```

3. Use `actionDataFromPost`

```js
const post: PostCreatedEventFormatted = {
  args: {
    actionModulesInitReturnDatas: [""],
    postParams: {
      profileId: "48935",
      contentURI:
        "https://zora.co/collect/base:0x751362d366f66ecb70bf67e0d941daa7e34635f5/0",
      actionModules: ["0x99Cd5A6e51C85CCc63BeC61A177003A551953628"],
      actionModulesInitDatas: [calldata],
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

try {
  // Call the async function and pass the link
  const result: ResultData = await nftOpenActionKit.actionDataFromPost(
    post,
    profileId,
    senderAddress,
    srcChainId,
    apiKey
  );
} catch (error) {
  console.log(error);
}
```

> The `actionDataFromPost` function is accepting as input a PostCreatedEventFormatted object (as defined in <https://github.com/wkantaros/lens-openAction>). Another interface could be defined if needed (as long as it has the required fields).

## Add a new NFT platform

1. If an api is required, modify the SdkConfig type in `src/types/index.ts`:

```js
type SdkConfig = {
  decentApiKey: string;
  raribleApiKey?: string;
};
```

2. Modify the initializePlatformConfig function in `src/DetectionEngine.ts` and add the new platform config following the type:

```js
export type NFTPlatform = {
  platformName: string;
  platformLogoUrl: string;
  urlPattern: RegExp;
  urlExtractor: (url: string) => Promise<NFTExtraction | undefined>;
  urlExtractor: (url: string) => Promise<NFTExtraction | undefined>;
  platformService: PlatformServiceConstructor;
  apiKey?: string;
};
```

> If an api key is required, make sure to add it in the `DetectionEngine` class and handle it in the `initializePlatformConfig` function. The Rareble detection is an example of how to handle an api key.


3. Create a new file in `src/platform` and add the platform service class. The class should implement the `IPlatformService` interface.

```js
interface IPlatformService {
  platformName: string;
  getMinterAddress(
    contract: string,
    tokenId: bigint
  ): Promise<string | undefined>;
  getMintSignature(nftDetails: NFTExtraction): Promise<string | undefined>;
  getUIData(
    signature: string,
    contract: string,
    tokenId: bigint
  ): Promise<UIData | undefined>;
  getPrice(
    contractAddress: string,
    nftId: bigint,
    signature: string,
    userAddress: string,
    unit?: bigint
  ): Promise<bigint | undefined>;
  getArgs(
    contractAddress: string,
    tokenId: bigint,
    senderAddress: string,
    signature: string,
    price: bigint
  ): Promise<any[]>;
}
```
