import { arbitrum, base, mainnet, optimism, polygon, zora } from "viem/chains";
import { ChainConfig } from "../types";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const network: string = "polygon"; // options: 'polygon', 'mumbai'

export const CHAIN_CONFIG: ChainConfig =
  network === "polygon"
    ? {
        lensHubProxyAddress: "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d",
        decentOpenActionContractAddress:
          "0xa04e00b99dd47835acfeaf4df7f3d5afcb1f77c3",
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
