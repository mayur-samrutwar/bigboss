import { ethers } from 'ethers';
import { SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI } from '../../lib/contract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { showId, autoProcess = true } = req.body;

    if (!showId) {
      return res.status(400).json({ error: 'Show ID is required' });
    }

    // Connect to Flow Testnet
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

    // Create contract instance
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, wallet);

    console.log(`Polling status for show ${showId}...`);

    // Get show information
    let showInfo;
    let isCurrentShow = false;
    
    try {
      showInfo = await contract.getCurrentShow();
      isCurrentShow = true;
    } catch (error) {
      try {
        showInfo = await contract.getNextShow();
        isCurrentShow = false;
      } catch (nextError) {
        return res.status(404).json({
          success: false,
          error: 'Show not found in current or next show',
          showId: showId
        });
      }
    }

    const [showId_, startTime, endTime, isActive, entryFee, totalPrize, participantCount] = showInfo;

    // Check if this is the show we're looking for
    if (showId_.toString() !== showId) {
      return res.status(400).json({
        success: false,
        error: 'Show ID mismatch',
        requested: showId,
        found: showId_.toString(),
        isCurrentShow
      });
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const showEndTime = Number(endTime);
    const timeHasPassed = currentTime >= showEndTime;
    const timeRemaining = showEndTime - currentTime;

    // Get participants to check alive status
    let participants = [];
    let aliveCount = 0;
    let winnerAgentId = null;
    
    try {
      if (isCurrentShow) {
        const participantData = await contract.getShowParticipants(BigInt(showId));
        const [agentIds, participantAddresses] = participantData;
        
        participants = agentIds.map((id, index) => ({
          agentId: id.toString(),
          address: participantAddresses[index]
        }));

        // Check which agents are alive
        for (const participant of participants) {
          try {
            const agentInfo = await contract.getAgentInfo(BigInt(participant.agentId));
            const [, , , , , , isAlive] = agentInfo;
            
            if (isAlive) {
              aliveCount++;
              if (winnerAgentId === null) {
                winnerAgentId = participant.agentId;
              }
            }
          } catch (error) {
            console.log(`Error getting agent info for ${participant.agentId}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.log('Error getting participants:', error.message);
    }

    // Determine show status
    let status = 'UNKNOWN';
    let shouldProcess = false;
    let reason = '';

    if (!isActive) {
      status = 'ENDED';
      reason = 'Show is already ended';
    } else if (!timeHasPassed) {
      status = 'ACTIVE';
      reason = `Show is still running (${timeRemaining}s remaining)`;
    } else if (aliveCount === 0) {
      status = 'NO_WINNER';
      reason = 'No alive participants found';
    } else if (aliveCount === 1) {
      status = 'READY_TO_END';
      reason = `Only 1 participant alive (Agent ${winnerAgentId})`;
      shouldProcess = autoProcess;
    } else {
      status = 'MULTIPLE_ALIVE';
      reason = `${aliveCount} participants still alive`;
    }

    let result = {
      success: true,
      showId: showId_.toString(),
      status,
      reason,
      showInfo: {
        startTime: Number(startTime),
        endTime: showEndTime,
        currentTime,
        timeRemaining: timeRemaining > 0 ? timeRemaining : 0,
        isActive,
        entryFee: ethers.formatEther(entryFee),
        totalPrize: ethers.formatEther(totalPrize),
        participantCount: Number(participantCount),
        aliveCount,
        winnerAgentId
      },
      participants: participants.map(p => ({
        agentId: p.agentId,
        address: p.address
      }))
    };

    // Process the show if conditions are met
    if (shouldProcess && status === 'READY_TO_END') {
      try {
        console.log(`Processing show ${showId} - ending with winner ${winnerAgentId}`);
        
        const tx = await contract.checkStatus(BigInt(showId));
        const receipt = await tx.wait();

        result.processed = true;
        result.transaction = {
          hash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };

        // Get updated show info
        const updatedShowInfo = await contract.getCurrentShow();
        const [updatedShowId, updatedStartTime, updatedEndTime, updatedIsActive, updatedEntryFee, updatedTotalPrize, updatedParticipantCount] = updatedShowInfo;
        
        result.updatedShowInfo = {
          showId: updatedShowId.toString(),
          startTime: Number(updatedStartTime),
          endTime: Number(updatedEndTime),
          isActive: updatedIsActive,
          entryFee: ethers.formatEther(updatedEntryFee),
          totalPrize: ethers.formatEther(updatedTotalPrize),
          participantCount: Number(updatedParticipantCount)
        };

        result.message = `Show ${showId} processed successfully. Winner: Agent ${winnerAgentId}`;

      } catch (error) {
        result.processed = false;
        result.error = error.message;
        result.message = `Failed to process show ${showId}: ${error.message}`;
      }
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Error polling show status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
}
