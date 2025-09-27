import { ethers } from 'ethers';

// Contract configuration (avoiding import issues)
const SHOW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x759aB3Ba417Da08eA211fC0312902786D889Bc25';

// Basic ABI for getAgentInfo function
const BASIC_ABI = [
  'function agentCounter() view returns (uint256)',
  'function getAgentInfo(uint256) view returns (uint256, address, string, uint256[], bool, bool, uint256, uint256)'
];

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
    console.log(`Getting traits for agent ${agentId} from contract...`);
    console.log('Contract address:', SHOW_CONTRACT_ADDRESS);
    console.log('ABI length:', BASIC_ABI.length);
    
    // Set up provider
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, BASIC_ABI, provider);

    // Test basic contract call first
    console.log('Testing contract connection...');
    const agentCounter = await contract.agentCounter();
    console.log('Agent counter:', agentCounter.toString());
    
    // Get agent info from contract
    console.log('Getting agent info for agent:', agentId);
    const agentInfo = await contract.getAgentInfo(BigInt(agentId));
    console.log('Agent info received:', agentInfo);
    
    // Extract traits from parameters (agentInfo is a Result array)
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

    res.status(200).json({
      success: true,
      agentId: agentId,
      agentName: agentInfo[2], // name is at index 2
      isActive: Boolean(agentInfo[4]), // isActive is at index 4
      isAlive: Boolean(agentInfo[5]), // isAlive is at index 5
      traits: traits,
      riskScore: riskScore,
      lastUpdated: Number(agentInfo[7]), // lastUpdated is at index 7
      isMockData: false,
      note: 'Real data from contract'
    });

  } catch (error) {
    console.error('Error getting agent traits from contract:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      reason: error.reason
    });
    
    // Fallback to mock data for testing
    const mockAgents = {
      "1": { name: "astro" }, // Real agent name from contract
      "2": { name: "Priya" },
      "3": { name: "Vikram" },
      "4": { name: "Arjun" },
      "5": { name: "Salman" },
      "6": { name: "Shahrukh" },
      "7": { name: "Aamir" },
      "8": { name: "Hrithik" },
      "9": { name: "Ranbir" },
      "10": { name: "Varun" },
      "11": { name: "Tiger" }
    };

    const mockAgent = mockAgents[agentId];
    
    if (mockAgent) {
      return res.status(200).json({
        success: true,
        agentId: agentId,
        agentName: mockAgent.name,
        isActive: true,
        isAlive: true,
        traits: {
          popularity: 50,
          aggression: 30,
          loyalty: 60,
          resilience: 50,
          charisma: 40,
          suspicion: 20,
          energy: 80
        },
        riskScore: 0,
        lastUpdated: Date.now().toString(),
        isMockData: true,
        note: 'Using fallback mock data - contract call failed'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to get agent traits',
      details: error.message
    });
  }
}