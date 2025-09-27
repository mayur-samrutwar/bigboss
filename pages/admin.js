import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter } from 'next/router';
import WalletConnect from '../components/WalletConnect';
import { SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI } from '../lib/contract';

export default function Admin() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  // Contract read hooks
  const { data: contractOwner } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'owner',
  });

  const { data: currentShowId } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'currentShowId',
  });

  const { data: nextShowId } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'nextShowId',
  });

  const { data: currentShowData } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'getCurrentShow',
  });

  const { data: nextShowData } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'getNextShow',
    args: nextShowId ? [nextShowId] : undefined,
  });

  // Contract write hooks
  const { writeContract, isPending, isConfirming, error, data: hash } = useWriteContract();
  const { isConfirmed } = useWaitForTransactionReceipt({
    hash: hash,
  });

  // Refresh data when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      // Force a page refresh to get updated data
      window.location.reload();
    }
  }, [isConfirmed]);

  // State
  const [showInfo, setShowInfo] = useState(null);
  const [winnerAgentId, setWinnerAgentId] = useState('');
  const [killShowId, setKillShowId] = useState('');
  const [killAgentId, setKillAgentId] = useState('');

  // Check if user is admin
  const isAdmin = isConnected && address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();

  // Update show info when data changes
  useEffect(() => {
    console.log('Current show data:', currentShowData);
    console.log('Current show ID:', currentShowId);
    console.log('Next show ID:', nextShowId);
    
    if (currentShowData) {
      const showData = {
        showId: Number(currentShowData[0]),
        startTime: Number(currentShowData[1]) * 1000,
        endTime: Number(currentShowData[2]) * 1000,
        isActive: currentShowData[3],
        entryFee: (Number(currentShowData[4]) / 1e18).toFixed(4),
        totalPrize: (Number(currentShowData[5]) / 1e18).toFixed(4),
        participantCount: Number(currentShowData[6])
      };
      console.log('Processed show data:', showData);
      setShowInfo(showData);
    } else {
      setShowInfo(null);
    }
  }, [currentShowData, currentShowId, nextShowId]);

  // Contract functions
  const startNewShow = async () => {
    try {
      await writeContract({
        address: SHOW_CONTRACT_ADDRESS,
        abi: SHOW_CONTRACT_ABI,
        functionName: 'startShow',
      });
    } catch (err) {
      console.error('Error starting new show:', err);
    }
  };

  const beginShow = async () => {
    try {
      await writeContract({
        address: SHOW_CONTRACT_ADDRESS,
        abi: SHOW_CONTRACT_ABI,
        functionName: 'beginShow',
      });
    } catch (err) {
      console.error('Error beginning show:', err);
    }
  };

  const endCurrentShow = async () => {
    if (!winnerAgentId || !currentShowId) return;
    
    try {
      await writeContract({
        address: SHOW_CONTRACT_ADDRESS,
        abi: SHOW_CONTRACT_ABI,
        functionName: 'endShow',
        args: [currentShowId, BigInt(winnerAgentId)],
      });
    } catch (err) {
      console.error('Error ending show:', err);
    }
  };

  const killAgent = async () => {
    if (!killAgentId || !killShowId) return;
    
    try {
      await writeContract({
        address: SHOW_CONTRACT_ADDRESS,
        abi: SHOW_CONTRACT_ABI,
        functionName: 'killAgent',
        args: [BigInt(killShowId), BigInt(killAgentId)],
      });
    } catch (err) {
      console.error('Error killing agent:', err);
    }
  };

  // Utility functions
  const formatTime = (timestamp) => {
    if (!timestamp || timestamp === 0) return 'Not set';
    return new Date(timestamp).toLocaleString();
  };

  const getTimeRemaining = (endTime) => {
    if (!endTime || endTime === 0) return 'Not set';
    
    const now = Date.now();
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Ended';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="w-full min-h-screen bg-white p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Panel</h1>
        
        {/* Wallet Connect */}
        <div className="mb-8">
          <WalletConnect />
        </div>

        {/* Debug Info */}
        {isConnected && (
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p>Connected Address: {address || 'Not connected'}</p>
            <p>Contract Owner: {contractOwner || 'Loading...'}</p>
            <p>Is Admin: {isAdmin ? 'YES' : 'NO'}</p>
            <p>Contract Address: {SHOW_CONTRACT_ADDRESS}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Refresh Data
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            ERROR: {error.message}
          </div>
        )}

        {/* Current Show Info */}
        {showInfo ? (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Current Show Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Show ID:</span>
                <span className="ml-2">{showInfo.showId}</span>
              </div>
              
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 ${showInfo.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {showInfo.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              
              <div>
                <span className="font-medium">Start Time:</span>
                <span className="ml-2">{formatTime(showInfo.startTime)}</span>
              </div>
              
              <div>
                <span className="font-medium">End Time:</span>
                <span className="ml-2">{formatTime(showInfo.endTime)}</span>
              </div>
              
              <div>
                <span className="font-medium">Time Remaining:</span>
                <span className="ml-2">{getTimeRemaining(showInfo.endTime)}</span>
              </div>
              
              <div>
                <span className="font-medium">Entry Fee:</span>
                <span className="ml-2">{showInfo.entryFee} ETH</span>
              </div>
              
              <div>
                <span className="font-medium">Total Prize:</span>
                <span className="ml-2">{showInfo.totalPrize} ETH</span>
              </div>
              
              <div>
                <span className="font-medium">Participants:</span>
                <span className="ml-2">{showInfo.participantCount}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">No Current Show</h2>
            <p className="text-gray-600">No active show is currently running.</p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Current Show ID: {currentShowId || 'None'}</p>
              <p>Next Show ID: {nextShowId || 'None'}</p>
            </div>
          </div>
        )}

        {/* Next Show Info */}
        {nextShowData && (
          <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Next Show Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Show ID:</span>
                <span className="ml-2">{Number(nextShowData[0])}</span>
              </div>
              
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 ${nextShowData[3] ? 'text-green-600' : 'text-yellow-600'}`}>
                  {nextShowData[3] ? 'ACTIVE' : 'PREPARATION'}
                </span>
              </div>
              
              <div>
                <span className="font-medium">Start Time:</span>
                <span className="ml-2">{formatTime(Number(nextShowData[1]) * 1000)}</span>
              </div>
              
              <div>
                <span className="font-medium">End Time:</span>
                <span className="ml-2">{formatTime(Number(nextShowData[2]) * 1000)}</span>
              </div>
              
              <div>
                <span className="font-medium">Entry Fee:</span>
                <span className="ml-2">{(Number(nextShowData[4]) / 1e18).toFixed(4)} ETH</span>
              </div>
              
              <div>
                <span className="font-medium">Participants:</span>
                <span className="ml-2">{Number(nextShowData[6])}</span>
              </div>
            </div>
          </div>
        )}

        {/* Admin Actions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Admin Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start New Show */}
            <div className="p-4 border border-gray-200 rounded">
              <h3 className="font-semibold mb-2">Start New Show</h3>
              <p className="text-sm text-gray-600 mb-4">Create a new show for participants to join.</p>
              <button
                onClick={startNewShow}
                disabled={!isAdmin || isPending || isConfirming}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
              >
                {isPending ? 'Creating...' : isConfirming ? 'Confirming...' : 'Create Show'}
              </button>
            </div>

            {/* Begin Show */}
            <div className="p-4 border border-gray-200 rounded">
              <h3 className="font-semibold mb-2">Start Playing</h3>
              <p className="text-sm text-gray-600 mb-4">Begin the next show (make it active).</p>
              <button
                onClick={beginShow}
                disabled={!isAdmin || !nextShowId || isPending || isConfirming}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
              >
                {isPending ? 'Starting...' : isConfirming ? 'Confirming...' : 'Start Playing'}
              </button>
            </div>

            {/* End Current Show */}
            <div className="p-4 border border-gray-200 rounded">
              <h3 className="font-semibold mb-2">End Current Show</h3>
              <p className="text-sm text-gray-600 mb-4">End the current show and set winner.</p>
              <div className="mb-4">
                <input
                  type="number"
                  placeholder="Winner Agent ID"
                  value={winnerAgentId}
                  onChange={(e) => setWinnerAgentId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <button
                onClick={endCurrentShow}
                disabled={!isAdmin || !winnerAgentId || isPending || isConfirming}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
              >
                {isPending ? 'Ending...' : isConfirming ? 'Confirming...' : 'End Show'}
              </button>
            </div>

            {/* Kill Agent */}
            <div className="p-4 border border-gray-200 rounded">
              <h3 className="font-semibold mb-2">Kill Agent</h3>
              <p className="text-sm text-gray-600 mb-4">Remove an agent from a show.</p>
              <div className="mb-4 space-y-2">
                <input
                  type="number"
                  placeholder="Show ID"
                  value={killShowId}
                  onChange={(e) => setKillShowId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  placeholder="Agent ID"
                  value={killAgentId}
                  onChange={(e) => setKillAgentId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <button
                onClick={killAgent}
                disabled={!isAdmin || !killAgentId || !killShowId}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
              >
                Kill Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}