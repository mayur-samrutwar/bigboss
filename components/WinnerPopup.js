import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

const WinnerPopup = ({ isOpen, onClose, winnerData }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setConfettiActive(true);
      
      // Set window dimensions for confetti
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // Stop confetti after 4 seconds
      const timer = setTimeout(() => {
        setConfettiActive(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setConfettiActive(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      
      {/* Confetti */}
      {confettiActive && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <div 
        className={`relative bg-white/95 border border-yellow-500 rounded-lg p-10 max-w-lg mx-4 transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-yellow-600 hover:text-yellow-500 font-mono text-xl transition-colors"
        >
          ×
        </button>

        {/* Winner Title - Top */}
        <div className="text-center mb-6">
          <div className="text-yellow-600 font-mono text-2xl font-bold">
            🏆 WINNER! 🏆
          </div>
        </div>

        {/* Character Sprite - Middle */}
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <div
              className="w-20 h-20"
              style={{
                backgroundImage: `url(/chars/${winnerData?.agentId || '1'}.png)`,
                backgroundSize: '576px 576px', // Original sprite sheet size
                backgroundPosition: '-0px -0px', // Test with first frame (top-left)
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated'
              }}
            />
          </div>
        </div>

        {/* Winner Name - Bottom */}
        <div className="text-center">
          <div className="text-yellow-700 font-mono text-lg">
            {winnerData?.characterName || `Agent #${winnerData?.agentId || '1'}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinnerPopup;
