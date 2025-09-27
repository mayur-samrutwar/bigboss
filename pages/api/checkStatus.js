import { ethers } from 'ethers';
import { SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI } from '../../lib/contract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { showId, autoEnd = false } = req.body;

    if (!showId) {
      return res.status(400).json({ error: 'Show ID is required' });
    }

    // Connect to Flow Testnet
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

    // Create contract instance
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, wallet);

    console.log(`Checking status for show ${showId}...`);

    // Get show information first
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
        error: 'Show not found or not active',
        showInfo: {
          showId: showId_.toString(),
          startTime: Number(startTime),
          endTime: Number(endTime),
          isActive,
          entryFee: ethers.formatEther(entryFee),
          totalPrize: ethers.formatEther(totalPrize),
          participantCount: Number(participantCount)
        }
      });
    }

    // Check if show has ended according to time
    const currentTime = Math.floor(Date.now() / 1000);
    const showEndTime = Number(endTime);
    const timeHasPassed = currentTime >= showEndTime;

    // If autoEnd is false, just return status without ending
    if (!autoEnd) {
      return res.status(200).json({
        success: true,
        message: 'Show status checked',
        showInfo: {
          showId: showId_.toString(),
          startTime: Number(startTime),
          endTime: showEndTime,
          currentTime,
          timeRemaining: Math.max(0, showEndTime - currentTime),
          isActive,
          entryFee: ethers.formatEther(entryFee),
          totalPrize: ethers.formatEther(totalPrize),
          participantCount: Number(participantCount),
          shouldEnd: timeHasPassed && isActive
        }
      });
    }

    // Only proceed with ending if autoEnd is true
    if (!timeHasPassed) {
      return res.status(400).json({
        success: false,
        error: 'Show has not ended yet',
        showInfo: {
          showId: showId_.toString(),
          startTime: Number(startTime),
          endTime: showEndTime,
          currentTime,
          timeRemaining: showEndTime - currentTime,
          isActive,
          entryFee: ethers.formatEther(entryFee),
          totalPrize: ethers.formatEther(totalPrize),
          participantCount: Number(participantCount)
        }
      });
    }

    // Call checkStatus function to end the show
    const tx = await contract.checkStatus(BigInt(showId));
    const receipt = await tx.wait();

    // Get updated show info
    const updatedShowInfo = await contract.getCurrentShow();
    const [updatedShowId, updatedStartTime, updatedEndTime, updatedIsActive, updatedEntryFee, updatedTotalPrize, updatedParticipantCount] = updatedShowInfo;

    res.status(200).json({
      success: true,
      message: 'Show automatically ended',
      action: 'ended',
      transaction: {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      },
      showInfo: {
        showId: updatedShowId.toString(),
        startTime: Number(updatedStartTime),
        endTime: Number(updatedEndTime),
        isActive: updatedIsActive,
        entryFee: ethers.formatEther(updatedEntryFee),
        totalPrize: ethers.formatEther(updatedTotalPrize),
        participantCount: Number(updatedParticipantCount)
      }
    });

  } catch (error) {
    console.error('Error checking show status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
}
