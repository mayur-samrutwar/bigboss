// Simple mock API for testing without contract dependencies
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId } = req.query;

  // Validate input
  if (!agentId) {
    return res.status(400).json({ 
      error: 'Missing required parameter: agentId is required' 
    });
  }

  // Mock data for testing
  const mockAgents = {
    "1": {
      agentId: "1",
      name: "Rajesh",
      isActive: true,
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
      riskScore: -155, // (20 + 40) - (75 + 80 + 70) = -155
      lastUpdated: Date.now().toString()
    },
    "2": {
      agentId: "2", 
      name: "Priya",
      isActive: true,
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
      riskScore: -10, // (30 + 70) - (60 + 50 + 60) = -10
      lastUpdated: Date.now().toString()
    },
    "3": {
      agentId: "3",
      name: "Vikram", 
      isActive: true,
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
      riskScore: -30, // (40 + 60) - (50 + 60 + 80) = -30
      lastUpdated: Date.now().toString()
    }
  };

  try {
    console.log(`Getting traits for agent ${agentId}...`);
    
    const agent = mockAgents[agentId];
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent ${agentId} not found`,
        availableAgents: Object.keys(mockAgents),
        suggestion: 'Run "node registerTestAgents.js" to deploy real agents'
      });
    }

    res.status(200).json({
      success: true,
      agentId: agentId,
      agentName: agent.name,
      isActive: agent.isActive,
      isAlive: agent.isAlive,
      traits: agent.traits,
      riskScore: agent.riskScore,
      lastUpdated: agent.lastUpdated,
      isMockData: true,
      note: 'Using mock data - no agents deployed on contract'
    });

  } catch (error) {
    console.error('Error getting agent traits:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get agent traits',
      details: error.message
    });
  }
}