import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../../abi/ShowContract';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gossiperAgent, targetAgent, showId } = req.body;

  // Validate input
  if (!gossiperAgent || !targetAgent || !showId) {
    return res.status(400).json({ 
      error: 'Missing required parameters: gossiperAgent, targetAgent, and showId are required' 
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

    console.log(`Agent ${gossiperAgent} gossiping about agent ${targetAgent} in show ${showId}...`);
    
    // Get current traits for both agents
    const gossiperInfo = await contract.getAgentInfo(BigInt(gossiperAgent));
    const targetInfo = await contract.getAgentInfo(BigInt(targetAgent));
    
    const gossiperTraits = gossiperInfo.parameters;
    const targetTraits = targetInfo.parameters;
    
    // Calculate trait changes for gossip
    const newGossiperTraits = [...gossiperTraits];
    const newTargetTraits = [...targetTraits];
    
    // Gossiper gains charisma
    newGossiperTraits[4] = Math.min(100, newGossiperTraits[4] + 8); // Charisma +8
    
    // Gossiper gains slight popularity
    newGossiperTraits[0] = Math.min(100, newGossiperTraits[0] + 5); // Popularity +5
    
    // Gossiper loses loyalty slightly
    newGossiperTraits[2] = Math.max(0, newGossiperTraits[2] - 3); // Loyalty -3
    
    // Target gains suspicion
    newTargetTraits[5] = Math.min(100, newTargetTraits[5] + 12); // Suspicion +12
    
    // Target loses popularity
    newTargetTraits[0] = Math.max(0, newTargetTraits[0] - 8); // Popularity -8
    
    // Both lose energy
    newGossiperTraits[6] = Math.max(0, newGossiperTraits[6] - 8); // Energy -8
    newTargetTraits[6] = Math.max(0, newTargetTraits[6] - 5); // Energy -5
    
    // Update agent parameters
    const txGossiper = await contract.updateAgentParams(BigInt(gossiperAgent), newGossiperTraits);
    const txTarget = await contract.updateAgentParams(BigInt(targetAgent), newTargetTraits);
    
    console.log(`Gossiper transaction sent: ${txGossiper.hash}`);
    console.log(`Target transaction sent: ${txTarget.hash}`);
    
    // Wait for transactions to be mined
    const receiptGossiper = await txGossiper.wait();
    const receiptTarget = await txTarget.wait();
    
    console.log(`Gossiper transaction mined in block: ${receiptGossiper.blockNumber}`);
    console.log(`Target transaction mined in block: ${receiptTarget.blockNumber}`);

    res.status(200).json({
      success: true,
      message: `Agent ${gossiperAgent} gossiped about agent ${targetAgent}`,
      transactions: {
        gossiper: {
          hash: txGossiper.hash,
          blockNumber: receiptGossiper.blockNumber,
          gasUsed: receiptGossiper.gasUsed.toString()
        },
        target: {
          hash: txTarget.hash,
          blockNumber: receiptTarget.blockNumber,
          gasUsed: receiptTarget.gasUsed.toString()
        }
      },
      traitChanges: {
        gossiper: {
          charisma: '+8',
          popularity: '+5',
          loyalty: '-3',
          energy: '-8'
        },
        target: {
          suspicion: '+12',
          popularity: '-8',
          energy: '-5'
        }
      }
    });

  } catch (error) {
    console.error('Error executing gossip action:', error);
    
    let errorMessage = 'Failed to execute gossip action';
    
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
