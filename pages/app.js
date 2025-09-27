import WalletConnect from '../components/WalletConnect';
import Character from '../components/Character';
import { useState, useEffect } from 'react';

export default function App() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  
  // Calculate max scroll based on image dimensions (9270 × 3700)
  // Image aspect ratio: 9270/3700 = 2.5
  useEffect(() => {
    const calculateDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const imageAspectRatio = 9270 / 3700; // 2.5
      const imageDisplayWidth = viewportHeight * imageAspectRatio;
      const maxScrollValue = Math.max(0, imageDisplayWidth - viewportWidth);
      
      setImageWidth(imageDisplayWidth);
      setImageHeight(viewportHeight);
      setMaxScroll(maxScrollValue);
    };
    
    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, []);

  const scrollLeft = () => {
    setScrollPosition(prev => {
      const newPos = prev - 200;
      console.log('Scrolling left, new position:', newPos);
      return Math.max(0, newPos);
    });
  };

  const scrollRight = () => {
    setScrollPosition(prev => {
      const newPos = prev + 200;
      console.log('Scrolling right, new position:', newPos);
      return Math.min(maxScroll, newPos);
    });
  };

  return (
    <div className="w-full bg-black relative overflow-hidden" style={{ height: '100vh' }}>
      {/* 2D Room Background - Match image height, horizontal scrollable */}
      <div 
        className="bg-no-repeat transition-transform duration-300 ease-out"
        style={{
          backgroundImage: 'url(/room.png)',
          backgroundSize: 'contain', // Show full image without cropping
          backgroundPosition: '0% 0%',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          height: '100vh', // Full viewport height
          width: `${imageWidth}px`, // Calculate width based on image aspect ratio
          transform: `translateX(-${scrollPosition}px)`, // Use transform for scrolling
        }}
      />
      
      {/* Character - Positioned relative to the image container */}
      {imageWidth > 0 && imageHeight > 0 && (
        <div 
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
            transform: `translateX(-${scrollPosition}px)`,
          }}
        >
          <Character 
            roomWidth={imageWidth}
            roomHeight={imageHeight}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
        </div>
      )}

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
          className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold w-12 h-12 rounded-full border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50 flex items-center justify-center"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #00ff00'
          }}
        >
          ←
        </button>

        {/* Right Scroll Button */}
        <button
          onClick={scrollRight}
          disabled={scrollPosition >= maxScroll}
          className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold w-12 h-12 rounded-full border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50 flex items-center justify-center"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #00ff00'
          }}
        >
          →
        </button>
      </div>

    </div>
  );
}
