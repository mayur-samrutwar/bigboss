import { ethers } from 'ethers';
import { PREDICTION_MARKET_ABI, PREDICTION_MARKET_ADDRESS } from '../../../lib/contract.js';

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
    const contract = new ethers.Contract(PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI, wallet);

    console.log(`Distributing prediction market prizes for show ${showId}...`);
    
    // Get show prediction info
    const showPredictionInfo = await contract.getShowPredictionInfo(BigInt(showId));
    const [totalPrize, participantCount, isEnded, winnerId] = showPredictionInfo;
    
    if (!isEnded) {
      return res.status(400).json({
        success: false,
        error: 'Show has not ended yet'
      });
    }

    if (winnerId === 0) {
      return res.status(400).json({
        success: false,
        error: 'No winner determined for this show'
      });
    }

    if (totalPrize === 0) {
      return res.status(400).json({
        success: false,
        error: 'No predictions were placed on this show'
      });
    }

    // Get all participants who predicted the winner
    const showPrediction = await contract.showPredictions(BigInt(showId));
    const participants = showPrediction.participants;
    
    const distributionResults = [];
    let totalDistributed = 0n;

    // Distribute prizes to all winners
    for (const participant of participants) {
      try {
        // Check if user has winning predictions
        const userPrediction = await contract.getUserPredictions(BigInt(showId), BigInt(winnerId), participant);
        const userContracts = userPrediction.contracts;
        
        if (userContracts > 0) {
          // Check if user has already redeemed
          const hasRedeemed = await contract.hasRedeemed(BigInt(showId), participant);
          
          if (!hasRedeemed) {
            // Calculate user's prize share
            const totalWinnerContracts = await contract.totalContractsPerAgent(BigInt(showId), BigInt(winnerId));
            const platformFee = (totalPrize * 200n) / 10000n; // 2% platform fee
            const netPrize = totalPrize - platformFee;
            const userPrize = (netPrize * userContracts) / totalWinnerContracts;

            if (userPrize > 0) {
              // Create a temporary contract instance with participant's address for claiming
              const tempContract = new ethers.Contract(PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI, wallet);
              
              // Call redeemPrize on behalf of the participant
              const tx = await tempContract.redeemPrize(BigInt(showId), { from: participant });
              
              console.log(`Prize redemption transaction sent for ${participant}: ${tx.hash}`);
              
              // Wait for transaction to be mined
              const receipt = await tx.wait();
              
              distributionResults.push({
                participant: participant,
                contracts: userContracts.toString(),
                prizeAmount: ethers.formatEther(userPrize),
                transaction: {
                  hash: tx.hash,
                  blockNumber: receipt.blockNumber,
                  gasUsed: receipt.gasUsed.toString()
                }
              });

              totalDistributed += userPrize;
            }
          } else {
            distributionResults.push({
              participant: participant,
              contracts: userContracts.toString(),
              prizeAmount: "0",
              status: "Already redeemed"
            });
          }
        }
      } catch (error) {
        console.error(`Error distributing prize to ${participant}:`, error);
        distributionResults.push({
          participant: participant,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Prediction market prizes distributed successfully`,
      showId: showId,
      winnerId: winnerId.toString(),
      totalPrize: ethers.formatEther(totalPrize),
      totalDistributed: ethers.formatEther(totalDistributed),
      distributionResults: distributionResults,
      summary: {
        totalParticipants: participants.length,
        successfulDistributions: distributionResults.filter(r => r.prizeAmount !== "0" && !r.error).length,
        failedDistributions: distributionResults.filter(r => r.error).length,
        alreadyRedeemed: distributionResults.filter(r => r.status === "Already redeemed").length
      }
    });

  } catch (error) {
    console.error('Error distributing prediction market prizes:', error);
    
    let errorMessage = 'Failed to distribute prediction market prizes';
    
    if (error.message.includes('No predictions placed')) {
      errorMessage = 'No predictions were placed on this show';
    } else if (error.message.includes('No winner determined')) {
      errorMessage = 'No winner has been determined for this show';
    } else if (error.message.includes('Show has not ended')) {
      errorMessage = 'Show has not ended yet';
    } else if (error.message.includes('Insufficient contract balance')) {
      errorMessage = 'Contract has insufficient balance to pay prizes';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
}
