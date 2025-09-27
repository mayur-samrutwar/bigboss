import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../../abi/ShowContract';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId, showId, taskType } = req.body;

  // Validate input
  if (!agentId || !showId) {
    return res.status(400).json({ 
      error: 'Missing required parameters: agentId and showId are required' 
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

    console.log(`Agent ${agentId} performing task in show ${showId}...`);
    
    // Get current traits for the agent
    const agentInfo = await contract.getAgentInfo(BigInt(agentId));
    const agentTraits = agentInfo.parameters;
    
    // Calculate trait changes for task performance
    const newAgentTraits = [...agentTraits];
    
    // Determine task success based on agent's traits and randomness
    const successChance = (agentTraits[4] + agentTraits[3]) / 200; // Charisma + Resilience
    const isSuccessful = Math.random() < successChance;
    
    // Always lose energy
    newAgentTraits[6] = Math.max(0, newAgentTraits[6] - 15); // Energy -15
    
    if (isSuccessful) {
      // Successful task performance
      newAgentTraits[0] = Math.min(100, newAgentTraits[0] + 12); // Popularity +12
      newAgentTraits[3] = Math.min(100, newAgentTraits[3] + 5); // Resilience +5
      newAgentTraits[4] = Math.min(100, newAgentTraits[4] + 3); // Charisma +3
    } else {
      // Failed task performance
      newAgentTraits[0] = Math.max(0, newAgentTraits[0] - 8); // Popularity -8
      newAgentTraits[3] = Math.max(0, newAgentTraits[3] - 3); // Resilience -3
      newAgentTraits[5] = Math.min(100, newAgentTraits[5] + 5); // Suspicion +5
    }
    
    // Update agent parameters
    const tx = await contract.updateAgentParams(BigInt(agentId), newAgentTraits);
    
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`Transaction mined in block: ${receipt.blockNumber}`);

    res.status(200).json({
      success: true,
      message: `Agent ${agentId} performed task ${isSuccessful ? 'successfully' : 'unsuccessfully'}`,
      taskSuccess: isSuccessful,
      successChance: successChance,
      transaction: {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      },
      traitChanges: {
        energy: '-15',
        popularity: isSuccessful ? '+12' : '-8',
        resilience: isSuccessful ? '+5' : '-3',
        charisma: isSuccessful ? '+3' : '0',
        suspicion: isSuccessful ? '0' : '+5'
      }
    });

  } catch (error) {
    console.error('Error executing perform_task action:', error);
    
    let errorMessage = 'Failed to execute perform_task action';
    
    if (error.message.includes('Agent not participating')) {
      errorMessage = 'Agent is not participating in this show';
    } else if (error.message.includes('Agent not active')) {
      errorMessage = 'Agent is not active';
    } else if (error.message.includes('Agent not alive')) {
      errorMessage = 'Agent is dead';
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
