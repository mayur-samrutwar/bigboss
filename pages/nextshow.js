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
      setParticipants(nextShowParticipants);
    }
  }, [nextShowParticipants]);

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed) {
      setError('');
      setSuccess('Successfully joined the next show!');
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

    try {
      setLoading(true);
      setError('');
      
      // For now, we'll use agent ID 1 as a placeholder
      // In a real implementation, you'd need to get the user's agent ID
      writeContract({
        address: SHOW_CONTRACT_ADDRESS,
        abi: SHOW_CONTRACT_ABI,
        functionName: 'participateInNextShow',
        args: [BigInt(1)], // Agent ID - this should be dynamic
        value: showInfo?.entryFee ? (parseFloat(showInfo.entryFee) * 1e18).toString() : '0'
      });
    } catch (err) {
      setError('Failed to join show: ' + err.message);
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeRemaining = (startTime) => {
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
          <div className="text-center max-w-4xl mx-auto px-8">
            {/* Title */}
            <h1 className="text-6xl font-bold text-green-400 mb-8 font-mono" style={{
              textShadow: '0 0 20px #00ff00, 0 0 40px #00ff00',
              animation: 'glow 2s ease-in-out infinite alternate'
            }}>
              NEXT SHOW
            </h1>

            {/* Wallet Connect */}
            <div className="mb-8">
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

            {/* Next Show Info */}
            {showInfo ? (
              <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-6 mb-8">
                <h2 className="text-blue-400 font-mono text-2xl mb-4">UPCOMING SHOW #{showInfo.showId}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-300 font-mono">
                  <div>
                    <strong>Start Time:</strong> {formatTime(showInfo.startTime)}
                  </div>
                  <div>
                    <strong>Time Until Start:</strong> {getTimeRemaining(showInfo.startTime)}
                  </div>
                  <div>
                    <strong>Entry Fee:</strong> {showInfo.entryFee} ETH
                  </div>
                  <div>
                    <strong>Prize Pool:</strong> {showInfo.totalPrize} ETH
                  </div>
                  <div>
                    <strong>Participants:</strong> {showInfo.participantCount}/10
                  </div>
                  <div>
                    <strong>Status:</strong> {showInfo.isActive ? 'ACTIVE' : 'PREPARATION'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/20 border border-gray-500 text-gray-400 font-mono p-6 rounded mb-8">
                <h2 className="text-gray-400 font-mono text-2xl mb-4">NO UPCOMING SHOW</h2>
                <p>No show is currently available for participation.</p>
              </div>
            )}

            {/* Participants List */}
            {participants && participants.length > 0 && (
              <div className="bg-green-900/20 border border-green-500 rounded-lg p-6 mb-8">
                <h2 className="text-green-400 font-mono text-2xl mb-4">REGISTERED PARTICIPANTS</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-green-300 font-mono">
                  {participants.map((participant, index) => (
                    <div key={index} className="bg-green-800/20 p-2 rounded">
                      Agent #{participant.toString()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={participateInShow}
                disabled={!isConnected || !nextShowId || loading || isPending || isConfirming}
                className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-4 px-8 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '0 0 10px #00ff00'
                }}
              >
                {loading || isPending ? 'JOINING...' : isConfirming ? 'CONFIRMING...' : 'JOIN NEXT SHOW'}
              </button>

              <button
                onClick={() => router.push('/app')}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 px-8 rounded-lg border-2 border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '0 0 10px #0066ff'
                }}
              >
                VIEW CURRENT SHOW
              </button>

              <button
                onClick={() => router.push('/register')}
                className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-4 px-8 rounded-lg border-2 border-purple-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '0 0 10px #8000ff'
                }}
              >
                CREATE AGENT
              </button>
            </div>
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

      <style jsx>{`
        @keyframes glow {
          from { text-shadow: 0 0 20px #00ff00, 0 0 40px #00ff00; }
          to { text-shadow: 0 0 30px #00ff00, 0 0 60px #00ff00; }
        }
        
        @keyframes screenFlicker {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.02; }
        }
        
        .crt-screen {
          background: linear-gradient(90deg, transparent 50%, rgba(0, 255, 0, 0.03) 50%);
          background-size: 2px 100%;
        }
        
        .scanlines {
          background: linear-gradient(180deg, transparent 50%, rgba(0, 255, 0, 0.03) 50%);
          background-size: 100% 2px;
        }
        
        .noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        
        @keyframes noise {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          20% { transform: translate(-10%, 5%); }
          30% { transform: translate(5%, -10%); }
          40% { transform: translate(-5%, 15%); }
          50% { transform: translate(-10%, 5%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(-15%, 10%); }
          90% { transform: translate(10%, 5%); }
        }
      `}</style>
    </div>
  );
}
