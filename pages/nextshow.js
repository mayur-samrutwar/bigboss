import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import WalletConnect from '../components/WalletConnect';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../lib/contract';

export default function NextShow() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const [showInfo, setShowInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userAgents, setUserAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // Contract read functions
  const { data: nextShowId } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'nextShowId',
  });

  const { data: nextShowData } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'getNextShow',
  });

  const { data: nextShowParticipants } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'getNextShowParticipants',
  });

  // Get user's agents
  const { data: userAgentIds } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'getUserAgents',
    args: address ? [address] : undefined,
  });

  // Update show info when contract data changes
  useEffect(() => {
    if (nextShowData) {
      const [showId, startTime, endTime, isActive, entryFee, totalPrize, participantCount] = nextShowData;
      setShowInfo({
        showId: Number(showId),
        startTime: Number(startTime) * 1000, // Convert to milliseconds
        endTime: Number(endTime) * 1000,
        isActive,
        isEnded: false,
        entryFee: (Number(entryFee) / 1e18).toFixed(4), // Convert from wei to ETH
        totalPrize: (Number(totalPrize) / 1e18).toFixed(4),
        participantCount: Number(participantCount)
      });
    }
  }, [nextShowData]);

  // Update participants when contract data changes
  useEffect(() => {
    if (nextShowParticipants) {
      const [agentIds, participantAddresses] = nextShowParticipants;
      setParticipants(agentIds.map((id, index) => ({
        agentId: id.toString(),
        address: participantAddresses[index]
      })));
    }
  }, [nextShowParticipants]);

  // Update user agents when contract data changes
  useEffect(() => {
    console.log('User agent IDs from contract:', userAgentIds);
    console.log('User address:', address);
    
    if (userAgentIds && userAgentIds.length > 0) {
      setUserAgents(userAgentIds.map(id => id.toString()));
      // Auto-select first agent if none selected
      if (!selectedAgentId && userAgentIds.length > 0) {
        setSelectedAgentId(userAgentIds[0].toString());
      }
    } else {
      setUserAgents([]);
      setSelectedAgentId('');
    }
  }, [userAgentIds, selectedAgentId]);

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed) {
      setError('');
      setSuccess('Successfully joined the next show!');
      setLoading(false);
      // Refresh participants
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [isConfirmed]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setError('Transaction failed: ' + writeError.message);
      setLoading(false);
    }
  }, [writeError]);

  const participateInShow = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!nextShowId) {
      setError('No next show available for participation');
      return;
    }

    if (!selectedAgentId || selectedAgentId === '') {
      setError('Please select an agent to participate');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      writeContract({
        address: SHOW_CONTRACT_ADDRESS,
        abi: SHOW_CONTRACT_ABI,
        functionName: 'participateInNextShow',
        args: [BigInt(selectedAgentId)],
        value: showInfo?.entryFee ? (parseFloat(showInfo.entryFee) * 1e18).toString() : '0'
      });
    } catch (err) {
      setError('Failed to join show: ' + err.message);
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp || timestamp === 0) return 'Not set';
    return new Date(timestamp).toLocaleString();
  };

  const getTimeRemaining = (startTime) => {
    if (!startTime || startTime === 0) return 'Not set';
    
    const now = Date.now();
    const remaining = startTime - now;
    
    if (remaining <= 0) return 'Show has started';
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="w-full min-h-screen bg-white p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Next Show</h1>
        
        {/* Wallet Connect */}
        <div className="mb-8">
          <WalletConnect />
        </div>

        {/* Debug Info */}
        {address && (
          <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded text-sm">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p><strong>Connected Address:</strong> {address}</p>
            <p><strong>User Agent IDs:</strong> {userAgentIds ? userAgentIds.map(id => id.toString()).join(', ') : 'Loading...'}</p>
            <p><strong>User Agents State:</strong> {userAgents.join(', ') || 'None'}</p>
            <p><strong>Selected Agent:</strong> {selectedAgentId || 'None'}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            ERROR: {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            SUCCESS: {success}
          </div>
        )}

        {/* Next Show Info */}
        {showInfo ? (
          <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Upcoming Show #{showInfo.showId}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Start Time:</span>
                <span className="ml-2">{formatTime(showInfo.startTime)}</span>
              </div>
              
              <div>
                <span className="font-medium">Time Until Start:</span>
                <span className="ml-2">{getTimeRemaining(showInfo.startTime)}</span>
              </div>
              
              <div>
                <span className="font-medium">Entry Fee:</span>
                <span className="ml-2">{showInfo.entryFee} ETH</span>
              </div>
              
              <div>
                <span className="font-medium">Prize Pool:</span>
                <span className="ml-2">{showInfo.totalPrize} ETH</span>
              </div>
              
              <div>
                <span className="font-medium">Participants:</span>
                <span className="ml-2">{showInfo.participantCount}/10</span>
              </div>
              
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 ${showInfo.isActive ? 'text-green-600' : 'text-yellow-600'}`}>
                  {showInfo.isActive ? 'ACTIVE' : 'PREPARATION'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">No Upcoming Show</h2>
            <p className="text-gray-600">No show is currently available for participation.</p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Next Show ID: {nextShowId || 'None'}</p>
            </div>
          </div>
        )}

        {/* Participants List */}
        {participants && participants.length > 0 && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Registered Participants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {participants.map((participant, index) => (
                <div key={index} className="bg-green-100 p-2 rounded">
                  Agent #{participant.agentId} - {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join Show Section */}
        {showInfo && (
          <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Join Next Show</h2>
            
            {userAgents.length > 0 ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Agent:
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">Choose an agent...</option>
                  {userAgents.map((agentId) => (
                    <option key={agentId} value={agentId}>
                      Agent #{agentId}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800">
                  <strong>No agents found!</strong> You need to create an agent first.
                </p>
                <button
                  onClick={() => router.push('/register')}
                  className="mt-2 bg-purple-500 hover:bg-purple-600 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Create Agent
                </button>
              </div>
            )}
            
            <button
              onClick={participateInShow}
              disabled={!isConnected || !nextShowId || !selectedAgentId || loading || isPending || isConfirming}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
            >
              {loading || isPending ? 'Joining...' : isConfirming ? 'Confirming...' : `Join Show (${showInfo.entryFee} ETH)`}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/app')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            View Current Show
          </button>

          <button
            onClick={() => router.push('/register')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
          >
            Create Agent
          </button>

          <button
            onClick={() => router.push('/admin')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
          >
            Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
}
