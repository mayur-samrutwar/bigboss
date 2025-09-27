import { ethers } from 'ethers';

// Contract configuration
const SHOW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x759aB3Ba417Da08eA211fC0312902786D889Bc25';

// Basic ABI for checkStatus function
const BASIC_ABI = [
  'function checkStatus(uint256) external',
  'function currentShowId() view returns (uint256)',
  'function getCurrentShow() view returns (uint256, uint256, uint256, bool, uint256, uint256, uint256)',
  'function getTimeUntilShowEnds() view returns (uint256)'
];

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
    console.log(`Checking status for show ${showId}...`);
    
    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    
    // Use admin private key from environment
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return res.status(500).json({
        success: false,
        error: 'Admin private key not configured'
      });
    }
    
    const wallet = new ethers.Wallet(adminPrivateKey, provider);
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, BASIC_ABI, wallet);
    
    // Check current show status first
    const currentShowId = await contract.currentShowId();
    console.log('Current show ID:', currentShowId.toString());
    
    if (currentShowId.toString() !== showId) {
      return res.status(400).json({
        success: false,
        error: `Show ${showId} is not the current active show`
      });
    }
    
    // Get show details
    const showData = await contract.getCurrentShow();
    const [showIdFromContract, startTime, endTime, isActive, entryFee, totalPrize, participantCount] = showData;
    
    console.log('Show details:', {
      showId: showIdFromContract.toString(),
      startTime: Number(startTime),
      endTime: Number(endTime),
      isActive,
      participantCount: Number(participantCount)
    });
    
    // Check if show should be ended
    const currentTime = Math.floor(Date.now() / 1000);
    const showEndTime = Number(endTime);
    
    if (isActive && currentTime >= showEndTime) {
      console.log('Show time has expired, calling checkStatus...');
      
      // Call checkStatus to automatically end the show
      const tx = await contract.checkStatus(BigInt(showId));
      console.log('Transaction hash:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);
      
      return res.status(200).json({
        success: true,
        message: `Show ${showId} has been automatically ended`,
        transactionHash: tx.hash,
        showId: showId,
        endTime: showEndTime,
        currentTime: currentTime,
        timeOverdue: currentTime - showEndTime
      });
    } else {
      return res.status(200).json({
        success: true,
        message: `Show ${showId} is still active or not ready to end`,
        showId: showId,
        isActive,
        endTime: showEndTime,
        currentTime: currentTime,
        timeRemaining: Math.max(0, showEndTime - currentTime)
      });
    }
    
  } catch (error) {
    console.error('Error checking show status:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to check show status',
      details: error.message
    });
  }
}
