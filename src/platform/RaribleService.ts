import {
  PublicClient,
  createPublicClient,
  encodeAbiParameters,
  formatEther,
  getContract,
  http,
  keccak256,
  parseAbiParameters,
  parseEther,
  toHex,
} from "viem";
import { mainnet } from "viem/chains";
import { NFTExtraction, ServiceConfig, UIData } from "..";
import { ZERO_ADDRESS } from "../config/constants";
import { IPlatformService } from "../interfaces/IPlatformService";

interface SellOrder {
  id: string;
  take: { type: { "@type": string }; value: string };
  make: { type: { "@type": string } };
  maker: string;
  startedAt: bigint;
  endedAt: bigint;
  data: {
    "@type": string;
    payouts: [];
    originFees: [];
    isMakeFill: boolean;
  };
  salt: string;
  signature: string;
}

export class RaribleService implements IPlatformService {
  readonly platformName: string;
  readonly platformLogoUrl: string;

  readonly minterAddress = {
    ETHEREUM: "0x9757F2d2b135150BBeb65308D4a91804107cd8D6",
    POLYGON: "0x12b3897a36fDB436ddE2788C06Eff0ffD997066e",
  };

  readonly stakingContractAddress =
    "0x096bd9a7a2e703670088c05035e23c7a9f428496";

  private client: PublicClient;

  readonly raribleApiKey: string;

  private mintSignature = `function directPurchase((address sellOrderMaker, uint256 sellOrderNftAmount, bytes4 nftAssetClass, bytes nftData, uint256 sellOrderPaymentAmount, address paymentToken, uint256 sellOrderSalt,uint sellOrderStart,uint sellOrderEnd, bytes4 sellOrderDataType, bytes sellOrderData, bytes sellOrderSignature, uint256 buyOrderPaymentAmount, uint256 buyOrderNftAmount, bytes buyOrderData)) external payable`;

  constructor(config: ServiceConfig) {
    if (!config.apiKey) {
      throw new Error("Rarible API key is mandatory.");
    }

    this.client = createPublicClient({
      chain: config.chain,
      transport: http(),
    });
    this.raribleApiKey = config.apiKey;
    this.platformName = config.platformName;
    this.platformLogoUrl = config.platformLogoUrl;
  }

  async getMinterAddress(
    contract: string,
    tokenId: bigint
  ): Promise<string | undefined> {
    return this.minterAddress[
      this.client.chain!.name.toUpperCase() as "ETHEREUM" | "POLYGON"
    ];
  }

  async getMintSignature(
    nftDetails: NFTExtraction
  ): Promise<string | undefined> {
    const sellOrders = await this.fetchSellOrdersByItem(
      nftDetails.contractAddress,
      nftDetails.nftId.toString(),
      this.client.chain!.name.toUpperCase() as "ETHEREUM" | "POLYGON"
    );

    if (!this.isSaleValid(sellOrders)) {
      return;
    }

    return this.mintSignature;
  }

  async getUIData(
    signature: string,
    contract: string,
    tokenId: bigint
  ): Promise<UIData | undefined> {
    const nftInfo = await this.fetchNFTData(
      contract,
      tokenId,
      this.client.chain!.name.toUpperCase() as "ETHEREUM" | "POLYGON"
    );

    if (!nftInfo) {
      return;
    }

    let nftCreatorAddress;
    if (nftInfo.creators && nftInfo.creators.length > 0) {
      nftCreatorAddress = this.extractContractAddress(
        nftInfo.creators[0].account
      );
    }

    return {
      platformName: this.platformName,
      platformLogoUrl: this.platformLogoUrl,
      nftName: nftInfo.meta.name,
      nftUri: nftInfo.meta.content[0].url,
      ...(nftCreatorAddress ? { nftCreatorAddress } : {}),
    };
  }

  async getPrice(
    contractAddress: string,
    nftId: bigint,
    signature: string,
    userAddress: string,
    unit = 1n
  ): Promise<bigint | undefined> {
    const sellOrders = await this.fetchSellOrdersByItem(
      contractAddress,
      nftId.toString(),
      this.client.chain!.name.toUpperCase() as "ETHEREUM" | "POLYGON"
    );

    if (!this.isSaleValid(sellOrders)) {
      return;
    }

    const price = BigInt(parseEther(sellOrders[0].take.value));

    const fee = await this.getFees(userAddress, price);

    return Promise.resolve((price + (price * fee) / 10000n) * unit);
  }

  async getArgs(
    contractAddress: string,
    tokenId: bigint,
    senderAddress: string,
    signature: string,
    price: bigint
  ): Promise<any[]> {
    const sellOrders = await this.fetchSellOrdersByItem(
      contractAddress,
      tokenId.toString(),
      this.client.chain!.name.toUpperCase() as "ETHEREUM" | "POLYGON"
    );

    const sellOrderMaker = this.extractContractAddress(sellOrders[0].maker);
    const sellOrderStart = sellOrders[0].startedAt
      ? BigInt(
          new Date(sellOrders[0].startedAt as unknown as string).getTime()
        ) / 1000n
      : 0n;
    const sellOrderEnd = sellOrders[0].endedAt
      ? BigInt(new Date(sellOrders[0].endedAt as unknown as string).getTime()) /
        1000n
      : 0n;
    const sellOrderSalt = BigInt(sellOrders[0].salt);
    const sellOrderSignature = sellOrders[0].signature;
    const nftAssetClass = keccak256(
      toHex(sellOrders[0].make.type["@type"])
    ).slice(0, 10);
    const nftData = encodeAbiParameters(
      parseAbiParameters("address token, uint256 id"),
      [contractAddress as `0x{string}`, tokenId]
    );
    const sellOrderPaymentAmount = parseEther(sellOrders[0].take.value);
    const paymentToken = ZERO_ADDRESS;
    if (!sellOrders[0].data["@type"].includes("V2")) {
      throw new Error("Unsupported sell order type");
    }
    const sellOrderDataType = keccak256(toHex("V2")).slice(0, 10);

    const sellOrderData = this.buildOrderData(
      sellOrders[0].data,
      sellOrders[0].data.isMakeFill
    );
    const buyOrderData = this.buildOrderData(sellOrders[0].data, false);

    return [
      {
        sellOrderMaker,
        sellOrderNftAmount: 1n,
        nftAssetClass,
        nftData,
        sellOrderPaymentAmount,
        paymentToken,
        sellOrderSalt,
        sellOrderStart,
        sellOrderEnd,
        sellOrderDataType,
        sellOrderData,
        sellOrderSignature,
        buyOrderPaymentAmount: sellOrderPaymentAmount,
        buyOrderNftAmount: 1n,
        buyOrderData,
      },
    ];
  }

  private isSaleValid(sellOrders: SellOrder[]): boolean {
    if (sellOrders.length === 0) {
      return false;
    }
    return true;
  }

  private buildOrderData(
    order: {
      payouts: { account: string; value: string }[];
      originFees: { account: string; value: string }[];
    },
    isMakeFill: boolean
  ): string {
    const payouts = order.payouts.map(
      (i: { account: string; value: string }) => {
        return {
          account: this.extractContractAddress(i.account) as `0x{string}`,
          value: BigInt(i.value),
        };
      }
    );

    const originFees = order.originFees.map(
      (i: { account: string; value: string }) => {
        return {
          account: this.extractContractAddress(i.account) as `0x{string}`,
          value: BigInt(i.value),
        };
      }
    );

    return encodeAbiParameters(
      parseAbiParameters([
        "DataV2 data",
        "struct DataV2 { Part[] payouts; Part[] originFees; bool isMakeFill; }",
        "struct Part { address account; uint96 value; }",
      ]),
      [
        {
          payouts,
          originFees,
          isMakeFill,
        },
      ]
    );
  }

  private async fetchSellOrdersByItem(
    contractAddress: string,
    tokenId: string,
    chain: "ETHEREUM" | "POLYGON"
  ): Promise<SellOrder[]> {
    const platform = "RARIBLE";
    const status = "ACTIVE";
    const itemId = `${chain.toUpperCase()}:${contractAddress}:${tokenId}`;

    const url = `https://api.rarible.org/v0.1/orders/sell/byItem?platform=${platform}&itemId=${encodeURIComponent(
      itemId
    )}&status=${status}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-KEY": this.raribleApiKey,
          accept: "application/json",
        },
      });

      if (!response.ok) {
        // If the response is not OK, throw an error with the status
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data: any = await response.json();

      // Check if the response contains any sell orders and return them
      if (data.orders && data.orders.length > 0) {
        return data.orders as SellOrder[];
      } else {
        // If no sell orders are found, return an empty array
        console.log("No active sell orders found for this item on Rarible.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching sell orders from Rarible:", error);
      // In case of an error, return an empty array to maintain the return type
      return [];
    }
  }

  private async fetchNFTData(
    contractAddress: string,
    nftId: bigint,
    chain: "ETHEREUM" | "POLYGON"
  ): Promise<any> {
    // Encode the chain, contract address, and token ID to build the item ID
    const itemId = `${chain.toUpperCase()}%3A${contractAddress}%3A${nftId}`;

    const url = `https://api.rarible.org/v0.1/items/${itemId}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-KEY": this.raribleApiKey,
          accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch NFT data:", error);
    }
  }

  private extractContractAddress(inputString: string): string | undefined {
    // Split the string by the colon ":"
    const parts = inputString.split(":");

    if (parts.length >= 2) {
      return parts[1];
    } else {
      return;
    }
  }

  private async getFees(user: string, price: bigint): Promise<bigint> {
    // https://rarible.com/blog/regressive-fees/
    // 0 fees if staked >= 100 RARI

    const stakingContract = getContract({
      address: this.stakingContractAddress,
      abi: [
        {
          constant: true,
          inputs: [{ name: "account", type: "address" }],
          name: "locked",
          outputs: [{ name: "", type: "uint256" }],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
      ],
      client: createPublicClient({
        chain: mainnet,
        transport: http(),
      }),
    });

    const staked = await stakingContract.read.locked([user as `0x${string}`]);
    if (staked >= 100) {
      return 0n;
    }

    const priceInUSD = await this.convertPriceInUSD(
      this.client.chain?.name.toUpperCase() as "ETHEREUM" | "POLYGON",
      price
    );

    if (priceInUSD >= 4000n) return 50n;
    else if (priceInUSD >= 2000n && priceInUSD < 4000n) return 100n;
    else if (priceInUSD >= 400n && priceInUSD < 2000n) return 250n;
    else if (priceInUSD >= 100n && priceInUSD < 400n) return 500n;
    else return 750n;
  }

  private async convertPriceInUSD(
    asset: "ETHEREUM" | "POLYGON",
    amount: bigint
  ): Promise<number> {
    const nativeInUSD = await this.fetchLatestPrice(asset);
    // amount is 18 decimals
    // nativeInUSD is 8 decimals
    const price = (amount * nativeInUSD) / 10n ** 8n;
    return Promise.resolve(parseFloat(formatEther(price)));
  }

  private async fetchLatestPrice(
    asset: "ETHEREUM" | "POLYGON"
  ): Promise<bigint> {
    // Chainlink Price Feed contract address for ETH/USD on Ethereum Mainnet
    // Replace with the appropriate address for MATIC/USD or other feeds as needed
    const priceFeedAddress =
      asset === "ETHEREUM"
        ? "0x5f4eC3df9cbd43714fe2740f5e3616155c5b8419"
        : "0xab594600376ec9fd91f8e885dadf0ce036862de0";

    // ABI for Chainlink's Price Feed
    // This is the minimal ABI to get the latest price
    const priceFeedABI = [
      {
        constant: true,
        inputs: [],
        name: "latestRoundData",
        outputs: [
          { name: "roundId", type: "uint80" },
          { name: "answer", type: "int256" },
          { name: "startedAt", type: "uint256" },
          { name: "updatedAt", type: "uint256" },
          { name: "answeredInRound", type: "uint80" },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ];

    const priceFeedContract = getContract({
      address: priceFeedAddress,
      abi: priceFeedABI,
      client: this.client,
    });
    const [, answer, , ,] =
      (await priceFeedContract.read.latestRoundData()) as any;

    return Promise.resolve(BigInt(answer));
  }
}
