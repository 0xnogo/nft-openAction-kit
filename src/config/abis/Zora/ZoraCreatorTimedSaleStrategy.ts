export const ZoraCreatorTimedSaleStrategyABI = [
  {
    inputs: [],
    name: "UPGRADE_INTERFACE_VERSION",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "collection", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "address", name: "erc20zAddress", type: "address" },
    ],
    name: "calculateERC20zActivate",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "finalTotalERC20ZSupply",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "erc20Reserve",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "erc20Liquidity",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "excessERC20",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "excessERC1155",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "additionalERC1155ToMint",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "final1155Supply",
            type: "uint256",
          },
        ],
        internalType: "struct IZoraTimedSaleStrategy.ERC20zActivate",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "quantity", type: "uint256" }],
    name: "computeRewards",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "totalReward",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "creatorReward",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "createReferralReward",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "mintReferralReward",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "marketReward",
            type: "uint256",
          },
          { internalType: "uint256", name: "zoraReward", type: "uint256" },
        ],
        internalType: "struct IZoraTimedSaleStrategy.RewardsSettings",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "contractName",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "contractURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "contractVersion",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "erc20zImpl",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "collection", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "getCreateReferral",
    outputs: [
      { internalType: "address", name: "createReferral", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_defaultOwner", type: "address" },
      {
        internalType: "address",
        name: "_zoraRewardRecipient",
        type: "address",
      },
      { internalType: "address", name: "_erc20zImpl", type: "address" },
      {
        internalType: "contract IProtocolRewards",
        name: "_protocolRewards",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "collection", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "launchMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "mintTo", type: "address" },
      { internalType: "uint256", name: "quantity", type: "uint256" },
      { internalType: "address", name: "collection", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "address", name: "mintReferral", type: "address" },
      { internalType: "string", name: "comment", type: "string" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pendingOwner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "protocolRewards",
    outputs: [
      {
        internalType: "contract IProtocolRewards",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proxiableUUID",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "requestMint",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "enum ICreatorCommands.CreatorActions",
                name: "method",
                type: "uint8",
              },
              { internalType: "bytes", name: "args", type: "bytes" },
            ],
            internalType: "struct ICreatorCommands.Command[]",
            name: "commands",
            type: "tuple[]",
          },
          { internalType: "uint256", name: "at", type: "uint256" },
        ],
        internalType: "struct ICreatorCommands.CommandSet",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "collection", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "sale",
    outputs: [
      {
        components: [
          {
            internalType: "address payable",
            name: "erc20zAddress",
            type: "address",
          },
          { internalType: "uint64", name: "saleStart", type: "uint64" },
          {
            internalType: "address",
            name: "poolAddress",
            type: "address",
          },
          { internalType: "uint64", name: "saleEnd", type: "uint64" },
          {
            internalType: "bool",
            name: "secondaryActivated",
            type: "bool",
          },
        ],
        internalType: "struct IZoraTimedSaleStrategy.SaleStorage",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      {
        components: [
          { internalType: "uint64", name: "saleStart", type: "uint64" },
          { internalType: "uint64", name: "saleEnd", type: "uint64" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "string", name: "symbol", type: "string" },
        ],
        internalType: "struct IZoraTimedSaleStrategy.SalesConfig",
        name: "salesConfig",
        type: "tuple",
      },
    ],
    name: "setSale",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "recipient", type: "address" }],
    name: "setZoraRewardRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "int256", name: "amount0Delta", type: "int256" },
      { internalType: "int256", name: "amount1Delta", type: "int256" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "uniswapV3SwapCallback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint64", name: "newStartTime", type: "uint64" },
      { internalType: "uint64", name: "newEndTime", type: "uint64" },
    ],
    name: "updateSale",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;
