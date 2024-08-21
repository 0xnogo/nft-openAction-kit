export const ZoraCreatorFixedPriceSaleStrategyABI = [
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
    inputs: [
      { internalType: "address", name: "tokenContract", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "address", name: "wallet", type: "address" },
    ],
    name: "getMintedPerWallet",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint256", name: "quantity", type: "uint256" },
      { internalType: "uint256", name: "ethValueSent", type: "uint256" },
      { internalType: "bytes", name: "minterArguments", type: "bytes" },
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
        name: "commands",
        type: "tuple",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "resetSale",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenContract", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "sale",
    outputs: [
      {
        components: [
          { internalType: "uint64", name: "saleStart", type: "uint64" },
          { internalType: "uint64", name: "saleEnd", type: "uint64" },
          {
            internalType: "uint64",
            name: "maxTokensPerAddress",
            type: "uint64",
          },
          {
            internalType: "uint96",
            name: "pricePerToken",
            type: "uint96",
          },
          {
            internalType: "address",
            name: "fundsRecipient",
            type: "address",
          },
        ],
        internalType: "struct ZoraCreatorFixedPriceSaleStrategy.SalesConfig",
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
          {
            internalType: "uint64",
            name: "maxTokensPerAddress",
            type: "uint64",
          },
          {
            internalType: "uint96",
            name: "pricePerToken",
            type: "uint96",
          },
          {
            internalType: "address",
            name: "fundsRecipient",
            type: "address",
          },
        ],
        internalType: "struct ZoraCreatorFixedPriceSaleStrategy.SalesConfig",
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
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "pure",
    type: "function",
  },
] as const;
