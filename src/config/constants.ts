import { base, mainnet, optimism, zora } from "viem/chains";
import { ZoraExtendedChain } from "../platform/ZoraService";
import { ChainConfig } from "../types";

export const CHAIN_ID_TO_KEY: { [id: number]: string } = {
  [mainnet.id]: "eth",
  [zora.id]: "zora",
  [base.id]: "base",
  [optimism.id]: "oeth",
};

export const ZORA_CHAIN_ID_MAPPING: { [key: string]: ZoraExtendedChain } = {
  zora: {
    ...zora,
    erc1155ZoraMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
  },
  eth: {
    ...mainnet,
    erc1155ZoraMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
  },
  base: {
    ...base,
    erc1155ZoraMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
  },
  oeth: {
    ...optimism,
    erc1155ZoraMinter: "0x3678862f04290E565cCA2EF163BAeb92Bb76790C",
  },
};

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
          "0x99Cd5A6e51C85CCc63BeC61A177003A551953628",
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
          "0x48Cc077E082365F1be696cAad2ccF91cEb08D9f9",
        wMatic: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
      };
