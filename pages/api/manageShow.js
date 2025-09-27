import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../../abi/ShowContract';

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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    let result;

    switch (action) {
      case 'get_ai_decision':
        // Get AI decision for next action
        const aiResponse = await fetch(`${baseUrl}/api/ai/getDecision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ showId })
        });
        
        if (!aiResponse.ok) {
          throw new Error('Failed to get AI decision');
        }
        
        result = await aiResponse.json();
        break;

      case 'execute_ai_action':
        // Get AI decision and execute it
        const decisionResponse = await fetch(`${baseUrl}/api/ai/getDecision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ showId })
        });
        
        if (!decisionResponse.ok) {
          throw new Error('Failed to get AI decision');
        }
        
        const decision = await decisionResponse.json();
        
        if (!decision.success) {
          return res.status(400).json(decision);
        }
        
        // Execute the AI decision
        const executeResponse = await fetch(`${baseUrl}/api/executeAction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: decision.aiDecision.action,
            parameters: decision.aiDecision.parameters,
            showId: showId
          })
        });
        
        if (!executeResponse.ok) {
          throw new Error('Failed to execute AI action');
        }
        
        result = await executeResponse.json();
        result.aiDecision = decision.aiDecision;
        break;

      case 'check_elimination':
        // Check if it's time for elimination (every 5 minutes in 30-minute show)
        const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
        const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, provider);
        
        const showInfo = await contract.getCurrentShow();
        const timeElapsed = Date.now() / 1000 - Number(showInfo.startTime);
        const eliminationInterval = 5 * 60; // 5 minutes in seconds
        
        if (timeElapsed > 0 && timeElapsed % eliminationInterval < 60) { // Within 1 minute of elimination time
          const eliminationResponse = await fetch(`${baseUrl}/api/elimination/calculateElimination`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ showId })
          });
          
          if (eliminationResponse.ok) {
            result = await eliminationResponse.json();
          } else {
            result = { success: false, message: 'No elimination needed at this time' };
          }
        } else {
          result = { success: false, message: 'Not time for elimination yet' };
        }
        break;

      case 'get_show_status':
        // Get comprehensive show status
        const statusResponse = await fetch(`${baseUrl}/api/traits/getAgentTraits?agentId=1`, {
          method: 'GET'
        });
        
        // Get all participating agents
        const contract2 = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, provider);
        const participants = await contract2.getShowParticipants(BigInt(showId));
        
        const agentsStatus = [];
        for (const agentId of participants.agentIds) {
          const agentInfo = await contract2.getAgentInfo(agentId);
          const traits = {
            popularity: agentInfo.parameters[0] || 50,
            aggression: agentInfo.parameters[1] || 30,
            loyalty: agentInfo.parameters[2] || 60,
            resilience: agentInfo.parameters[3] || 50,
            charisma: agentInfo.parameters[4] || 40,
            suspicion: agentInfo.parameters[5] || 20,
            energy: agentInfo.parameters[6] || 80
          };
          
          const riskScore = (traits.suspicion + traits.aggression) - (traits.popularity + traits.charisma + traits.resilience);
          
          agentsStatus.push({
            agentId: agentId.toString(),
            name: agentInfo.name,
            isAlive: agentInfo.isAlive,
            traits: traits,
            riskScore: riskScore
          });
        }
        
        result = {
          success: true,
          showId: showId,
          agents: agentsStatus,
          aliveCount: agentsStatus.filter(agent => agent.isAlive).length,
          totalCount: agentsStatus.length
        };
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
      details: error.message
    });
  }
}
