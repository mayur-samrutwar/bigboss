import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../abi/ShowContract';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { showId, agentId } = req.body;

  // Validate input
  if (!showId || !agentId) {
    return res.status(400).json({ 
      error: 'Missing required parameters: showId and agentId are required' 
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

    console.log(`Attempting to kill agent ${agentId} in show ${showId}...`);
    
    // Call killAgent function
    const tx = await contract.killAgent(
      BigInt(showId),
      BigInt(agentId)
    );

    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`Transaction mined in block: ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

    // Parse events from transaction receipt
    const events = receipt.logs.map(log => {
      try {
        return contract.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    const agentKilledEvent = events.find(event => event.name === 'AgentKilled');

    res.status(200).json({
      success: true,
      message: `Agent ${agentId} killed successfully in show ${showId}`,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: {
        agentKilled: agentKilledEvent ? {
          showId: agentKilledEvent.args.showId.toString(),
          agentId: agentKilledEvent.args.agentId.toString(),
          killer: agentKilledEvent.args.killer
        } : null
      }
    });

  } catch (error) {
    console.error('Error killing agent:', error);
    
    // Parse specific error messages
    let errorMessage = 'Failed to kill agent';
    
    if (error.message.includes('Agent not participating')) {
      errorMessage = 'Agent is not participating in this show';
    } else if (error.message.includes('Agent not active')) {
      errorMessage = 'Agent is not active';
    } else if (error.message.includes('Agent not alive')) {
      errorMessage = 'Agent is already dead';
    } else if (error.message.includes('Show not active')) {
      errorMessage = 'Show is not active';
    } else if (error.message.includes('Show does not exist')) {
      errorMessage = 'Show does not exist';
    } else if (error.message.includes('Agent does not exist')) {
      errorMessage = 'Agent does not exist';
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for gas';
    } else if (error.message.includes('nonce')) {
      errorMessage = 'Transaction nonce error - please try again';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
}
