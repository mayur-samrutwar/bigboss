const SHOW_CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "beginShow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentShowId",
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
    "inputs": [],
    "name": "endShow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_agentId",
        "type": "uint256"
      }
    ],
    "name": "getAgentInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256[7]",
        "name": "traits",
        "type": "uint256[7]"
      },
      {
        "internalType": "bool",
        "name": "isAlive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "showId",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_showId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_agentId",
        "type": "uint256"
      }
    ],
    "name": "getAgentVoteCount",
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
        "internalType": "uint256",
        "name": "_showId",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "_agentIds",
        "type": "uint256[]"
      }
    ],
    "name": "getAgentVoteCounts",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentShow",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "showId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "entryFee",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalPrize",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "participantCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNextShow",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "showId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "entryFee",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalPrize",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "participantCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNextShowParticipants",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "agentIds",
        "type": "uint256[]"
      },
      {
        "internalType": "address[]",
        "name": "participantAddresses",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_showId",
        "type": "uint256"
      }
    ],
    "name": "getShowParticipants",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "agentIds",
        "type": "uint256[]"
      },
      {
        "internalType": "address[]",
        "name": "participantAddresses",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextShowId",
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
        "internalType": "uint256",
        "name": "_agentId",
        "type": "uint256"
      }
    ],
    "name": "participateInNextShow",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_showId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_agentId",
        "type": "uint256"
      }
    ],
    "name": "participateInShow",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      }
    ],
    "name": "registerAgent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startShow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_showId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_agentId",
        "type": "uint256"
      }
    ],
    "name": "voteForAgent",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

module.exports = { SHOW_CONTRACT_ABI };