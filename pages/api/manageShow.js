import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../lib/contract.js';

// Mock show data
const mockShowData = {
  showId: "1",
  agents: [
    {
      agentId: "1",
      name: "Rajesh",
      isAlive: true,
      traits: {
        popularity: 75,
        aggression: 40,
        loyalty: 60,
        resilience: 70,
        charisma: 80,
        suspicion: 20,
        energy: 90
      },
      riskScore: -155
    },
    {
      agentId: "2", 
      name: "Priya",
      isAlive: true,
      traits: {
        popularity: 60,
        aggression: 70,
        loyalty: 80,
        resilience: 60,
        charisma: 50,
        suspicion: 30,
        energy: 85
      },
      riskScore: -10
    },
    {
      agentId: "3",
      name: "Vikram", 
      isAlive: true,
      traits: {
        popularity: 50,
        aggression: 60,
        loyalty: 50,
        resilience: 80,
        charisma: 60,
        suspicion: 40,
        energy: 75
      },
      riskScore: -30
    }
  ],
  aliveCount: 3,
  totalCount: 3
};

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
        // Mock AI decision
        result = {
          success: true,
          aiDecision: {
            action: 'argue',
            parameters: ['1', '2'],
            rawResponse: 'argue(1,2)'
          },
          context: {
            showId: showId,
            totalAgents: mockShowData.aliveCount,
            agents: mockShowData.agents,
            context: 'general',
            timestamp: new Date().toISOString()
          },
          availableAgents: mockShowData.agents.map(agent => ({
            agentId: agent.agentId,
            name: agent.name,
            riskScore: agent.riskScore
          }))
        };
        break;

      case 'execute_ai_action':
        // Mock AI action execution
        result = {
          success: true,
          message: 'Mock AI action executed successfully',
          action: 'argue',
          parameters: ['1', '2'],
          toolResult: {
            success: true,
            message: 'Mock argue action completed',
            winner: '1',
            loser: '2',
            traitChanges: {
              agent1: {
                aggression: '+10',
                suspicion: '+5',
                popularity: '+5',
                energy: '-10'
              },
              agent2: {
                aggression: '+10',
                suspicion: '+5',
                popularity: '-15',
                energy: '-10'
              }
            }
          },
          aiDecision: {
            action: 'argue',
            parameters: ['1', '2'],
            rawResponse: 'argue(1,2)'
          }
        };
        break;

      case 'check_elimination':
        // Mock elimination check
        result = {
          success: false,
          message: 'Not time for elimination yet (mock mode)',
          mockMode: true
        };
        break;

      case 'get_show_status':
        // Return mock show status
        result = {
          success: true,
          showId: showId,
          agents: mockShowData.agents,
          aliveCount: mockShowData.aliveCount,
          totalCount: mockShowData.totalCount,
          mockMode: true
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
      result: result,
      mockMode: true,
      note: 'Using mock data - no agents deployed on contract. Run "node registerTestAgents.js" to deploy real agents.'
    });

  } catch (error) {
    console.error('Error managing show:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to manage show',
      details: error.message,
      suggestion: 'Run "node registerTestAgents.js" to deploy test agents'
    });
  }
}