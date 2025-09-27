import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../../lib/contract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId, showId, eventType } = req.body;

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

    console.log(`Random event occurring for agent ${agentId} in show ${showId}...`);
    
    // Get current traits for the agent
    const agentInfo = await contract.getAgentInfo(BigInt(agentId));
    const agentTraits = agentInfo.parameters;
    
    // Define possible events
    const events = [
      {
        name: 'Food Shortage',
        description: 'Agent struggles with limited resources',
        changes: { energy: -20, resilience: -5, popularity: -5 }
      },
      {
        name: 'Secret Advantage',
        description: 'Agent discovers a hidden advantage',
        changes: { energy: +15, charisma: +8, popularity: +10 }
      },
      {
        name: 'Task Failure',
        description: 'Agent fails at a crucial task',
        changes: { popularity: -15, resilience: -8, suspicion: +10 }
      },
      {
        name: 'Unexpected Support',
        description: 'Agent receives unexpected help',
        changes: { popularity: +12, loyalty: +5, charisma: +3 }
      },
      {
        name: 'Backstab Attempt',
        description: 'Someone tries to backstab the agent',
        changes: { suspicion: +15, resilience: -5, energy: -10 }
      },
      {
        name: 'Moment of Glory',
        description: 'Agent has a breakthrough moment',
        changes: { popularity: +20, charisma: +10, energy: +5 }
      }
    ];
    
    // Select random event
    const selectedEvent = events[Math.floor(Math.random() * events.length)];
    
    // Calculate trait changes
    const newAgentTraits = [...agentTraits];
    
    // Apply event changes
    Object.keys(selectedEvent.changes).forEach((trait, index) => {
      const traitIndex = ['popularity', 'aggression', 'loyalty', 'resilience', 'charisma', 'suspicion', 'energy'].indexOf(trait);
      if (traitIndex !== -1) {
        const change = selectedEvent.changes[trait];
        if (change > 0) {
          newAgentTraits[traitIndex] = Math.min(100, newAgentTraits[traitIndex] + change);
        } else {
          newAgentTraits[traitIndex] = Math.max(0, newAgentTraits[traitIndex] + change);
        }
      }
    });
    
    // Update agent parameters
    const tx = await contract.updateAgentParams(BigInt(agentId), newAgentTraits);
    
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`Transaction mined in block: ${receipt.blockNumber}`);

    res.status(200).json({
      success: true,
      message: `Random event "${selectedEvent.name}" occurred for agent ${agentId}`,
      event: {
        name: selectedEvent.name,
        description: selectedEvent.description,
        changes: selectedEvent.changes
      },
      transaction: {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      },
      traitChanges: selectedEvent.changes
    });

  } catch (error) {
    console.error('Error executing random_event action:', error);
    
    let errorMessage = 'Failed to execute random_event action';
    
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
