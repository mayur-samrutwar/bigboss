import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import WalletConnect from '../components/WalletConnect';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../abi/ShowContract';

export default function Admin() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  
  const [showInfo, setShowInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [winnerAgentId, setWinnerAgentId] = useState('');
  const [killAgentId, setKillAgentId] = useState('');
  const [killShowId, setKillShowId] = useState('');

  // Contract read functions
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
  });

  const { data: contractOwner } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'owner',
  });

  const { data: isPaused } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'paused',
  });

  // Check if current user is admin
  const isAdmin = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();

  const startNewShow = async () => {
    if (!isAdmin) {
      setError('Only contract owner can start a new show');
      return;
    }

    try {
      writeContract({
        address: SHOW_CONTRACT_ADDRESS,
        abi: SHOW_CONTRACT_ABI,
        functionName: 'startShow',
      });
    } catch (err) {
      setError('Failed to start new show: ' + err.message);
    }
  };

  const beginShow = async () => {
    if (!isAdmin) {
      setError('Only contract owner can begin a show');
      return;
    }

    if (!nextShowId) {
      setError('No next show available to begin');
      return;
    }

    try {
      writeContract({
        address: SHOW_CONTRACT_ADDRESS,
        abi: SHOW_CONTRACT_ABI,
        functionName: 'beginShow',
      });
    } catch (err) {
      setError('Failed to begin show: ' + err.message);
    }
  };

  const endCurrentShow = async () => {
    if (!isAdmin) {
      setError('Only contract owner can end a show');
      return;
    }

    if (!winnerAgentId) {
      setError('Please enter a winner agent ID');
      return;
    }

    try {
      writeContract({
        address: SHOW_CONTRACT_ADDRESS,
        abi: SHOW_CONTRACT_ABI,
        functionName: 'endShow',
        args: [BigInt(winnerAgentId)],
      });
    } catch (err) {
      setError('Failed to end show: ' + err.message);
    }
  };

  const killAgent = async () => {
    if (!isAdmin) {
      setError('Only contract owner can kill an agent');
      return;
    }

    if (!killAgentId || !killShowId) {
      setError('Please enter both show ID and agent ID');
      return;
    }

    try {
      const response = await fetch('/api/killAgent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showId: killShowId,
          agentId: killAgentId
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Agent ${killAgentId} killed successfully in show ${killShowId}!`);
        setKillAgentId('');
        setKillShowId('');
      } else {
        setError(result.error || 'Failed to kill agent');
      }
    } catch (err) {
      setError('Failed to kill agent: ' + err.message);
    }
  };

  // Update show info when contract data changes
  useEffect(() => {
    if (currentShowData) {
      const [showId, startTime, endTime, isActive, entryFee, totalPrize, participantCount] = currentShowData;
      setShowInfo({
        showId: Number(showId),
        startTime: Number(startTime) * 1000, // Convert to milliseconds
        endTime: Number(endTime) * 1000,
        isActive,
        isEnded: false, // Current show is never ended
        entryFee: (Number(entryFee) / 1e18).toFixed(4), // Convert from wei to ETH
        totalPrize: (Number(totalPrize) / 1e18).toFixed(4),
        participantCount: Number(participantCount)
      });
    }
  }, [currentShowData]);

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed) {
      setError('');
      alert('Transaction confirmed successfully!');
    }
  }, [isConfirmed]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setError('Transaction failed: ' + writeError.message);
    }
  }, [writeError]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeRemaining = (endTime) => {
    const now = Date.now();
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Show has ended';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
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
          <div className="text-center max-w-4xl mx-auto px-8">
            {/* Title */}
            <div className="text-green-400 font-mono text-4xl mb-8 animate-pulse">
              ADMIN PANEL
            </div>
            
            {/* Wallet Connect */}
            <div className="mb-8">
              <WalletConnect />
            </div>

            {/* Admin Status */}
            {isConnected && (
              <div className="mb-6">
                {isAdmin ? (
                  <div className="bg-green-900/20 border border-green-500 text-green-400 font-mono p-4 rounded">
                    ✓ ADMIN ACCESS GRANTED
                  </div>
                ) : (
                  <div className="bg-red-900/20 border border-red-500 text-red-400 font-mono p-4 rounded">
                    ✗ ADMIN ACCESS DENIED - Only contract owner can perform admin actions
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 font-mono p-4 rounded mb-6">
                ERROR: {error}
              </div>
            )}

            {/* Current Show Info */}
            {showInfo && (
              <div className="bg-green-900/20 border border-green-500 rounded-lg p-6 mb-8">
                <h2 className="text-green-400 font-mono text-2xl mb-4">CURRENT SHOW STATUS</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <span className="text-green-300 font-mono">Show ID:</span>
                    <span className="text-green-400 font-mono ml-2">{showInfo.showId}</span>
                  </div>
                  
                  <div>
                    <span className="text-green-300 font-mono">Status:</span>
                    <span className={`font-mono ml-2 ${showInfo.isActive ? 'text-green-400' : 'text-red-400'}`}>
                      {showInfo.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-green-300 font-mono">Start Time:</span>
                    <span className="text-green-400 font-mono ml-2">{formatTime(showInfo.startTime)}</span>
                  </div>
                  
                  <div>
                    <span className="text-green-300 font-mono">End Time:</span>
                    <span className="text-green-400 font-mono ml-2">{formatTime(showInfo.endTime)}</span>
                  </div>
                  
                  <div>
                    <span className="text-green-300 font-mono">Time Remaining:</span>
                    <span className="text-green-400 font-mono ml-2">{getTimeRemaining(showInfo.endTime)}</span>
                  </div>
                  
                  <div>
                    <span className="text-green-300 font-mono">Entry Fee:</span>
                    <span className="text-green-400 font-mono ml-2">{showInfo.entryFee} ETH</span>
                  </div>
                  
                  <div>
                    <span className="text-green-300 font-mono">Total Prize:</span>
                    <span className="text-green-400 font-mono ml-2">{showInfo.totalPrize} ETH</span>
                  </div>
                  
                  <div>
                    <span className="text-green-300 font-mono">Participants:</span>
                    <span className="text-green-400 font-mono ml-2">{showInfo.participantCount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            <div className="space-y-4">
              <h2 className="text-green-400 font-mono text-2xl mb-6">ADMIN ACTIONS</h2>
              
              <div className="flex flex-col gap-6">
                {/* Start New Show Button */}
                <button
                  onClick={startNewShow}
                  disabled={!isAdmin || isPending || isConfirming || (showInfo && showInfo.isActive)}
                  className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-4 px-8 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
                  style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px #00ff00'
                  }}
                >
                  {isPending ? 'SENDING...' : isConfirming ? 'CONFIRMING...' : 'CREATE SHOW'}
                </button>

                {/* Begin Show Button */}
                <button
                  onClick={beginShow}
                  disabled={!isAdmin || !nextShowId || isPending || isConfirming}
                  className="bg-blue-500 hover:bg-blue-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg border-2 border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
                  style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px #0066ff'
                  }}
                >
                  {isPending ? 'SENDING...' : isConfirming ? 'CONFIRMING...' : 'START PLAYING'}
                </button>

                
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="mt-8 text-green-400 hover:text-green-300 font-mono text-sm underline transition-colors duration-300"
            >
              ← BACK
            </button>
          </div>
        </div>

        {/* Screen Flicker Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="w-full h-full bg-black opacity-0"
            style={{
              animation: 'screenFlicker 0.1s linear infinite'
            }}
          />
        </div>
      </div>

      {/* CRT Monitor Bezel - At edges of screen */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bezel */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-800 to-gray-900"></div>
        {/* Bottom Bezel */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-800 to-gray-900"></div>
        {/* Left Bezel */}
        <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-gray-800 to-gray-900"></div>
        {/* Right Bezel */}
        <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-gray-800 to-gray-900"></div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes noise {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-2px, -2px); }
          50% { transform: translate(2px, -2px); }
          75% { transform: translate(-2px, 2px); }
          100% { transform: translate(2px, 2px); }
        }
        
        @keyframes screenFlicker {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.05; }
        }
      `}</style>
    </div>
  );
}
