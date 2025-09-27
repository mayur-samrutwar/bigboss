import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../lib/contract.js';

// Helper function to get real show data from contract
async function getRealShowData(showId) {
  try {
    // Set up provider
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, provider);

    console.log(`Fetching real show data for show ${showId}...`);
    
    // Get show participants
    const showParticipants = await contract.getShowParticipants(BigInt(showId));
    const [agentIds, participantAddresses] = showParticipants;
    
    if (agentIds.length === 0) {
      return {
        success: false,
        error: 'No agents participating in this show',
        agents: [],
        aliveCount: 0,
        totalCount: 0
      };
    }

    // Get traits for all participating agents
    const agentsData = [];
    for (const agentId of agentIds) {
      const agentInfo = await contract.getAgentInfo(BigInt(agentId));
      
      if (!Boolean(agentInfo[5])) continue; // Skip dead agents (isAlive is at index 5)
      
      const parameters = agentInfo[3]; // parameters is at index 3
      const traits = {
        popularity: Number(parameters[0]) || 50,
        aggression: Number(parameters[1]) || 30,
        loyalty: Number(parameters[2]) || 60,
        resilience: Number(parameters[3]) || 50,
        charisma: Number(parameters[4]) || 40,
        suspicion: Number(parameters[5]) || 20,
        energy: Number(parameters[6]) || 80
      };
      
      // Calculate risk score: (Suspicion + Aggression) - (Popularity + Charisma + Resilience)
      const riskScore = (traits.suspicion + traits.aggression) - (traits.popularity + traits.charisma + traits.resilience);
      
      agentsData.push({
        agentId: agentId.toString(),
        name: agentInfo[2], // name is at index 2
        isAlive: Boolean(agentInfo[5]), // isAlive is at index 5
        traits: traits,
        riskScore: riskScore
      });
    }

    return {
      success: true,
      showId: showId,
      agents: agentsData,
      aliveCount: agentsData.length,
      totalCount: agentIds.length
    };

  } catch (error) {
    console.error('Error fetching real show data:', error);
    return {
      success: false,
      error: error.message,
      agents: [],
      aliveCount: 0,
      totalCount: 0
    };
  }
}

// Helper function to get AI decision using real data
async function getRealAIDecision(showId) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Call the AI decision API with real contract data
    const aiResponse = await fetch(`${baseUrl}/api/ai/getDecision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        showId: showId,
        context: 'general'
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI service responded with status: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    if (!aiData.success) {
      throw new Error(aiData.error || 'AI decision failed');
    }

    return aiData;

  } catch (error) {
    console.error('Error getting AI decision:', error);
    throw error;
  }
}

// Helper function to execute AI action using real data
async function executeRealAIAction(showId, aiDecision) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Call the execute action API
    const executeResponse = await fetch(`${baseUrl}/api/executeAction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: aiDecision.action,
        parameters: aiDecision.parameters,
        showId: showId
      })
    });

    if (!executeResponse.ok) {
      throw new Error(`Execute action responded with status: ${executeResponse.status}`);
    }

    const executeData = await executeResponse.json();
    
    if (!executeData.success) {
      throw new Error(executeData.error || 'Action execution failed');
    }

    return executeData;

  } catch (error) {
    console.error('Error executing AI action:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { showId, action } = req.body;

  // Validate input
  if (!showId || !action) {
    return res.status(400).json({ 
      error: 'Missing required parameters: showId and action are required' 
    });
  }

  try {
    console.log(`Managing show ${showId} with action: ${action}...`);

    let result;

    switch (action) {
      case 'get_ai_decision':
        // Get real AI decision - no fallback to mock data
        result = await getRealAIDecision(showId);
        break;

      case 'execute_ai_action':
        // Get AI decision first
        const aiDecision = await getRealAIDecision(showId);
        
        // Execute the action
        const executeResult = await executeRealAIAction(showId, aiDecision.aiDecision);
        
        result = {
          success: true,
          message: 'AI action executed successfully',
          action: aiDecision.aiDecision.action,
          parameters: aiDecision.aiDecision.parameters,
          toolResult: executeResult,
          aiDecision: aiDecision.aiDecision
        };
        break;

      case 'check_elimination':
        // Get real show data
        const eliminationShowData = await getRealShowData(showId);
        
        if (!eliminationShowData.success) {
          result = {
            success: false,
            message: eliminationShowData.error
          };
        } else {
          // Check if elimination is needed (simplified logic)
          const shouldEliminate = eliminationShowData.aliveCount > 2; // Eliminate if more than 2 players
          
          result = {
            success: shouldEliminate,
            message: shouldEliminate ? 'Elimination needed' : 'Not time for elimination yet',
            showData: eliminationShowData
          };
        }
        break;

      case 'get_show_status':
        // Get real show data
        result = await getRealShowData(showId);
        break;

      default:
        return res.status(400).json({ 
          error: `Unknown action: ${action}`,
          validActions: ['get_ai_decision', 'execute_ai_action', 'check_elimination', 'get_show_status']
        });
    }

    res.status(200).json({
      success: true,
      action: action,
      showId: showId,
      result: result
    });

  } catch (error) {
    console.error('Error managing show:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to manage show',
      details: error.message,
      suggestion: 'Check if show exists and has participants'
    });
  }
}