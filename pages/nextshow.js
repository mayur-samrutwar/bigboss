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
    <div className="relative w-full h-screen bg-black">
      {/* CRT Monitor Screen - Full Screen */}
      <div className="relative w-full h-full bg-black overflow-hidden crt-screen">
        {/* CRT Scanlines */}
        <div className="absolute inset-0 scanlines"></div>
        
        {/* Heavy Noise Texture */}
        <div className="absolute inset-0 noise"></div>

        {/* Dense Noise Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(800)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 2 + 0.5}px`,
                height: `${Math.random() * 2 + 0.5}px`,
                opacity: Math.random() * 0.9 + 0.1,
                animation: `noise ${Math.random() * 0.3 + 0.05}s linear infinite`
              }}
            />
          ))}
        </div>

        {/* Content Area */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <div className="text-center max-w-lg mx-auto px-8">
            {/* Title */}
            <div className="text-green-400 font-mono text-3xl mb-8 animate-pulse">
              JOIN NEXT SHOW
            </div>
            
            {/* Wallet Connect */}
            <div className="mb-6">
              <WalletConnect />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 font-mono p-4 rounded mb-6">
                ERROR: {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-900/20 border border-green-500 text-green-400 font-mono p-4 rounded mb-6">
                SUCCESS: {success}
              </div>
            )}

            {/* Show Info */}
            {showInfo ? (
              <div className="space-y-6">
                {/* Show Info Card */}
                <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6">
                  <h3 className="text-green-400 font-mono text-lg mb-3">CURRENT SHOW</h3>
                  <div className="text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-300 font-mono text-sm">Show ID:</span>
                      <span className="text-green-400 font-mono text-sm">{showInfo.showId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-300 font-mono text-sm">Entry Fee:</span>
                      <span className="text-green-400 font-mono text-sm">{showInfo.entryFee} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-300 font-mono text-sm">Total Prize:</span>
                      <span className="text-green-400 font-mono text-sm">{showInfo.totalPrize} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-300 font-mono text-sm">Participants:</span>
                      <span className="text-green-400 font-mono text-sm">{showInfo.participantCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-300 font-mono text-sm">Status:</span>
                      <span className={`font-mono text-sm ${showInfo.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {showInfo.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Agent Selection */}
                {userAgents.length > 0 ? (
                  <div className="text-left">
                    <label className="block text-green-400 font-mono text-sm mb-2">
                      SELECT YOUR AGENT:
                    </label>
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="w-full bg-black border-2 border-green-500 text-green-400 font-mono px-4 py-3 rounded-lg focus:border-green-400 focus:outline-none transition-colors duration-300"
                      style={{
                        textShadow: '0 0 10px #00ff00'
                      }}
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
                  <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                    <p className="text-yellow-300 font-mono text-sm">
                      <strong className="text-yellow-400">NO AGENTS FOUND!</strong> You need to create an agent first.
                    </p>
                    <button
                      onClick={() => router.push('/register')}
                      className="mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg border-2 border-yellow-300 transition-all duration-300 transform hover:scale-105"
                      style={{
                        fontFamily: 'monospace',
                        textShadow: '0 0 10px #ffff00'
                      }}
                    >
                      CREATE AGENT
                    </button>
                  </div>
                )}

                {/* Join Show Button */}
                <button
                  onClick={participateInShow}
                  disabled={!isConnected || !nextShowId || !selectedAgentId || loading || isPending || isConfirming}
                  className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg border-2 border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
                  style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px #0066ff'
                  }}
                >
                  {loading || isPending ? 'JOINING...' : isConfirming ? 'CONFIRMING...' : 'JOIN SHOW'}
                </button>
              </div>
            ) : (
              <div className="bg-gray-900/20 border border-gray-500 rounded-lg p-4">
                <h3 className="text-gray-400 font-mono text-lg mb-2">NO UPCOMING SHOW</h3>
                <p className="text-gray-300 font-mono text-sm">No show is currently available for participation.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 mt-8">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
