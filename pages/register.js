import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import WalletConnect from '../components/WalletConnect';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../abi/ShowContract';

export default function Register() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const [formData, setFormData] = useState({
    name: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1: Register Agent, 2: Join Show
  const [agentId, setAgentId] = useState(null);
  const [showInfo, setShowInfo] = useState(null);

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

  const { data: userAgents } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'getUserAgents',
    args: address ? [address] : undefined,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const registerAgent = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please enter a name for your agent');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Contract will generate random traits automatically
      writeContract({
        address: SHOW_CONTRACT_ADDRESS,
        abi: SHOW_CONTRACT_ABI,
        functionName: 'registerAgent',
        args: [formData.name],
      });
    } catch (err) {
      setError('Failed to register agent: ' + err.message);
      setLoading(false);
    }
  };

  const participateInShow = async () => {
    if (!agentId || !nextShowId) {
      setError('No agent selected or no next show available');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get entry fee from show data
      const entryFee = nextShowData ? nextShowData.entryFee : BigInt('10000000000000000'); // 0.01 ETH default
      
      writeContract({
        address: SHOW_CONTRACT_ADDRESS,
        abi: SHOW_CONTRACT_ABI,
        functionName: 'participateInNextShow',
        args: [BigInt(agentId)],
        value: entryFee,
      });
    } catch (err) {
      setError('Failed to join show: ' + err.message);
      setLoading(false);
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && step === 1) {
      setSuccess('Agent registered successfully!');
      setStep(2);
      setLoading(false);
    } else if (isConfirmed && step === 2) {
      setSuccess('Successfully joined the show!');
      setTimeout(() => {
        router.push('/app');
      }, 2000);
    }
  }, [isConfirmed, step, router]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setError('Transaction failed: ' + writeError.message);
      setLoading(false);
    }
  }, [writeError]);

  // Update show info when contract data changes
  useEffect(() => {
    if (nextShowData) {
      const [showId, startTime, endTime, isActive, entryFee, totalPrize, participantCount] = nextShowData;
      setShowInfo({
        showId: Number(showId),
        startTime: Number(startTime) * 1000,
        endTime: Number(endTime) * 1000,
        isActive,
        entryFee: (Number(entryFee) / 1e18).toFixed(4),
        totalPrize: (Number(totalPrize) / 1e18).toFixed(4),
        participantCount: Number(participantCount)
      });
    }
  }, [nextShowData]);

  // Set agent ID when user agents are loaded
  useEffect(() => {
    if (userAgents && userAgents.length > 0) {
      setAgentId(userAgents[userAgents.length - 1].toString()); // Use latest agent
    }
  }, [userAgents]);

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
              {step === 1 ? 'CREATE AGENT' : 'JOIN SHOW'}
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

            {/* Step 1: Agent Registration */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Name Input */}
                <div className="text-left">
                  <label className="block text-green-400 font-mono text-sm mb-2">
                    AGENT NAME:
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black border-2 border-green-500 text-green-400 font-mono px-4 py-3 rounded-lg focus:border-green-400 focus:outline-none transition-colors duration-300"
                    style={{
                      textShadow: '0 0 10px #00ff00'
                    }}
                    placeholder="Agent Name"
                  />
                </div>

                {/* Info about random traits */}
                <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                  <h4 className="text-blue-400 font-mono text-sm mb-2">RANDOM TRAITS</h4>
                  <p className="text-blue-300 font-mono text-xs">
                    Your agent will receive randomly generated traits using Flow's secure VRF:
                  </p>
                  <ul className="text-blue-300 font-mono text-xs mt-2 space-y-1">
                    <li>• Popularity: 30-80</li>
                    <li>• Aggression: 20-70</li>
                    <li>• Loyalty: 40-90</li>
                    <li>• Resilience: 30-85</li>
                    <li>• Charisma: 25-90</li>
                    <li>• Suspicion: 10-60</li>
                    <li>• Energy: 60-100</li>
                  </ul>
                </div>

                {/* Register Button */}
                <button
                  onClick={registerAgent}
                  disabled={!isConnected || loading || isPending || isConfirming}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-4 px-8 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
                  style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px #00ff00'
                  }}
                >
                  {loading || isPending ? 'REGISTERING...' : isConfirming ? 'CONFIRMING...' : 'CREATE AGENT'}
                </button>
              </div>
            )}

            {/* Step 2: Join Show */}
            {step === 2 && showInfo && (
              <div className="space-y-6">
                {/* Show Info */}
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
                {agentId && (
                  <div className="text-left">
                    <label className="block text-green-400 font-mono text-sm mb-2">
                      SELECTED AGENT:
                    </label>
                    <div className="bg-green-900/20 border border-green-500 text-green-400 font-mono px-4 py-3 rounded-lg">
                      Agent ID: {agentId}
                    </div>
                  </div>
                )}

                {/* Join Show Button */}
                <button
                  onClick={participateInShow}
                  disabled={!isConnected || !showInfo?.isActive || !nextShowId || loading || isPending || isConfirming}
                  className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg border-2 border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
                  style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px #0066ff'
                  }}
                >
                  {loading || isPending ? 'JOINING...' : isConfirming ? 'CONFIRMING...' : 'JOIN SHOW'}
                </button>
              </div>
            )}

            {/* No Next Show Message */}
            {step === 2 && (!showInfo || !showInfo.isActive || !nextShowId) && (
              <div className="space-y-6">
                <div className="bg-red-900/20 border border-red-500 text-red-400 font-mono p-4 rounded">
                  NO SHOW AVAILABLE FOR PARTICIPATION
                </div>
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-lg border-2 border-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/50"
                  style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px #ffff00'
                  }}
                >
                  GO TO ADMIN PANEL
                </button>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="mt-6 text-green-400 hover:text-green-300 font-mono text-sm underline transition-colors duration-300"
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
