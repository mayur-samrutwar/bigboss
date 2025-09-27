import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS, PREDICTION_MARKET_ABI, PREDICTION_MARKET_ADDRESS } from '../../../lib/contract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { showId, distributeMainShow = true, distributePredictions = true } = req.body;

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
    
    const results = {
      showId: showId,
      mainShowPrize: null,
      predictionPrizes: null,
      errors: []
    };

    // Distribute main show prize
    if (distributeMainShow) {
      try {
        console.log(`Distributing main show prize for show ${showId}...`);
        
        const showContract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, wallet);
        
        // Get show information - we need to check if this is current or next show
        let showInfo;
        try {
          showInfo = await showContract.getCurrentShow();
        } catch (error) {
          // If current show fails, try next show
          showInfo = await showContract.getNextShow();
        }
        
        const [showId_, startTime, endTime, isActive, entryFee, totalPrize, participantCount] = showInfo;
        
        // Check if this is the show we're looking for
        if (showId_.toString() !== showId) {
          results.errors.push('Main show: Show not found or not active');
        } else {
          // Get winner information
          let winnerAgentId, isEnded;
          try {
            const winnerInfo = await showContract.getWinnerOfShow(BigInt(showId));
            winnerAgentId = winnerInfo.winnerAgentId;
            isEnded = true; // If we can get winner, show has ended
          } catch (error) {
            // If we can't get winner, show hasn't ended
            winnerAgentId = 0;
            isEnded = false;
          }
        
        if (!isEnded) {
          results.errors.push('Main show: Show has not ended yet');
        } else if (winnerAgentId === 0) {
          results.errors.push('Main show: No winner determined for this show');
        } else {
          // Get winner agent info
          const winnerInfo = await showContract.getAgentInfo(BigInt(winnerAgentId));
          const winnerOwner = winnerInfo.owner;

          // Check if prize has already been claimed
          const hasClaimed = await showContract.hasClaimedPrize(BigInt(showId), winnerOwner);
          if (hasClaimed) {
            results.errors.push('Main show: Prize has already been claimed');
          } else {
            // Calculate prize amount
            const platformFee = (totalPrize * 200n) / 10000n; // 2% platform fee
            const netPrize = totalPrize - platformFee;

            // Distribute prize to winner
            const tx = await showContract.claimPrize(BigInt(showId));
            const receipt = await tx.wait();

            results.mainShowPrize = {
              success: true,
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
            };
          }
        }
      } catch (error) {
        console.error('Error distributing main show prize:', error);
        results.errors.push(`Main show: ${error.message}`);
      }
    }

    // Distribute prediction market prizes
    if (distributePredictions) {
      try {
        console.log(`Distributing prediction market prizes for show ${showId}...`);
        
        const predictionContract = new ethers.Contract(PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI, wallet);
        
        // Get show prediction info
        const showPredictionInfo = await predictionContract.getShowPredictionInfo(BigInt(showId));
        const [totalPrize, participantCount, isEnded, winnerId] = showPredictionInfo;
        
        if (!isEnded) {
          results.errors.push('Predictions: Show has not ended yet');
        } else if (winnerId === 0) {
          results.errors.push('Predictions: No winner determined for this show');
        } else if (totalPrize === 0) {
          results.errors.push('Predictions: No predictions were placed on this show');
        } else {
          // Get all participants who predicted the winner
          const showPrediction = await predictionContract.showPredictions(BigInt(showId));
          const participants = showPrediction.participants;
          
          const distributionResults = [];
          let totalDistributed = 0n;

          // Distribute prizes to all winners
          for (const participant of participants) {
            try {
              // Check if user has winning predictions
              const userPrediction = await predictionContract.getUserPredictions(BigInt(showId), BigInt(winnerId), participant);
              const userContracts = userPrediction.contracts;
              
              if (userContracts > 0) {
                // Check if user has already redeemed
                const hasRedeemed = await predictionContract.hasRedeemed(BigInt(showId), participant);
                
                if (!hasRedeemed) {
                  // Calculate user's prize share
                  const totalWinnerContracts = await predictionContract.totalContractsPerAgent(BigInt(showId), BigInt(winnerId));
                  const platformFee = (totalPrize * 200n) / 10000n; // 2% platform fee
                  const netPrize = totalPrize - platformFee;
                  const userPrize = (netPrize * userContracts) / totalWinnerContracts;

                  if (userPrize > 0) {
                    // Create a temporary contract instance with participant's address for claiming
                    const tempContract = new ethers.Contract(PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI, wallet);
                    
                    // Call redeemPrize on behalf of the participant
                    const tx = await tempContract.redeemPrize(BigInt(showId), { from: participant });
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

          results.predictionPrizes = {
            success: true,
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
          };
        }
      } catch (error) {
        console.error('Error distributing prediction market prizes:', error);
        results.errors.push(`Predictions: ${error.message}`);
      }
    }

    // Determine overall success
    const hasMainShowSuccess = results.mainShowPrize?.success;
    const hasPredictionSuccess = results.predictionPrizes?.success;
    const hasAnySuccess = hasMainShowSuccess || hasPredictionSuccess;
    const hasAnyErrors = results.errors.length > 0;

    res.status(hasAnySuccess ? 200 : 400).json({
      success: hasAnySuccess,
      message: hasAnySuccess ? 'Prize distribution completed' : 'Prize distribution failed',
      results: results,
      summary: {
        mainShowDistributed: hasMainShowSuccess,
        predictionsDistributed: hasPredictionSuccess,
        totalErrors: results.errors.length,
        errors: results.errors
      }
    });

  } catch (error) {
    console.error('Error in prize distribution:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to distribute prizes',
      details: error.message
    });
  }
}
