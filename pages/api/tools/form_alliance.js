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

    console.log(`Forming alliance between agent ${agentA} and agent ${agentB} in show ${showId}...`);
    
    // Get current traits for both agents
    const agentAInfo = await contract.getAgentInfo(BigInt(agentA));
    const agentBInfo = await contract.getAgentInfo(BigInt(agentB));
    
    const agentATraits = agentAInfo.parameters;
    const agentBTraits = agentBInfo.parameters;
    
    // Calculate trait changes for alliance formation
    const newAgentATraits = [...agentATraits];
    const newAgentBTraits = [...agentBTraits];
    
    // Both agents gain loyalty
    newAgentATraits[2] = Math.min(100, newAgentATraits[2] + 15); // Loyalty +15
    newAgentBTraits[2] = Math.min(100, newAgentBTraits[2] + 15); // Loyalty +15
    
    // Both agents gain slight popularity
    newAgentATraits[0] = Math.min(100, newAgentATraits[0] + 8); // Popularity +8
    newAgentBTraits[0] = Math.min(100, newAgentBTraits[0] + 8); // Popularity +8
    
    // Both agents gain charisma
    newAgentATraits[4] = Math.min(100, newAgentATraits[4] + 5); // Charisma +5
    newAgentBTraits[4] = Math.min(100, newAgentBTraits[4] + 5); // Charisma +5
    
    // Both agents lose slight suspicion
    newAgentATraits[5] = Math.max(0, newAgentATraits[5] - 5); // Suspicion -5
    newAgentBTraits[5] = Math.max(0, newAgentBTraits[5] - 5); // Suspicion -5
    
    // Both lose some energy
    newAgentATraits[6] = Math.max(0, newAgentATraits[6] - 5); // Energy -5
    newAgentBTraits[6] = Math.max(0, newAgentBTraits[6] - 5); // Energy -5
    
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
      message: `Alliance formed between agent ${agentA} and agent ${agentB}`,
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
          loyalty: '+15',
          popularity: '+8',
          charisma: '+5',
          suspicion: '-5',
          energy: '-5'
        },
        agentB: {
          loyalty: '+15',
          popularity: '+8',
          charisma: '+5',
          suspicion: '-5',
          energy: '-5'
        }
      }
    });

  } catch (error) {
    console.error('Error executing form_alliance action:', error);
    
    let errorMessage = 'Failed to execute form_alliance action';
    
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
