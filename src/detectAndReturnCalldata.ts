import { encodeAbiParameters, encodePacked, parseUnits } from "viem";
import { ZERO_ADDRESS } from "./config/constants";
import { IPlatformService } from "./platform/IPlatformService";
import { detectNFTDetails } from "./platform/nftPlatforms";

// NEEDS CLARITY:
// We can mint || collect an nft || buy from secondary market (opensea link)
// mint = erc721Drop or erc1155Zora stuff
// collect = independant nft (https://zora.co/collect/base:0x566352022e0ded6b9ec425c94b6f6e476a11952c)
// seem to be using seaport but i don't know what it is and how to create
// is it just scrapping nft collection and calling the mint method on it?

// Also how collection which has sell that is closed are working?
// example: https://zora.co/collect/base:0x32cff5c2a7233097efe3e8dc708d1df141780d69/3
// seems like it is calling a sell method on the contract but not sure as everything is
// behind a weird token (multicall??)

export async function detectAndReturnCalldata(
  contentURI: string
): Promise<string | undefined> {
  const nftDetails = detectNFTDetails(contentURI);

  if (nftDetails) {
    const service: IPlatformService = nftDetails.service;
    const mintSignature = await service.getMintSignature(nftDetails);
    if (!mintSignature) {
      return;
    }

    const nftAddress = nftDetails.contractAddress;
    const nftId = nftDetails.nftId != null ? BigInt(nftDetails.nftId) : 0n;
    const paymentToken = ZERO_ADDRESS;
    const cost = parseUnits("0", 18); // workaround - price fetched in function2
    const dstChainId = nftDetails.chain.id;
    return calldataGenerator(
      nftAddress,
      nftId,
      paymentToken,
      BigInt(dstChainId),
      cost,
      mintSignature,
      nftDetails.platform.platformName
    );
  }
}

function calldataGenerator(
  contractAddress: string,
  nftId: bigint,
  paymentToken: string,
  dstChainId: bigint,
  cost: bigint,
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
      encodePacked(["string"], [mintSignatureMethod]),
      encodePacked(["string"], [platformName]),
    ]
  );
}

// detectAndReturnCalldata(
//   "https://zora.co/collect/base:0x751362d366f66ecb70bf67e0d941daa7e34635f5/0"
// ).then((calldata) => console.log(calldata));

// "https://zora.co/collect/base:0x751362d366f66ecb70bf67e0d941daa7e34635f5/0"; ERC721Drop on BASE
// "https://zora.co/collect/zora:0xe7d32d3bfa4b62599cfe4ba46d414e34635754a5/18"; ERC1155 on ZORA
//

// https://zora.co/collect/base:0x8b4076f75ba69260586c0772c1e15e83021e4dc0 NFT on BASE

//https://zora.co/collect/zora:0xdd6dbda01fd6fea031eda285a70649a8b83d6a1f/2 erc1155 with price
