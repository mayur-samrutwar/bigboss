import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../../abi/ShowContract';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId, showId, voteType } = req.body;

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

    console.log(`Audience voting for agent ${agentId} in show ${showId}...`);
    
    // Get current traits for the agent
    const agentInfo = await contract.getAgentInfo(BigInt(agentId));
    const agentTraits = agentInfo.parameters;
    
    // Calculate trait changes for audience vote
    const newAgentTraits = [...agentTraits];
    
    // Simulate audience sentiment (random but influenced by current popularity)
    const currentPopularity = agentTraits[0];
    const sentimentChance = (currentPopularity / 100) * 0.7 + 0.3; // Higher popularity = better chance
    const isPositiveVote = Math.random() < sentimentChance;
    
    if (isPositiveVote) {
      // Positive audience vote
      newAgentTraits[0] = Math.min(100, newAgentTraits[0] + 15); // Popularity +15
      newAgentTraits[4] = Math.min(100, newAgentTraits[4] + 5); // Charisma +5
      newAgentTraits[5] = Math.max(0, newAgentTraits[5] - 5); // Suspicion -5
    } else {
      // Negative audience vote
      newAgentTraits[0] = Math.max(0, newAgentTraits[0] - 20); // Popularity -20
      newAgentTraits[5] = Math.min(100, newAgentTraits[5] + 10); // Suspicion +10
      newAgentTraits[4] = Math.max(0, newAgentTraits[4] - 3); // Charisma -3
    }
    
    // Update agent parameters
    const tx = await contract.updateAgentParams(BigInt(agentId), newAgentTraits);
    
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`Transaction mined in block: ${receipt.blockNumber}`);

    res.status(200).json({
      success: true,
      message: `Audience voted ${isPositiveVote ? 'positively' : 'negatively'} for agent ${agentId}`,
      voteType: isPositiveVote ? 'positive' : 'negative',
      sentimentChance: sentimentChance,
      transaction: {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      },
      traitChanges: {
        popularity: isPositiveVote ? '+15' : '-20',
        charisma: isPositiveVote ? '+5' : '-3',
        suspicion: isPositiveVote ? '-5' : '+10'
      }
    });

  } catch (error) {
    console.error('Error executing audience_vote action:', error);
    
    let errorMessage = 'Failed to execute audience_vote action';
    
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
