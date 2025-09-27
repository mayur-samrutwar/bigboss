import { useState, useEffect } from 'react';

const WinnerPopup = ({ isOpen, onClose, winnerData }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setConfettiActive(true);
      // Stop confetti after 3 seconds
      const timer = setTimeout(() => {
        setConfettiActive(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setConfettiActive(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Confetti Animation */}
      {confettiActive && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)],
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Popup Content */}
      <div 
        className={`relative bg-gradient-to-br from-yellow-900/95 to-gold-900/95 border-4 border-yellow-400 rounded-3xl p-10 max-w-lg mx-4 transform transition-all duration-700 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
        style={{
          boxShadow: '0 0 80px rgba(255, 215, 0, 0.6), inset 0 0 30px rgba(255, 215, 0, 0.2)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-yellow-400 hover:text-yellow-300 font-mono text-3xl transition-colors"
        >
          ×
        </button>

        {/* Winner Character Display */}
        <div className="text-center mb-8">
          {/* Character Avatar */}
          <div className="relative mb-6">
            <div 
              className="w-32 h-32 mx-auto rounded-full border-4 border-yellow-400 flex items-center justify-center bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-2xl"
              style={{
                boxShadow: '0 0 40px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 215, 0, 0.3)'
              }}
            >
              <span className="text-yellow-200 font-mono text-4xl font-bold">
                {winnerData?.characterName ? winnerData.characterName.charAt(winnerData.characterName.length - 1) : '👑'}
              </span>
            </div>
            
            {/* Crown Icon */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-4xl animate-pulse">
              👑
            </div>
          </div>

          {/* Winner Title */}
          <div className="mb-4">
            <div className="text-yellow-400 font-mono text-4xl font-bold mb-2 tracking-wider animate-pulse">
              🏆 WINNER! 🏆
            </div>
            <div className="w-full h-2 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full mb-4"></div>
          </div>

          {/* Winner Name */}
          <div className="bg-black/50 border-2 border-yellow-500/70 rounded-xl p-6 mb-6">
            <div className="text-yellow-300 font-mono text-2xl font-bold mb-2">
              {winnerData?.characterName || 'Agent #1'}
            </div>
            <div className="text-yellow-400 font-mono text-lg">
              {winnerData?.agentId ? `Agent #${winnerData.agentId}` : 'The Champion'}
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="flex justify-center space-x-4 mb-6">
          <div className="text-2xl animate-bounce">🎉</div>
          <div className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎊</div>
          <div className="text-2xl animate-bounce" style={{ animationDelay: '0.4s' }}>🎈</div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-bold py-4 px-10 rounded-xl border-2 border-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/50"
            style={{
              fontFamily: 'monospace',
              textShadow: '0 0 10px #FFD700',
              fontSize: '18px'
            }}
          >
            CELEBRATE!
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerPopup;
