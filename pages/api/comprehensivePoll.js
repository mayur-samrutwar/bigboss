import { ethers } from 'ethers';
import { SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI } from '../../lib/contract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { showId, autoEndShow = false, executeAiAction = false } = req.body;

  // Validate input
  if (!showId) {
    return res.status(400).json({ 
      error: 'Missing required parameter: showId is required' 
    });
  }

  try {
    console.log(`🔄 Comprehensive polling for show ${showId}...`);
    
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
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, wallet);
    
    // Get current show
    const currentShowId = await contract.currentShowId();
    console.log('📺 Current show ID:', currentShowId.toString());
    
    if (currentShowId.toString() !== showId) {
      return res.status(400).json({
        success: false,
        error: `Show ${showId} is not the current active show`,
        currentShowId: currentShowId.toString()
      });
    }
    
    // Get show details
    const showData = await contract.getCurrentShow();
    const [showIdFromContract, startTime, endTime, isActive, entryFee, totalPrize, participantCount] = showData;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const showEndTime = Number(endTime);
    const timeRemaining = Math.max(0, showEndTime - currentTime);
    const timeHasPassed = currentTime >= showEndTime;
    
    console.log('📊 Show details:', {
      showId: showIdFromContract.toString(),
      isActive,
      participantCount: Number(participantCount),
      endTime: new Date(showEndTime * 1000).toISOString(),
      currentTime: new Date(currentTime * 1000).toISOString(),
      timeRemaining: `${Math.floor(timeRemaining / 60)}m ${timeRemaining % 60}s`,
      timeHasPassed
    });
    
    let result = {
      success: true,
      showId: showIdFromContract.toString(),
      isActive,
      timeRemaining,
      timeHasPassed,
      participantCount: Number(participantCount),
      actions: []
    };
    
    // 1. Check if show should be auto-ended
    if (autoEndShow && timeHasPassed && isActive) {
      console.log('⏰ Auto-ending show - time has passed');
      
      try {
        const tx = await contract.checkStatus(BigInt(showId));
        const receipt = await tx.wait();
        
        result.actions.push({
          type: 'show_ended',
          success: true,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        });
        
        console.log('✅ Show auto-ended successfully:', tx.hash);
        
        // Update show status after ending
        const updatedShowData = await contract.getCurrentShow();
        const [, , , updatedIsActive] = updatedShowData;
        result.isActive = updatedIsActive;
        
      } catch (txError) {
        console.error('❌ Error auto-ending show:', txError.message);
        result.actions.push({
          type: 'show_ended',
          success: false,
          error: txError.message
        });
      }
    }
    
    // 2. Execute AI action if show is still active and conditions are met
    if (executeAiAction && result.isActive && !timeHasPassed) {
      console.log('🤖 Executing AI action...');
      
      try {
        const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pollAiActions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            showId: showId,
            executeAction: true
          })
        });
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          
          if (aiData.success) {
            result.actions.push({
              type: 'ai_action',
              success: true,
              action: aiData.aiDecision?.action,
              parameters: aiData.aiDecision?.parameters,
              message: aiData.message
            });
            
            console.log('✅ AI action executed:', aiData.aiDecision?.action);
          } else {
            result.actions.push({
              type: 'ai_action',
              success: false,
              error: aiData.error || aiData.message,
              retry: aiData.retry || false
            });
            
            console.log('❌ AI action failed:', aiData.error || aiData.message);
          }
        } else {
          const errorData = await aiResponse.json();
          result.actions.push({
            type: 'ai_action',
            success: false,
            error: errorData.error || 'AI action API failed',
            retry: true
          });
          
          console.log('❌ AI action API failed:', errorData.error);
        }
        
      } catch (aiError) {
        console.error('❌ Error executing AI action:', aiError.message);
        result.actions.push({
          type: 'ai_action',
          success: false,
          error: aiError.message,
          retry: true
        });
      }
    }
    
    // 3. Determine overall status
    if (result.actions.some(action => action.type === 'show_ended' && action.success)) {
      result.status = 'ended';
      result.message = 'Show has been automatically ended';
    } else if (result.actions.some(action => action.type === 'ai_action' && action.success && action.action)) {
      result.status = 'ai_action_executed';
      result.message = 'AI action has been executed';
    } else if (result.actions.some(action => action.type === 'ai_action' && !action.success && action.retry)) {
      result.status = 'ai_action_retry_needed';
      result.message = 'AI action failed, retry needed';
    } else if (result.actions.some(action => action.type === 'ai_action' && !action.success)) {
      result.status = 'ai_action_skipped';
      result.message = 'AI action skipped or failed';
    } else if (!result.isActive) {
      result.status = 'inactive';
      result.message = 'Show is not active';
    } else if (timeHasPassed) {
      result.status = 'time_expired';
      result.message = 'Show time has expired but not auto-ended';
    } else {
      result.status = 'monitoring';
      result.message = 'Show is being monitored';
    }
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ Error in comprehensive polling:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to process comprehensive polling',
      details: error.message,
      showId: showId
    });
  }
}
