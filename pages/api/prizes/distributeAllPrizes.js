import { ethers } from 'ethers';
import { SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI } from '../../../lib/contract';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { showId, distributeMainShow = true, distributePredictions = true } = req.body;

    if (!showId) {
      return res.status(400).json({
        success: false,
        error: 'Show ID is required'
      });
    }

    // Connect to Flow Testnet
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

    const results = {
      showId,
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
        } else {
          // Get winner info
          const winnerInfo = await predictionContract.getWinnerOfShow(BigInt(showId));
          const [winnerAgentId, winnerName, totalContracts] = winnerInfo;
          
          results.predictionPrizes = {
            success: true,
            winnerAgentId: winnerAgentId.toString(),
            winnerName: winnerName,
            totalContracts: totalContracts.toString(),
            totalPrize: ethers.formatEther(totalPrize),
            message: 'Prediction prizes calculated successfully'
          };
        }
      } catch (error) {
        console.error('Error distributing prediction prizes:', error);
        results.errors.push(`Predictions: ${error.message}`);
      }
    }

    // Determine overall success
    const hasErrors = results.errors.length > 0;
    const hasSuccess = results.mainShowPrize?.success || results.predictionPrizes?.success;

    res.status(hasErrors && !hasSuccess ? 400 : 200).json({
      success: !hasErrors || hasSuccess,
      message: hasErrors && !hasSuccess ? 'Prize distribution failed' : 'Prize distribution completed',
      results: results,
      summary: {
        totalErrors: results.errors.length,
        errors: results.errors
      }
    });

  } catch (error) {
    console.error('Error in prize distribution:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
}
