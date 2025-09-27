import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../../abi/ShowContract';

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

  try {
    // Set up provider
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    
    // Create contract instance
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, provider);

    console.log(`Getting traits for agent ${agentId}...`);
    
    // Get agent info from contract
    const agentInfo = await contract.getAgentInfo(BigInt(agentId));
    
    // Parse traits from parameters array
    // Expected order: [Popularity, Aggression, Loyalty, Resilience, Charisma, Suspicion, Energy]
    const traits = {
      popularity: agentInfo.parameters[0] || 50,
      aggression: agentInfo.parameters[1] || 30,
      loyalty: agentInfo.parameters[2] || 60,
      resilience: agentInfo.parameters[3] || 50,
      charisma: agentInfo.parameters[4] || 40,
      suspicion: agentInfo.parameters[5] || 20,
      energy: agentInfo.parameters[6] || 80
    };

    // Calculate risk score
    const riskScore = (traits.suspicion + traits.aggression) - (traits.popularity + traits.charisma + traits.resilience);

    res.status(200).json({
      success: true,
      agentId: agentId,
      agentName: agentInfo.name,
      isActive: agentInfo.isActive,
      isAlive: agentInfo.isAlive,
      traits: traits,
      riskScore: riskScore,
      lastUpdated: agentInfo.lastUpdated.toString()
    });

  } catch (error) {
    console.error('Error getting agent traits:', error);
    
    let errorMessage = 'Failed to get agent traits';
    
    if (error.message.includes('Agent does not exist')) {
      errorMessage = 'Agent does not exist';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
}
