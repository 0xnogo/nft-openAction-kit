import { arbitrum, base, mainnet, optimism, polygon, zora } from "viem/chains";
import { ChainConfig } from "../types";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CHAIN_CONFIG: ChainConfig = {
  lensHubProxyAddress: "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d",
  decentOpenActionContractAddress: "0x1525B2a2093E700e17E2749536237C01fE4B4e20",
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
