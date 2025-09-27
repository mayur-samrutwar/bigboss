#!/usr/bin/env node

/**
 * Agent Registration Script
 * 
 * This script registers test agents with initial traits for testing the API system
 */

import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from './lib/contract.js';

// Contract configuration
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || 'f2f187ccd082d3ef031da2d29ef8bc1cf30b4142da1f26191f612ffba0dea9b6';
const RPC_URL = 'https://testnet.evm.nodes.onflow.org';

// Contract ABI (minimal for registration)
const REGISTER_AGENT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "uint256[]",
        "name": "_parameters",
        "type": "uint256[]"
      }
    ],
    "name": "registerAgent",
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
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256[]",
        "name": "parameters",
        "type": "uint256[]"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isAlive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastUpdated",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Test agents with different personality types
const testAgents = [
  {
    name: "Rajesh",
    traits: [75, 40, 60, 70, 80, 20, 90], // High popularity, charisma, energy
    description: "Popular and charismatic leader"
  },
  {
    name: "Priya", 
    traits: [60, 70, 80, 60, 50, 30, 85], // High loyalty, aggression
    description: "Loyal but aggressive fighter"
  },
  {
    name: "Vikram",
    traits: [50, 60, 50, 80, 60, 40, 75], // High resilience, balanced
    description: "Resilient survivor"
  },
  {
    name: "Anita",
    traits: [80, 30, 70, 50, 90, 15, 80], // High popularity, charisma, low suspicion
    description: "Charismatic crowd favorite"
  },
  {
    name: "Suresh",
    traits: [40, 80, 40, 60, 40, 60, 70], // High aggression, suspicion
    description: "Aggressive troublemaker"
  }
];

async function registerAgents() {
  try {
    console.log('🎭 Registering test agents for Big Boss show...\n');

    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, REGISTER_AGENT_ABI, wallet);

    console.log(`📡 Connected to contract: ${SHOW_CONTRACT_ADDRESS}`);
    console.log(`👤 Using wallet: ${wallet.address}\n`);

    const registeredAgents = [];

    for (let i = 0; i < testAgents.length; i++) {
      const agent = testAgents[i];
      
      console.log(`📝 Registering agent ${i + 1}: ${agent.name}`);
      console.log(`   Traits: [Popularity:${agent.traits[0]}, Aggression:${agent.traits[1]}, Loyalty:${agent.traits[2]}, Resilience:${agent.traits[3]}, Charisma:${agent.traits[4]}, Suspicion:${agent.traits[5]}, Energy:${agent.traits[6]}]`);
      
      try {
        // Register agent
        const tx = await contract.registerAgent(agent.name, agent.traits);
        console.log(`   ⏳ Transaction sent: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`   ✅ Agent registered in block: ${receipt.blockNumber}`);
        
        // Get agent ID from events
        const events = receipt.logs.map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        }).filter(Boolean);

        const agentRegisteredEvent = events.find(event => event.name === 'AgentRegistered');
        if (agentRegisteredEvent) {
          const agentId = agentRegisteredEvent.args.agentId.toString();
          registeredAgents.push({
            id: agentId,
            name: agent.name,
            traits: agent.traits,
            description: agent.description
          });
          console.log(`   🆔 Agent ID: ${agentId}\n`);
        } else {
          console.log(`   ⚠️  Could not find agent ID in events\n`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error registering ${agent.name}: ${error.message}\n`);
      }
    }

    console.log('🎉 Agent registration complete!\n');
    console.log('📊 Registered Agents Summary:');
    console.log('============================');
    
    registeredAgents.forEach(agent => {
      const riskScore = (agent.traits[5] + agent.traits[1]) - (agent.traits[0] + agent.traits[4] + agent.traits[3]);
      console.log(`Agent ${agent.id}: ${agent.name}`);
      console.log(`  Risk Score: ${riskScore}`);
      console.log(`  Description: ${agent.description}`);
      console.log('');
    });

    console.log('🚀 You can now test the APIs with these agents!');
    console.log('Example: curl -X GET "http://localhost:3000/api/traits/getAgentTraits?agentId=1"');

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  registerAgents();
}

export { registerAgents, testAgents };
