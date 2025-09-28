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
    const [agentIds, participantAddresses] = showParticipants;
    
    console.log(`Found ${agentIds.length} participants in show ${showId}:`, agentIds.map(id => id.toString()));
    
    if (agentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No agents participating in this show'
      });
    }

    // Get traits for all participating agents
    const agentsData = [];
    for (const agentId of agentIds) {
      try {
        const agentInfo = await contract.getAgentInfo(BigInt(agentId));
        
        // ABI returns: [agentId, owner, name, parameters, isActive, isAlive, createdAt, lastUpdated]
        const [agentId_, owner, name, parameters, isActive, isAlive, createdAt, lastUpdated] = agentInfo;
        
        if (!isAlive) continue; // Skip dead agents
        
        // Convert BigInt parameters to numbers
        const traitValues = {
          popularity: Number(parameters[0]) || 50,
          aggression: Number(parameters[1]) || 30,
          loyalty: Number(parameters[2]) || 60,
          resilience: Number(parameters[3]) || 50,
          charisma: Number(parameters[4]) || 40,
          suspicion: Number(parameters[5]) || 20,
          energy: Number(parameters[6]) || 80
        };
        
        // Calculate risk score: (Suspicion + Aggression) - (Popularity + Charisma + Resilience)
        const riskScore = (traitValues.suspicion + traitValues.aggression) - (traitValues.popularity + traitValues.charisma + traitValues.resilience);
        
        agentsData.push({
          agentId: agentId.toString(),
          name: name,
          traits: traitValues,
          riskScore: riskScore
        });
        
        console.log(`Agent ${agentId} (${name}) - Risk Score: ${riskScore}, Traits:`, traitValues);
        
      } catch (error) {
        console.log(`Error getting agent info for ${agentId}:`, error.message);
        continue; // Skip this agent if we can't get its info
      }
    }

    if (agentsData.length === 0) {
      console.log(`No alive agents found in show ${showId}`);
      return res.status(400).json({
        success: false,
        error: 'No alive agents in this show'
      });
    }

    console.log(`Processing ${agentsData.length} alive agents for elimination`);

    // Check if there's only 1 agent left - they are the winner!
    if (agentsData.length === 1) {
      const winner = agentsData[0];
      console.log(`🎉 WINNER FOUND! Agent ${winner.agentId} (${winner.name}) is the last agent standing!`);
      
      // End the show with this agent as the winner
      try {
        const endShowTx = await contract.endShow(BigInt(winner.agentId));
        const endShowReceipt = await endShowTx.wait();
        
        console.log(`Show ended with winner: ${winner.name} (ID: ${winner.agentId})`);
        console.log(`End show transaction: ${endShowTx.hash}`);
        
        return res.status(200).json({
          success: true,
          message: `🎉 SHOW ENDED! Agent ${winner.agentId} (${winner.name}) is the winner!`,
          winner: {
            agentId: winner.agentId,
            name: winner.name,
            traits: winner.traits,
            riskScore: winner.riskScore
          },
          showEnded: true,
          transaction: {
            hash: endShowTx.hash,
            blockNumber: endShowReceipt.blockNumber,
            gasUsed: endShowReceipt.gasUsed.toString()
          }
        });
      } catch (error) {
        console.error('Error ending show:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to end show with winner',
          details: error.message
        });
      }
    }

    // Sort agents by risk score (highest risk first)
    agentsData.sort((a, b) => b.riskScore - a.riskScore);
    
    console.log('Agent risk rankings:', agentsData.map(agent => 
      `${agent.name} (ID: ${agent.agentId}) - Risk: ${agent.riskScore}`
    ));

    // Determine elimination criteria
    const eliminationCandidates = agentsData.slice(0, Math.min(3, agentsData.length)); // Top 3 riskiest
    
    console.log('Elimination candidates:', eliminationCandidates.map(agent => 
      `${agent.name} (Risk: ${agent.riskScore}, Popularity: ${agent.traits.popularity})`
    ));
    
    // Among candidates, eliminate the one with lowest popularity (or highest risk if tied)
    const eliminatedAgent = eliminationCandidates.reduce((lowest, current) => {
      if (current.traits.popularity < lowest.traits.popularity) {
        return current;
      } else if (current.traits.popularity === lowest.traits.popularity) {
        return current.riskScore > lowest.riskScore ? current : lowest;
      }
      return lowest;
    });

    console.log(`Eliminating agent: ${eliminatedAgent.name} (ID: ${eliminatedAgent.agentId})`);
    console.log(`Reason: Risk Score ${eliminatedAgent.riskScore}, Popularity ${eliminatedAgent.traits.popularity}`);

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
