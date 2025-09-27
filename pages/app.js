import WalletConnect from '../components/WalletConnect';

import { useState } from 'react';

export default function App() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const maxScroll = 500; // Adjust based on your room width

  const scrollLeft = () => {
    setScrollPosition(prev => Math.max(0, prev - 100));
  };

  const scrollRight = () => {
    setScrollPosition(prev => Math.min(maxScroll, prev + 100));
  };

  return (
    <div className="w-full bg-black relative overflow-hidden" style={{ height: '100vh' }}>
      {/* 2D Room Background - Match image height, horizontal scrollable */}
      <div 
        className="w-full bg-no-repeat transition-transform duration-300 ease-out"
        style={{
          backgroundImage: 'url(/room.png)',
          backgroundSize: 'contain', // Show full image without cropping
          backgroundPosition: `${scrollPosition}px 0%`, // Horizontal scroll
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          height: '100vh', // Full viewport height
          minWidth: '200%' // Make it wider for horizontal scrolling
        }}
      />
      
      {/* Wallet Connect Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <WalletConnect />
      </div>

      {/* Scroll Buttons */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-4">
        {/* Left Scroll Button */}
        <button
          onClick={scrollLeft}
          disabled={scrollPosition <= 0}
          className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #00ff00'
          }}
        >
          ← SCROLL LEFT
        </button>

        {/* Right Scroll Button */}
        <button
          onClick={scrollRight}
          disabled={scrollPosition >= maxScroll}
          className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #00ff00'
          }}
        >
          SCROLL RIGHT →
        </button>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
          <div className="text-green-400 font-mono text-sm">
            {Math.round((scrollPosition / maxScroll) * 100)}% • {scrollPosition}px
          </div>
        </div>
      </div>
    </div>
  );
}
