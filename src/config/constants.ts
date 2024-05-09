import { arbitrum, base, mainnet, optimism, polygon, zora } from "viem/chains";
import { ChainConfig } from "../types";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CHAIN_CONFIG: ChainConfig = {
  lensHubProxyAddress: "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d",
  decentOpenActionContractAddress: "0x028f6aeE3CF9e1cA725f4C47d9460801b6c7508A",
};

export const DESTINATION_CHAINS = [
  zora,
  optimism,
  base,
  mainnet,
  polygon,
  arbitrum,
];

export const InitData = [
  {
    name: "data",
    type: "tuple",
    internalType: "struct InitializedAction",
    components: [
      { name: "targetContract", type: "address", internalType: "address" },
      { name: "tokenId", type: "uint256", internalType: "uint256" },
      { name: "paymentToken", type: "address", internalType: "address" },
      { name: "chainId", type: "uint256", internalType: "uint256" },
      { name: "cost", type: "uint256", internalType: "uint256" },
      {
        name: "publishingClientProfileId",
        type: "uint256",
        internalType: "uint256",
      },
      { name: "signature", type: "bytes", internalType: "bytes" },
      { name: "platformName", type: "bytes", internalType: "bytes" },
    ],
  },
] as const;
