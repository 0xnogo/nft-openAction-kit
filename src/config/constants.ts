import { arbitrum, base, mainnet, optimism, polygon, zora } from "viem/chains";
import { ChainConfig } from "../types";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const network: string = "polygon"; // options: 'polygon', 'mumbai'

export const CHAIN_CONFIG: ChainConfig =
  network === "polygon"
    ? {
        openActionContractAddress: "0x7c4fAeef5ba47a437DFBaB57C016c1E706F56fcf",
        lensHubProxyAddress: "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d",
        collectActionContractAddress:
          "0x0D90C58cBe787CD70B5Effe94Ce58185D72143fB",
        simpleCollectModuleContractAddress:
          "0x060f5448ae8aCF0Bc06D040400c6A89F45b488bb",
        decentOpenActionContractAddress:
          "0x14860D0495CAF16914Db10117D4111AC4Da2F0a5",
        wMatic: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      }
    : {
        openActionContractAddress: "0x038D178a5aF79fc5BdbB436daA6B9144c669A93F",
        lensHubProxyAddress: "0x4fbffF20302F3326B20052ab9C217C44F6480900",
        collectActionContractAddress:
          "0x4FdAae7fC16Ef41eAE8d8f6578d575C9d64722f2",
        simpleCollectModuleContractAddress:
          "0x345Cc3A3F9127DE2C69819C2E07bB748dE6E45ee",
        decentOpenActionContractAddress:
          "0xe310b5Ed0B3c19B1F0852Ce985a4C38BAE738FDb",
        wMatic: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
      };

export const DESTINATION_CHAINS = [
  zora,
  optimism,
  base,
  mainnet,
  polygon,
  arbitrum,
];
