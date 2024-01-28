import { Chain, extractChain } from "viem";
import { DESTINATION_CHAINS } from "../config/constants";

export const bigintSerializer = (key: string, value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString() + "n";
  }

  return value;
};

export const bigintDeserializer = (key: string, value: unknown): unknown => {
  if (typeof value === "string" && /^-?\d+n$/.test(value)) {
    return BigInt(value.slice(0, -1));
  }

  return value;
};

export const idToChain = (id: number): Chain => {
  return extractChain({
    chains: DESTINATION_CHAINS,
    id: id as any,
  });
};
