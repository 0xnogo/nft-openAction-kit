import { Chain, extractChain } from "viem";
import {
  ARWEAVE_GATEWAY,
  DESTINATION_CHAINS,
  IPFS_GATEWAY,
} from "../config/constants";

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

export const fetchIPFSMetadataImageWithFallback = async (
  cid: string | undefined
): Promise<string> => {
  if (!cid) return "";

  const gateway = `https://ipfs.decentralized-content.com/ipfs/${cid}`;

  try {
    const response = await fetchWithTimeout(gateway, 3000);
    if (response.ok) {
      const metadata: any = await response.json();
      return metadata.image || "";
    }
  } catch (error) {
    console.warn(`Error fetching from ${gateway}: ${error}`);
  }

  return "";
};

export const fetchWithTimeout = (
  url: string,
  timeout: number
): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Request timed out")),
      timeout
    );
    fetch(url)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export const sanitizeDStorageUrl = (hash?: string): string => {
  if (!hash) {
    return "";
  }

  const ipfsGateway = `${IPFS_GATEWAY}/`;
  const arweaveGateway = `${ARWEAVE_GATEWAY}/`;

  let link = hash.replace(/^Qm[1-9A-Za-z]{44}/gm, `${IPFS_GATEWAY}/${hash}`);
  link = link.replace("https://ipfs.io/ipfs/", ipfsGateway);
  link = link.replace("ipfs://ipfs/", ipfsGateway);
  link = link.replace("ipfs://", ipfsGateway);
  link = link.replace("ar://", arweaveGateway);

  return link;
};
