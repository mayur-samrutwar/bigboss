import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import WalletConnect from '../components/WalletConnect';

export default function Admin() {
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock contract interaction - replace with actual contract calls
  const getCurrentShow = async () => {
    // This would be replaced with actual contract call
    // const contract = new ethers.Contract(contractAddress, abi, provider);
    // const show = await contract.getCurrentShow();
    
    // Mock data for now
    return {
      showId: 1,
      startTime: Date.now() - 1000000, // 16 minutes ago
      endTime: Date.now() + 1000000,   // 14 minutes from now
      isActive: true,
      entryFee: '0.01',
      totalPrize: '0.05',
      participantCount: 3
    };
  };

  const startNewShow = async () => {
    setLoading(true);
    setError('');
    
    try {
      // This would be replaced with actual contract call
      // const contract = new ethers.Contract(contractAddress, abi, signer);
      // const tx = await contract.startShow();
      // await tx.wait();
      
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('New show started successfully!');
      
      // Refresh show info
      const show = await getCurrentShow();
      setShowInfo(show);
    } catch (err) {
      setError('Failed to start new show: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const endCurrentShow = async () => {
    setLoading(true);
    setError('');
    
    try {
      // This would be replaced with actual contract call
      // const contract = new ethers.Contract(contractAddress, abi, signer);
      // const tx = await contract.endShow(winnerAgentId);
      // await tx.wait();
      
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Show ended successfully!');
      
      // Refresh show info
      const show = await getCurrentShow();
      setShowInfo(show);
    } catch (err) {
      setError('Failed to end show: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadShowInfo = async () => {
      try {
        const show = await getCurrentShow();
        setShowInfo(show);
      } catch (err) {
        setError('Failed to load show info: ' + err.message);
      }
    };
    
    loadShowInfo();
  }, []);

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
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Start New Show Button */}
                <button
                  onClick={startNewShow}
                  disabled={loading || (showInfo && showInfo.isActive)}
                  className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-4 px-8 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
                  style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px #00ff00'
                  }}
                >
                  {loading ? 'PROCESSING...' : 'START NEW SHOW'}
                </button>

                {/* End Current Show Button */}
                <button
                  onClick={endCurrentShow}
                  disabled={loading || !showInfo || !showInfo.isActive}
                  className="bg-red-500 hover:bg-red-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg border-2 border-red-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/50"
                  style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px #ff0000'
                  }}
                >
                  {loading ? 'PROCESSING...' : 'END CURRENT SHOW'}
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
