export const ZoraERC20MinterABI = [
  {
    "inputs": [],
    "name": "AddressZero",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyInitialized",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC20TransferSlippage",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidCurrency",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OnlyZoraRewardsRecipient",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PricePerTokenTooLow",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "RequestMintInvalidUseMint",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SaleEnded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SaleHasNotStarted",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "requestedAmount",
        "type": "uint256"
      }
    ],
    "name": "UserExceedsMintLimit",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WrongValueSent",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardPercentage",
        "type": "uint256"
      }
    ],
    "name": "ERC20MinterInitialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "createReferral",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "mintReferral",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "firstMinter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "zora",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "collection",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "currency",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "createReferralReward",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "mintReferralReward",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "firstMinterReward",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "zoraReward",
        "type": "uint256"
      }
    ],
    "name": "ERC20RewardsDeposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "tokenContract",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "comment",
        "type": "string"
      }
    ],
    "name": "MintComment",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "mediaContract",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "saleStart",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "saleEnd",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "maxTokensPerAddress",
            "type": "uint64"
          },
          {
            "internalType": "uint256",
            "name": "pricePerToken",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "fundsRecipient",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "currency",
            "type": "address"
          }
        ],
        "indexed": false,
        "internalType": "struct IERC20Minter.SalesConfig",
        "name": "salesConfig",
        "type": "tuple"
      }
    ],
    "name": "SaleSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "prevRecipient",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newRecipient",
        "type": "address"
      }
    ],
    "name": "ZoraRewardsRecipientSet",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "totalReward",
        "type": "uint256"
      }
    ],
    "name": "computePaidMintRewards",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "createReferralReward",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "mintReferralReward",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "zoraReward",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "firstMinterReward",
            "type": "uint256"
          }
        ],
        "internalType": "struct IERC20Minter.RewardsSettings",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "totalReward",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rewardPct",
        "type": "uint256"
      }
    ],
    "name": "computeReward",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "totalValue",
        "type": "uint256"
      }
    ],
    "name": "computeTotalReward",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "contractName",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "contractURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "contractVersion",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenContract",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getCreateReferral",
    "outputs": [
      {
        "internalType": "address",
        "name": "createReferral",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenContract",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getFirstMinter",
    "outputs": [
      {
        "internalType": "address",
        "name": "firstMinter",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenContract",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      }
    ],
    "name": "getMintedPerWallet",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_zoraRewardRecipientAddress",
        "type": "address"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "mintTo",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalValue",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "currency",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "mintReferral",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "comment",
        "type": "string"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "requestMint",
    "outputs": [
      {
        "components": [
          {
            "components": [
              {
                "internalType": "enum ICreatorCommands.CreatorActions",
                "name": "method",
                "type": "uint8"
              },
              {
                "internalType": "bytes",
                "name": "args",
                "type": "bytes"
              }
            ],
            "internalType": "struct ICreatorCommands.Command[]",
            "name": "commands",
            "type": "tuple[]"
          },
          {
            "internalType": "uint256",
            "name": "at",
            "type": "uint256"
          }
        ],
        "internalType": "struct ICreatorCommands.CommandSet",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "resetSale",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenContract",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "sale",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "saleStart",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "saleEnd",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "maxTokensPerAddress",
            "type": "uint64"
          },
          {
            "internalType": "uint256",
            "name": "pricePerToken",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "fundsRecipient",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "currency",
            "type": "address"
          }
        ],
        "internalType": "struct IERC20Minter.SalesConfig",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "saleStart",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "saleEnd",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "maxTokensPerAddress",
            "type": "uint64"
          },
          {
            "internalType": "uint256",
            "name": "pricePerToken",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "fundsRecipient",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "currency",
            "type": "address"
          }
        ],
        "internalType": "struct IERC20Minter.SalesConfig",
        "name": "salesConfig",
        "type": "tuple"
      }
    ],
    "name": "setSale",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "setZoraRewardsRecipient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalRewardPct",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "zoraRewardRecipientAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
