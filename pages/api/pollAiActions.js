import { ethers } from 'ethers';
import { SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI } from '../../lib/contract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { showId, executeAction = false } = req.body;

  // Validate input
  if (!showId) {
    return res.status(400).json({ 
      error: 'Missing required parameter: showId is required' 
    });
  }

  try {
    console.log(`🤖 AI Action polling for show ${showId}...`);
    
    // Set up provider
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, provider);
    
    // Get current show
    const currentShowId = await contract.currentShowId();
    console.log('📺 Current show ID:', currentShowId.toString());
    
    if (currentShowId.toString() !== showId) {
      return res.status(400).json({
        success: false,
        error: `Show ${showId} is not the current active show`,
        currentShowId: currentShowId.toString()
      });
    }
    
    // Get show details
    const showData = await contract.getCurrentShow();
    const [showIdFromContract, startTime, endTime, isActive, entryFee, totalPrize, participantCount] = showData;
    
    if (!isActive) {
      return res.status(200).json({
        success: true,
        message: 'Show is not active, no AI actions needed',
        showId: showId,
        isActive: false,
        action: 'skipped'
      });
    }
    
    // Get show participants
    const showParticipants = await contract.getShowParticipants(BigInt(showId));
    const [agentIds, participantAddresses] = showParticipants;
    
    if (agentIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No participants in show, no AI actions needed',
        showId: showId,
        participantCount: 0,
        action: 'skipped'
      });
    }
    
    // Get traits for all participating agents
    const agentsData = [];
    let aliveCount = 0;
    
    for (const agentId of agentIds) {
      try {
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
        
        aliveCount++;
      } catch (error) {
        console.log(`Error getting agent info for ${agentId}:`, error.message);
      }
    }
    
    if (aliveCount < 2) {
      return res.status(200).json({
        success: true,
        message: 'Not enough alive agents for AI actions',
        showId: showId,
        aliveCount: aliveCount,
        action: 'skipped'
      });
    }
    
    // Call AI decision API
    console.log(`🧠 Getting AI decision for ${aliveCount} alive agents...`);
    
    const aiDecisionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/getDecision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        showId: showId,
        context: 'automated_polling'
      })
    });
    
    if (!aiDecisionResponse.ok) {
      const errorData = await aiDecisionResponse.json();
      console.error('❌ AI decision failed:', errorData);
      
      return res.status(200).json({
        success: false,
        message: 'AI decision failed',
        showId: showId,
        aliveCount: aliveCount,
        action: 'failed',
        error: errorData.error,
        retry: true
      });
    }
    
    const aiDecisionData = await aiDecisionResponse.json();
    
    if (!aiDecisionData.success) {
      console.error('❌ AI decision returned failure:', aiDecisionData);
      
      return res.status(200).json({
        success: false,
        message: 'AI decision returned failure',
        showId: showId,
        aliveCount: aliveCount,
        action: 'failed',
        error: aiDecisionData.error,
        retry: true
      });
    }
    
    console.log('✅ AI decision received:', aiDecisionData.aiDecision);
    
    // If executeAction is false, just return the decision
    if (!executeAction) {
      return res.status(200).json({
        success: true,
        message: 'AI decision generated successfully',
        showId: showId,
        aliveCount: aliveCount,
        action: 'decision_only',
        aiDecision: aiDecisionData.aiDecision,
        availableAgents: agentsData.map(agent => ({
          agentId: agent.agentId,
          name: agent.name,
          riskScore: agent.riskScore
        }))
      });
    }
    
    // Execute the AI decision
    console.log(`🎬 Executing AI action: ${aiDecisionData.aiDecision.action}...`);
    
    const executeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/executeAction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: aiDecisionData.aiDecision.action,
        parameters: aiDecisionData.aiDecision.parameters,
        showId: showId
      })
    });
    
    if (!executeResponse.ok) {
      const errorData = await executeResponse.json();
      console.error('❌ Action execution failed:', errorData);
      
      return res.status(200).json({
        success: false,
        message: 'Action execution failed',
        showId: showId,
        aliveCount: aliveCount,
        action: 'execution_failed',
        aiDecision: aiDecisionData.aiDecision,
        error: errorData.error,
        retry: true
      });
    }
    
    const executeData = await executeResponse.json();
    
    if (!executeData.success) {
      console.error('❌ Action execution returned failure:', executeData);
      
      return res.status(200).json({
        success: false,
        message: 'Action execution returned failure',
        showId: showId,
        aliveCount: aliveCount,
        action: 'execution_failed',
        aiDecision: aiDecisionData.aiDecision,
        error: executeData.error,
        retry: true
      });
    }
    
    console.log('✅ Action executed successfully:', executeData.toolResult);
    
    // Add news entry about the action
    try {
      const newsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/news/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showId: showId,
          title: `AI Action: ${aiDecisionData.aiDecision.action}`,
          content: `AI executed action: ${aiDecisionData.aiDecision.action}(${aiDecisionData.aiDecision.parameters.join(', ')})`,
          type: 'ai_action',
          agentId: aiDecisionData.aiDecision.parameters[0] // First parameter is usually the main agent
        })
      });
      
      if (newsResponse.ok) {
        console.log('📰 News entry added for AI action');
      } else {
        console.log('⚠️ Failed to add news entry for AI action');
      }
    } catch (newsError) {
      console.log('⚠️ Error adding news entry:', newsError.message);
    }
    
    return res.status(200).json({
      success: true,
      message: 'AI action executed successfully',
      showId: showId,
      aliveCount: aliveCount,
      action: 'executed',
      aiDecision: aiDecisionData.aiDecision,
      executionResult: executeData.toolResult,
      availableAgents: agentsData.map(agent => ({
        agentId: agent.agentId,
        name: agent.name,
        riskScore: agent.riskScore
      }))
    });
    
  } catch (error) {
    console.error('❌ Error in AI action polling:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to process AI action polling',
      details: error.message,
      showId: showId,
      action: 'error'
    });
  }
}
