import { arbitrum, base, mainnet, optimism, polygon, zora } from "viem/chains";
import { ChainConfig } from "../types";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const network: string = "polygon"; // options: 'polygon', 'mumbai'

export const CHAIN_CONFIG: ChainConfig =
  network === "polygon"
    ? {
        lensHubProxyAddress: "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d",
        decentOpenActionContractAddress:
          "0xA117BEc22a9a2f96725D986941899f90B705c67D",
      }
    : {
        lensHubProxyAddress: "0x4fbffF20302F3326B20052ab9C217C44F6480900",
        decentOpenActionContractAddress:
          "0xe310b5Ed0B3c19B1F0852Ce985a4C38BAE738FDb",
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
