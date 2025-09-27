import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../../lib/contract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentA, agentB, showId } = req.body;

  // Validate input
  if (!agentA || !agentB || !showId) {
    return res.status(400).json({ 
      error: 'Missing required parameters: agentA, agentB, and showId are required' 
    });
  }

  try {
    // Get admin private key from environment
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return res.status(500).json({ 
        error: 'Admin private key not configured' 
      });
    }

    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    const wallet = new ethers.Wallet(adminPrivateKey, provider);
    
    // Create contract instance
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, wallet);

    console.log(`Starting argument between agent ${agentA} and agent ${agentB} in show ${showId}...`);
    
    // Get current traits for both agents
    const agentAInfo = await contract.getAgentInfo(BigInt(agentA));
    const agentBInfo = await contract.getAgentInfo(BigInt(agentB));
    
    const agentATraits = agentAInfo.parameters;
    const agentBTraits = agentBInfo.parameters;
    
    // Simulate argument outcome (random winner)
    const winner = Math.random() < 0.5 ? agentA : agentB;
    const loser = winner === agentA ? agentB : agentA;
    
    // Calculate trait changes
    const newAgentATraits = [...agentATraits];
    const newAgentBTraits = [...agentBTraits];
    
    // Both agents gain aggression
    newAgentATraits[1] = Math.min(100, newAgentATraits[1] + 10); // Aggression +10
    newAgentBTraits[1] = Math.min(100, newAgentBTraits[1] + 10); // Aggression +10
    
    // Both agents gain suspicion
    newAgentATraits[5] = Math.min(100, newAgentATraits[5] + 5); // Suspicion +5
    newAgentBTraits[5] = Math.min(100, newAgentBTraits[5] + 5); // Suspicion +5
    
    // Loser loses popularity
    if (loser === agentA) {
      newAgentATraits[0] = Math.max(0, newAgentATraits[0] - 15); // Popularity -15
    } else {
      newAgentBTraits[0] = Math.max(0, newAgentBTraits[0] - 15); // Popularity -15
    }
    
    // Winner gains slight popularity
    if (winner === agentA) {
      newAgentATraits[0] = Math.min(100, newAgentATraits[0] + 5); // Popularity +5
    } else {
      newAgentBTraits[0] = Math.min(100, newAgentBTraits[0] + 5); // Popularity +5
    }
    
    // Both lose energy
    newAgentATraits[6] = Math.max(0, newAgentATraits[6] - 10); // Energy -10
    newAgentBTraits[6] = Math.max(0, newAgentBTraits[6] - 10); // Energy -10
    
    // Update agent parameters
    const txA = await contract.updateAgentParams(BigInt(agentA), newAgentATraits);
    const txB = await contract.updateAgentParams(BigInt(agentB), newAgentBTraits);
    
    console.log(`Transaction A sent: ${txA.hash}`);
    console.log(`Transaction B sent: ${txB.hash}`);
    
    // Wait for transactions to be mined
    const receiptA = await txA.wait();
    const receiptB = await txB.wait();
    
    console.log(`Transaction A mined in block: ${receiptA.blockNumber}`);
    console.log(`Transaction B mined in block: ${receiptB.blockNumber}`);

    res.status(200).json({
      success: true,
      message: `Argument between agent ${agentA} and agent ${agentB} completed`,
      winner: winner,
      loser: loser,
      transactions: {
        agentA: {
          hash: txA.hash,
          blockNumber: receiptA.blockNumber,
          gasUsed: receiptA.gasUsed.toString()
        },
        agentB: {
          hash: txB.hash,
          blockNumber: receiptB.blockNumber,
          gasUsed: receiptB.gasUsed.toString()
        }
      },
      traitChanges: {
        agentA: {
          aggression: '+10',
          suspicion: '+5',
          popularity: winner === agentA ? '+5' : '-15',
          energy: '-10'
        },
        agentB: {
          aggression: '+10',
          suspicion: '+5',
          popularity: winner === agentB ? '+5' : '-15',
          energy: '-10'
        }
      }
    });

  } catch (error) {
    console.error('Error executing argue action:', error);
    
    let errorMessage = 'Failed to execute argue action';
    
    if (error.message.includes('Agent not participating')) {
      errorMessage = 'One or both agents are not participating in this show';
    } else if (error.message.includes('Agent not active')) {
      errorMessage = 'One or both agents are not active';
    } else if (error.message.includes('Agent not alive')) {
      errorMessage = 'One or both agents are dead';
    } else if (error.message.includes('Show not active')) {
      errorMessage = 'Show is not active';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
}
