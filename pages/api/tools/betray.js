import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../../lib/contract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { betrayerAgent, betrayedAgent, showId } = req.body;

  // Validate input
  if (!betrayerAgent || !betrayedAgent || !showId) {
    return res.status(400).json({ 
      error: 'Missing required parameters: betrayerAgent, betrayedAgent, and showId are required' 
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

    console.log(`Agent ${betrayerAgent} betraying agent ${betrayedAgent} in show ${showId}...`);
    
    // Get current traits for both agents
    const betrayerInfo = await contract.getAgentInfo(BigInt(betrayerAgent));
    const betrayedInfo = await contract.getAgentInfo(BigInt(betrayedAgent));
    
    const betrayerTraits = betrayerInfo.parameters;
    const betrayedTraits = betrayedInfo.parameters;
    
    // Calculate trait changes for betrayal
    const newBetrayerTraits = [...betrayerTraits];
    const newBetrayedTraits = [...betrayedTraits];
    
    // Betrayer gains aggression
    newBetrayerTraits[1] = Math.min(100, newBetrayerTraits[1] + 20); // Aggression +20
    
    // Betrayer loses popularity significantly
    newBetrayerTraits[0] = Math.max(0, newBetrayerTraits[0] - 25); // Popularity -25
    
    // Betrayer loses loyalty
    newBetrayerTraits[2] = Math.max(0, newBetrayerTraits[2] - 20); // Loyalty -20
    
    // Betrayer gains suspicion
    newBetrayerTraits[5] = Math.min(100, newBetrayerTraits[5] + 15); // Suspicion +15
    
    // Betrayed agent loses loyalty
    newBetrayedTraits[2] = Math.max(0, newBetrayedTraits[2] - 15); // Loyalty -15
    
    // Betrayed agent loses popularity
    newBetrayedTraits[0] = Math.max(0, newBetrayedTraits[0] - 10); // Popularity -10
    
    // Betrayed agent gains suspicion
    newBetrayedTraits[5] = Math.min(100, newBetrayedTraits[5] + 10); // Suspicion +10
    
    // Both lose energy
    newBetrayerTraits[6] = Math.max(0, newBetrayerTraits[6] - 15); // Energy -15
    newBetrayedTraits[6] = Math.max(0, newBetrayedTraits[6] - 10); // Energy -10
    
    // Update agent parameters
    const txBetrayer = await contract.updateAgentParams(BigInt(betrayerAgent), newBetrayerTraits);
    const txBetrayed = await contract.updateAgentParams(BigInt(betrayedAgent), newBetrayedTraits);
    
    console.log(`Betrayer transaction sent: ${txBetrayer.hash}`);
    console.log(`Betrayed transaction sent: ${txBetrayed.hash}`);
    
    // Wait for transactions to be mined
    const receiptBetrayer = await txBetrayer.wait();
    const receiptBetrayed = await txBetrayed.wait();
    
    console.log(`Betrayer transaction mined in block: ${receiptBetrayer.blockNumber}`);
    console.log(`Betrayed transaction mined in block: ${receiptBetrayed.blockNumber}`);

    res.status(200).json({
      success: true,
      message: `Agent ${betrayerAgent} betrayed agent ${betrayedAgent}`,
      transactions: {
        betrayer: {
          hash: txBetrayer.hash,
          blockNumber: receiptBetrayer.blockNumber,
          gasUsed: receiptBetrayer.gasUsed.toString()
        },
        betrayed: {
          hash: txBetrayed.hash,
          blockNumber: receiptBetrayed.blockNumber,
          gasUsed: receiptBetrayed.gasUsed.toString()
        }
      },
      traitChanges: {
        betrayer: {
          aggression: '+20',
          popularity: '-25',
          loyalty: '-20',
          suspicion: '+15',
          energy: '-15'
        },
        betrayed: {
          loyalty: '-15',
          popularity: '-10',
          suspicion: '+10',
          energy: '-10'
        }
      }
    });

  } catch (error) {
    console.error('Error executing betray action:', error);
    
    let errorMessage = 'Failed to execute betray action';
    
    if (error.message.includes('Agent not participating')) {
      errorMessage = 'One or both agents are not participating in this show';
    } else if (error.message.includes('Agent not active')) {
      errorMessage = 'One or both agents are not active';
    } else if (error.message.includes('Agent not alive')) {
      errorMessage = 'One or both agents are dead';
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
