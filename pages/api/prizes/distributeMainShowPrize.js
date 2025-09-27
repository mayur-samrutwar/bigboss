import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../../lib/contract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { showId } = req.body;

  // Validate input
  if (!showId) {
    return res.status(400).json({ 
      error: 'Missing required parameter: showId is required' 
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

    console.log(`Distributing main show prize for show ${showId}...`);
    
    // Get show information - we need to check if this is current or next show
    let showInfo;
    try {
      showInfo = await contract.getCurrentShow();
    } catch (error) {
      // If current show fails, try next show
      showInfo = await contract.getNextShow();
    }
    
    const [showId_, startTime, endTime, isActive, entryFee, totalPrize, participantCount] = showInfo;
    
    // Check if this is the show we're looking for
    if (showId_.toString() !== showId) {
      return res.status(400).json({
        success: false,
        error: 'Show not found or not active'
      });
    }
    
    // Get winner information
    let winnerAgentId, isEnded;
    try {
      const winnerInfo = await contract.getWinnerOfShow(BigInt(showId));
      winnerAgentId = winnerInfo.winnerAgentId;
      isEnded = true; // If we can get winner, show has ended
    } catch (error) {
      // If we can't get winner, show hasn't ended
      winnerAgentId = 0;
      isEnded = false;
    }
    
    if (!isEnded) {
      return res.status(400).json({
        success: false,
        error: 'Show has not ended yet'
      });
    }

    if (winnerAgentId === 0) {
      return res.status(400).json({
        success: false,
        error: 'No winner determined for this show'
      });
    }

    // Get winner agent info
    const winnerInfo = await contract.getAgentInfo(BigInt(winnerAgentId));
    const winnerOwner = winnerInfo.owner;

    // Check if prize has already been claimed
    const hasClaimed = await contract.hasClaimedPrize(BigInt(showId), winnerOwner);
    if (hasClaimed) {
      return res.status(400).json({
        success: false,
        error: 'Prize has already been claimed'
      });
    }

    // Calculate prize amount
    const platformFee = (totalPrize * 200n) / 10000n; // 2% platform fee
    const netPrize = totalPrize - platformFee;

    // Distribute prize to winner
    const tx = await contract.claimPrize(BigInt(showId));
    
    console.log(`Prize distribution transaction sent: ${tx.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`Prize distribution transaction mined in block: ${receipt.blockNumber}`);

    res.status(200).json({
      success: true,
      message: `Prize distributed successfully to winner`,
      showId: showId,
      winnerAgentId: winnerAgentId.toString(),
      winnerOwner: winnerOwner,
      totalPrize: ethers.formatEther(totalPrize),
      platformFee: ethers.formatEther(platformFee),
      netPrize: ethers.formatEther(netPrize),
      transaction: {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      }
    });

  } catch (error) {
    console.error('Error distributing main show prize:', error);
    
    let errorMessage = 'Failed to distribute main show prize';
    
    if (error.message.includes('Not the winner')) {
      errorMessage = 'Only the winner can claim the prize';
    } else if (error.message.includes('Prize already claimed')) {
      errorMessage = 'Prize has already been claimed';
    } else if (error.message.includes('No winner determined')) {
      errorMessage = 'No winner has been determined for this show';
    } else if (error.message.includes('Show has not ended')) {
      errorMessage = 'Show has not ended yet';
    } else if (error.message.includes('Insufficient contract balance')) {
      errorMessage = 'Contract has insufficient balance to pay prize';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
}
