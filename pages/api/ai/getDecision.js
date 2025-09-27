import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../../lib/contract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { showId, context } = req.body;

  // Validate input
  if (!showId) {
    return res.status(400).json({ 
      error: 'Missing required parameter: showId is required' 
    });
  }

  try {
    // Set up provider
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, provider);

    console.log(`Getting AI decision for show ${showId}...`);
    
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
      
      agentsData.push({
        agentId: agentId.toString(),
        name: agentInfo.name,
        isAlive: agentInfo.isAlive,
        traits: traits,
        riskScore: riskScore
      });
    }

    // Filter only alive agents
    const aliveAgents = agentsData.filter(agent => agent.isAlive);
    
    if (aliveAgents.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Not enough alive agents for actions'
      });
    }

    // Create context for AI
    const aiContext = {
      showId: showId,
      totalAgents: aliveAgents.length,
      agents: aliveAgents,
      context: context || 'general',
      timestamp: new Date().toISOString()
    };

    // Call external AI service
    const aiResponse = await fetch('http://81.15.150.157:5000/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `You are managing a reality show with ${aliveAgents.length} contestants. 

Current agents and their traits:
${aliveAgents.map(agent => 
  `Agent ${agent.agentId} (${agent.name}): Popularity=${agent.traits.popularity}, Aggression=${agent.traits.aggression}, Loyalty=${agent.traits.loyalty}, Resilience=${agent.traits.resilience}, Charisma=${agent.traits.charisma}, Suspicion=${agent.traits.suspicion}, Energy=${agent.traits.energy}, Risk Score=${agent.riskScore}`
).join('\n')}

Available actions:
1. argue(agentA, agentB) - Two agents argue, both gain aggression and suspicion, loser loses popularity
2. form_alliance(agentA, agentB) - Two agents form alliance, both gain loyalty and popularity
3. betray(agentA, agentB) - Agent A betrays Agent B, betrayer gains aggression but loses popularity
4. perform_task(agentId) - Agent performs task, success based on charisma+resilience
5. gossip(agentA, agentB) - Agent A gossips about Agent B, target gains suspicion
6. audience_vote(agentId) - Audience votes on agent, affects popularity
7. random_event(agentId) - Random event affects multiple traits

Based on the current state, choose the most dramatic and interesting action. Consider:
- Who has high risk scores (likely to be eliminated)
- Who has low energy (vulnerable)
- Who has high aggression (likely to cause drama)
- Who has high popularity (audience favorites)

Respond with ONLY the action in this exact format:
action_name(agentId1,agentId2) or action_name(agentId1) for single-agent actions

Example: argue(1,3) or perform_task(2) or random_event(4)`
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI service responded with status: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiDecision = aiData.response.trim();

    // Parse AI decision
    const actionMatch = aiDecision.match(/^(\w+)\(([^)]+)\)$/);
    if (!actionMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid AI response format',
        aiResponse: aiDecision
      });
    }

    const [, actionName, params] = actionMatch;
    const paramList = params.split(',').map(p => p.trim());

    // Validate action and parameters
    const validActions = ['argue', 'form_alliance', 'betray', 'perform_task', 'gossip', 'audience_vote', 'random_event'];
    if (!validActions.includes(actionName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action name',
        actionName: actionName
      });
    }

    // Validate agent IDs exist and are alive
    const validAgentIds = aliveAgents.map(agent => agent.agentId);
    for (const agentId of paramList) {
      if (!validAgentIds.includes(agentId)) {
        return res.status(400).json({
          success: false,
          error: `Invalid agent ID: ${agentId}`,
          validAgentIds: validAgentIds
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'AI decision generated successfully',
      aiDecision: {
        action: actionName,
        parameters: paramList,
        rawResponse: aiDecision
      },
      context: aiContext,
      availableAgents: aliveAgents.map(agent => ({
        agentId: agent.agentId,
        name: agent.name,
        riskScore: agent.riskScore
      }))
    });

  } catch (error) {
    console.error('Error getting AI decision:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get AI decision',
      details: error.message
    });
  }
}
