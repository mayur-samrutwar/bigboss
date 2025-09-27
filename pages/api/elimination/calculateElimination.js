import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../../lib/contract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { showId } = req.body;

  // Validate input
  if (!showId) {
    return res.status(400).json({ 
      error: 'Missing required parameter: showId is required' 
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

    console.log(`Calculating elimination for show ${showId}...`);
    
    // Get show participants
    const showParticipants = await contract.getShowParticipants(BigInt(showId));
    const agentIds = showParticipants.agentIds;
    
    if (agentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No agents participating in this show'
      });
    }

    // Get traits for all participating agents
    const agentsData = [];
    for (const agentId of agentIds) {
      const agentInfo = await contract.getAgentInfo(agentId);
      
      if (!agentInfo.isAlive) continue; // Skip dead agents
      
      const traits = {
        popularity: agentInfo.parameters[0] || 50,
        aggression: agentInfo.parameters[1] || 30,
        loyalty: agentInfo.parameters[2] || 60,
        resilience: agentInfo.parameters[3] || 50,
        charisma: agentInfo.parameters[4] || 40,
        suspicion: agentInfo.parameters[5] || 20,
        energy: agentInfo.parameters[6] || 80
      };
      
      // Calculate risk score: (Suspicion + Aggression) - (Popularity + Charisma + Resilience)
      const riskScore = (traits.suspicion + traits.aggression) - (traits.popularity + traits.charisma + traits.resilience);
      
      agentsData.push({
        agentId: agentId.toString(),
        name: agentInfo.name,
        traits: traits,
        riskScore: riskScore
      });
    }

    if (agentsData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No alive agents in this show'
      });
    }

    // Sort agents by risk score (highest risk first)
    agentsData.sort((a, b) => b.riskScore - a.riskScore);

    // Determine elimination criteria
    const eliminationCandidates = agentsData.slice(0, Math.min(3, agentsData.length)); // Top 3 riskiest
    
    // Among candidates, eliminate the one with lowest popularity (or highest risk if tied)
    const eliminatedAgent = eliminationCandidates.reduce((lowest, current) => {
      if (current.traits.popularity < lowest.traits.popularity) {
        return current;
      } else if (current.traits.popularity === lowest.traits.popularity) {
        return current.riskScore > lowest.riskScore ? current : lowest;
      }
      return lowest;
    });

    // Kill the agent
    const tx = await contract.killAgent(BigInt(showId), BigInt(eliminatedAgent.agentId));
    
    console.log(`Elimination transaction sent: ${tx.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`Elimination transaction mined in block: ${receipt.blockNumber}`);

    res.status(200).json({
      success: true,
      message: `Agent ${eliminatedAgent.agentId} (${eliminatedAgent.name}) has been eliminated`,
      eliminatedAgent: {
        agentId: eliminatedAgent.agentId,
        name: eliminatedAgent.name,
        traits: eliminatedAgent.traits,
        riskScore: eliminatedAgent.riskScore
      },
      eliminationReason: `Lowest popularity (${eliminatedAgent.traits.popularity}) among high-risk candidates`,
      transaction: {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      },
      remainingAgents: agentsData.filter(agent => agent.agentId !== eliminatedAgent.agentId).map(agent => ({
        agentId: agent.agentId,
        name: agent.name,
        riskScore: agent.riskScore,
        popularity: agent.traits.popularity
      })),
      riskRankings: agentsData.map((agent, index) => ({
        rank: index + 1,
        agentId: agent.agentId,
        name: agent.name,
        riskScore: agent.riskScore,
        popularity: agent.traits.popularity
      }))
    });

  } catch (error) {
    console.error('Error executing elimination:', error);
    
    let errorMessage = 'Failed to execute elimination';
    
    if (error.message.includes('Agent not participating')) {
      errorMessage = 'Agent is not participating in this show';
    } else if (error.message.includes('Agent not active')) {
      errorMessage = 'Agent is not active';
    } else if (error.message.includes('Agent not alive')) {
      errorMessage = 'Agent is already dead';
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
