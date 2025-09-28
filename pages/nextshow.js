import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
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
        value: showInfo?.entryFee ? parseEther(showInfo.entryFee) : parseEther('0')
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
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-4 font-mono">
            NEXT SHOW
          </h1>
          <p className="text-gray-300 font-mono text-lg">Join the upcoming Big Boss competition</p>
        </div>
        
        {/* Wallet Connect */}
        <div className="mb-8 flex justify-center">
          <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
            <WalletConnect />
          </div>
        </div>

        {/* Debug Info */}
        {address && (
          <div className="mb-8 p-6 bg-black/20 backdrop-blur-sm border border-blue-500/30 rounded-lg text-sm font-mono">
            <h3 className="text-blue-400 font-semibold mb-4 text-lg">DEBUG INFO</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
              <div><span className="text-purple-400">Connected Address:</span> {address}</div>
              <div><span className="text-purple-400">User Agent IDs:</span> {userAgentIds ? userAgentIds.map(id => id.toString()).join(', ') : 'Loading...'}</div>
              <div><span className="text-purple-400">User Agents State:</span> {userAgents.join(', ') || 'None'}</div>
              <div><span className="text-purple-400">Selected Agent:</span> {selectedAgentId || 'None'}</div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-6 bg-red-900/20 backdrop-blur-sm border border-red-500/50 text-red-300 rounded-lg font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-red-400 text-xl">⚠</span>
              <span className="text-red-400 font-bold">ERROR:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-8 p-6 bg-green-900/20 backdrop-blur-sm border border-green-500/50 text-green-300 rounded-lg font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-green-400 text-xl">✓</span>
              <span className="text-green-400 font-bold">SUCCESS:</span>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Next Show Info */}
        {showInfo ? (
          <div className="mb-8 p-8 bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-lg">
            <h2 className="text-3xl font-bold text-purple-400 mb-6 font-mono">UPCOMING SHOW #{showInfo.showId}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <div className="text-purple-300 font-mono text-sm mb-1">START TIME</div>
                <div className="text-white font-mono text-lg">{formatTime(showInfo.startTime)}</div>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="text-blue-300 font-mono text-sm mb-1">TIME UNTIL START</div>
                <div className="text-white font-mono text-lg">{getTimeRemaining(showInfo.startTime)}</div>
              </div>
              
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="text-green-300 font-mono text-sm mb-1">ENTRY FEE</div>
                <div className="text-white font-mono text-lg">{showInfo.entryFee} ETH</div>
              </div>
              
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-yellow-300 font-mono text-sm mb-1">PRIZE POOL</div>
                <div className="text-white font-mono text-lg">{showInfo.totalPrize} ETH</div>
              </div>
              
              <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                <div className="text-cyan-300 font-mono text-sm mb-1">PARTICIPANTS</div>
                <div className="text-white font-mono text-lg">{showInfo.participantCount}/10</div>
              </div>
              
              <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4">
                <div className="text-pink-300 font-mono text-sm mb-1">STATUS</div>
                <div className={`font-mono text-lg ${showInfo.isActive ? 'text-green-400' : 'text-yellow-400'}`}>
                  {showInfo.isActive ? 'ACTIVE' : 'PREPARATION'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-8 bg-black/20 backdrop-blur-sm border border-gray-500/30 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-400 mb-4 font-mono">NO UPCOMING SHOW</h2>
            <p className="text-gray-300 font-mono">No show is currently available for participation.</p>
            <div className="mt-4 text-sm text-gray-400 font-mono">
              <p>Next Show ID: {nextShowId || 'None'}</p>
            </div>
          </div>
        )}

        {/* Participants List */}
        {participants && participants.length > 0 && (
          <div className="mb-8 p-8 bg-black/20 backdrop-blur-sm border border-green-500/30 rounded-lg">
            <h2 className="text-3xl font-bold text-green-400 mb-6 font-mono">REGISTERED PARTICIPANTS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participants.map((participant, index) => (
                <div key={index} className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 hover:bg-green-900/30 transition-all duration-300">
                  <div className="text-green-300 font-mono text-sm mb-1">AGENT #{participant.agentId}</div>
                  <div className="text-white font-mono text-xs">{participant.address.slice(0, 6)}...{participant.address.slice(-4)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join Show Section */}
        {showInfo && (
          <div className="mb-8 p-8 bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-lg">
            <h2 className="text-3xl font-bold text-purple-400 mb-6 font-mono">JOIN NEXT SHOW</h2>
            
            {userAgents.length > 0 ? (
              <div className="mb-6">
                <label className="block text-purple-300 font-mono text-lg mb-3">
                  SELECT YOUR AGENT:
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full p-4 bg-black/40 border border-purple-500/50 rounded-lg text-white font-mono focus:border-purple-400 focus:outline-none"
                >
                  <option value="" className="bg-black text-white">Choose an agent...</option>
                  {userAgents.map((agentId) => (
                    <option key={agentId} value={agentId} className="bg-black text-white">
                      Agent #{agentId}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-6 p-6 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
                <p className="text-yellow-300 font-mono">
                  <strong className="text-yellow-400">NO AGENTS FOUND!</strong> You need to create an agent first.
                </p>
                <button
                  onClick={() => router.push('/register')}
                  className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 font-mono"
                >
                  CREATE AGENT
                </button>
              </div>
            )}
            
            <button
              onClick={participateInShow}
              disabled={!isConnected || !nextShowId || !selectedAgentId || loading || isPending || isConfirming}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 font-mono text-lg"
            >
              {loading || isPending ? 'JOINING...' : isConfirming ? 'CONFIRMING...' : `JOIN SHOW (${showInfo.entryFee} ETH)`}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12">
          <button
            onClick={() => router.push('/app')}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 font-mono text-lg shadow-lg hover:shadow-blue-500/50"
          >
            VIEW CURRENT SHOW
          </button>

          <button
            onClick={() => router.push('/register')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 font-mono text-lg shadow-lg hover:shadow-purple-500/50"
          >
            CREATE AGENT
          </button>

          <button
            onClick={() => router.push('/admin')}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 font-mono text-lg shadow-lg hover:shadow-orange-500/50"
          >
            ADMIN PANEL
          </button>
        </div>
      </div>
    </div>
  );
}
