import { encodeAbiParameters, encodePacked, parseUnits } from "viem";
import { ZERO_ADDRESS } from "./config/constants";
import { IPlatformService } from "./interfaces/IPlatformService";
import { detectNFTDetails } from "./platform/nftPlatforms";

/**
 * Detects NFT details from URL and returns calldata for minting
 * @param contentURI URL of the NFT
 * @returns calldata for minting
 */
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
